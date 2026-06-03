// WECO CAFE 后端API服务 - MongoDB版
// 部署于 Vercel + MongoDB Atlas（免備案、數據持久化）

import { MongoClient } from 'mongodb';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { readFileSync } from 'fs';

// 加载 .env 环境变量
try {
  const envPath = new URL('./.env', import.meta.url);
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
  console.log('[Env] .env 文件已加载');
} catch (e) {
  // .env 文件不存在，使用代码中硬编码的默认值
  console.log('[Env] 未找到 .env 文件，使用默认配置');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 全局未捕获异常处理器
process.on('uncaughtException', (err) => {
  console.error('[Server] 未捕获异常:', err.message, err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] 未处理的Promise拒绝:', reason);
});

const app = express();
const PORT = process.env.PORT || 3000;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// 中間件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====== Socket.IO 實時通信服務 ======
io.on('connection', (socket) => {
  console.log(`[Socket.IO] 客戶端連接: ${socket.id}`);
  
  // 發送歡迎消息
  socket.emit('welcome', { 
    message: '已連接至WECO CAFE實時服務',
    serverTime: new Date().toISOString(),
    connectedClients: io.engine.clientsCount
  });
  
  // 訂閱數據更新
  socket.on('subscribe', (data) => {
    const { collections = ['products', 'shopInfo', 'miniapp_settings'] } = data;
    console.log(`[Socket.IO] ${socket.id} 訂閱集合:`, collections);
    socket.join(collections.map(col => `updates:${col}`));
    socket.emit('subscribed', { collections });
  });
  
  // 取消訂閱
  socket.on('unsubscribe', (data) => {
    const { collections } = data;
    if (collections) {
      collections.forEach(col => {
        socket.leave(`updates:${col}`);
      });
      console.log(`[Socket.IO] ${socket.id} 取消訂閱集合:`, collections);
    }
  });
  
  // 心跳檢測
  socket.on('ping', (data) => {
    socket.emit('pong', { ...data, serverTime: new Date().toISOString() });
  });
  
  // 斷開連接處理
  socket.on('disconnect', (reason) => {
    console.log(`[Socket.IO] 客戶端斷開: ${socket.id}, 原因: ${reason}`);
  });
});

// ====== 數據版本追蹤（用於小程序輪詢刷新）======
const dataVersion = {
  products: Date.now(),
  shopInfo: Date.now(),
  orders: Date.now(),
  categories: Date.now(),
  'miniapp_settings': Date.now(),

  bump(collection) {
    this[collection] = Date.now()
    console.log(`[DataVersion] ${collection} → ${this[collection]}`)
  },

  getAll() {
    return { ...this }
  }
}

// 廣播數據更新事件的輔助函數
function broadcastDataUpdate(collection, operation, data) {
  // 更新版本號，通知小程序刷新
  dataVersion.bump(collection)
  const event = {
    type: 'DATA_UPDATED',
    collection,
    operation, // 'CREATE', 'UPDATE', 'DELETE'
    data,
    timestamp: new Date().toISOString()
  };
  io.to(`updates:${collection}`).emit('data_update', event);
  console.log(`[Socket.IO] 廣播 ${collection} ${operation} 事件`);
}



// ====== MongoDB 連接配置 ======
// 優先使用環境變量中的連接字符串
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://ronkou:rondan1228@wearmo.oflm07j.mongodb.net/?appName=WEARMO';
const DB_NAME = process.env.MONGO_DB_NAME || 'weco-cafe';

let client = null;
let db = null;

// MongoDB 連接（帶連接池復用）
async function getDb() {
  if (db) return db;

  const opts = {
    maxPoolSize: 10,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000,
    retryWrites: true,
  };

  try {
    client = new MongoClient(MONGO_URI, opts);
    await client.connect();
    db = client.db(DB_NAME);
    console.log('[MongoDB] ✅ 已連接:', DB_NAME);
    return db;
  } catch (err) {
    console.warn('[MongoDB] ⚠️ 連接失敗，返回模擬數據庫（僅限測試）:', err.message);
    // 返回一個模擬的數據庫對象，避免API完全崩潰
    return {
      collection: (name) => ({
        find: () => ({ toArray: async () => [] }),
        findOne: async () => null,
        countDocuments: async () => 0,
        insertOne: async () => ({ insertedId: 'mock_id' }),
        insertMany: async () => ({ insertedCount: 0 }),
        findOneAndUpdate: async () => ({ value: null }),
        deleteOne: async () => ({ deletedCount: 0 }),
        deleteMany: async () => ({ deletedCount: 0 }),
        updateOne: async () => ({ modifiedCount: 0 }),
      }),
      admin: () => ({ ping: async () => {} }),
    };
  }
}

// 初始化默認數據
async function initDefaults() {
  let database;
  try {
    database = await getDb();
  } catch (err) {
    console.warn('[Init] ⚠️ 數據庫連接失敗，跳過初始化:', err.message);
    return;
  }

  // 確保默認管理員存在
  const usersCount = await database.collection('users').countDocuments();
  if (usersCount === 0) {
    await database.collection('users').insertOne({
      id: 1,
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      createdAt: new Date()
    });
    console.log('[Init] ✅ 默認管理員已創建');
  }

  // 確保默認店鋪信息存在
  const shopInfo = await database.collection('shopInfo').findOne({});
  if (!shopInfo) {
    await database.collection('shopInfo').insertOne({
      name: 'WECO CAFE',
      address: 'Macau',
      phone: '+853 1234 5678',
      hours: '09:00 - 20:00'
    });
    console.log('[Init] ✅ 默認店鋪信息已創建');
  }

  // 確保默認小程序設置存在
  const miniappSettingsCount = await database.collection('miniapp_settings').countDocuments();
  if (miniappSettingsCount === 0) {
    const defaultSettings = [
      {
        type: 'homepage_buttons',
        data: [
          { id: 1, title: '立即下單', icon: 'cart', link: '/pages/menu/menu', sortOrder: 1 },
          { id: 2, title: '會員專區', icon: 'vip', link: '/pages/member/member', sortOrder: 2 },
          { id: 3, title: '優惠活動', icon: 'discount', link: '/pages/promotions/promotions', sortOrder: 3 },
          { id: 4, title: '門店資訊', icon: 'location', link: '/pages/shop/shop', sortOrder: 4 }
        ],
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'banners',
        data: [
          { id: 1, imageUrl: '', link: '/pages/menu/menu', title: '新品上市', description: '季節限定特調', sortOrder: 1 },
          { id: 2, imageUrl: '', link: '/pages/promotions/promotions', title: '全場85折', description: '限時優惠', sortOrder: 2 }
        ],
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'services',
        data: [
          { id: 1, title: '外送服務', description: '3公里內免運費', icon: 'delivery', sortOrder: 1 },
          { id: 2, title: '自助點餐', description: '掃碼點餐免排隊', icon: 'qr-code', sortOrder: 2 },
          { id: 3, title: '會員積分', description: '消費累積兌好禮', icon: 'points', sortOrder: 3 }
        ],
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'tabbar_icons',
        data: {
          home: { normal: '', active: '' },
          menu: { normal: '', active: '' },
          cart: { normal: '', active: '' },
          profile: { normal: '', active: '' }
        },
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'shop_card',
        data: {
          backgroundImage: '',
          style: { backgroundColor: '#ffffff', borderRadius: '12px' }
        },
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    await database.collection('miniapp_settings').insertMany(defaultSettings);
    console.log('[Init] ✅ 默認小程序設置已創建，共', defaultSettings.length, '項');
  }
}

// ====== 小程序輪詢接口：客戶端定期拉取版本號，有變化則重新請求數據 ======
app.get('/api/poll/version', (req, res) => {
  res.json({
    success: true,
    versions: dataVersion.getAll(),
    serverTime: new Date().toISOString()
  })
})

// 健康檢查（不依賴DB）
app.get('/health', async (req, res) => {
  try {
    let dbStatus = 'disconnected';
    try {
      const database = await getDb();
      await database.admin().ping();
      dbStatus = 'connected';
    } catch(e) {}
    
    res.json({
      status: 'ok',
      service: 'WECO CAFE API',
      version: '2.0.0-mongodb',
      database: dbStatus,
      timestamp: new Date().toISOString()
    });
  } catch(err) {
    res.json({ status: 'ok', service: 'WECO CAFE API', database: 'error' });
  }
});

// 根路徑
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'WECO CAFE Backend API', version: '2.0.0', db: 'mongodb' });
});

// ====== 路由（全部改為異步 + MongoDB）======

// 管理員登錄
app.post('/api/admin/login', async (req, res) => {
  try {
    const database = await getDb();
    const { username, password } = req.body;
    const user = await database.collection('users').findOne({ username, password });
    if (user) {
      const token = 'token_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      res.json({
        success: true,
        token: token,
        user: { id: user.id, username: user.username, role: user.role },
        adminInfo: { id: user.id, name: user.name || '系統管理員', username: user.username, role: user.role || 'superadmin' }
      });
    } else {
      res.status(401).json({ success: false, message: '用戶名或密碼錯誤' });
    }
  } catch(err) {
    res.status(500).json({ success: false, message: '服務器錯誤' });
  }
});

// 獲取菜單/商品
app.get('/api/menu', async (req, res) => {
  try {
    const database = await getDb();
    const products = await database.collection('products').find({}).sort({ category: 1 }).toArray();
    const categories = await database.collection('categories').find({}).sort({ sort: 1 }).toArray();
    res.json({ success: true, data: { products, categories } });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 商品 CRUD
app.get('/api/products', async (req, res) => {
  try {
    const database = await getDb();
    const products = await database.collection('products').find({}).toArray();
    res.json({ success: true, data: products });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const database = await getDb();
    const product = { id: Date.now(), createdAt: new Date().toISOString(), ...req.body };
    await database.collection('products').insertOne(product);
    // 广播实时更新事件
    broadcastDataUpdate('products', 'CREATE', product);
    res.json({ success: true, data: product });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const database = await getDb();
    const result = await database.collection('products').findOneAndUpdate(
      { id: Number(req.params.id) || req.params.id },
      { $set: { ...req.body, updatedAt: new Date().toISOString() } },
      { returnDocument: 'after' }
    );
    if (result.value) {
      // 广播实时更新事件
      broadcastDataUpdate('products', 'UPDATE', result.value);
      res.json({ success: true, data: result.value });
    } else {
      res.status(404).json({ success: false, message: '商品不存在' });
    }
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const database = await getDb();
    const productId = Number(req.params.id) || req.params.id;
    // 先查询商品，用于广播事件
    const product = await database.collection('products').findOne({ id: productId });
    if (!product) {
      return res.status(404).json({ success: false, message: '商品不存在' });
    }
    await database.collection('products').deleteOne({ id: productId });
    // 广播实时更新事件
    broadcastDataUpdate('products', 'DELETE', product);
    res.json({ success: true });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 批量同步商品（前台後台多端同步用）
app.post('/api/sync/products', async (req, res) => {
  try {
    const database = await getDb();
    const { products } = req.body;
    if (!Array.isArray(products)) {
      return res.status(400).json({ success: false, message: 'products must be an array' });
    }
    
    // 清空現有商品
    await database.collection('products').deleteMany({});
    
    // 重新插入所有商品
    const docs = products.map(p => ({
      ...p,
      syncedAt: new Date().toISOString()
    }));
    
    if (docs.length > 0) {
      await database.collection('products').insertMany(docs);
    }
    
    console.log(`[Sync] Batch sync products: ${docs.length} items`);
    
    // 广播同步完成事件，通知所有客户端重新获取数据
    const event = {
      type: 'DATA_UPDATED',
      collection: 'products',
      operation: 'SYNC',
      data: { count: docs.length, syncedAt: new Date().toISOString() },
      timestamp: new Date().toISOString()
    };
    dataVersion.bump('products')
    io.to('updates:products').emit('data_update', event)
    
    res.json({ success: true, message: `Synced ${docs.length} products`, count: docs.length });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 分類 CRUD
app.get('/api/categories', async (req, res) => {
  try {
    const database = await getDb();
    const categories = await database.collection('categories').find({}).sort({ sort: 1 }).toArray();
    res.json({ success: true, data: categories });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const database = await getDb();
    const cat = { id: Date.now(), ...req.body };
    await database.collection('categories').insertOne(cat);
    // 广播实时更新事件
    broadcastDataUpdate('categories', 'CREATE', cat);
    res.json({ success: true, data: cat });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const database = await getDb();
    const result = await database.collection('categories').findOneAndUpdate(
      { id: Number(req.params.id) || req.params.id },
      { $set: req.body },
      { returnDocument: 'after' }
    );
    if (result.value) {
      // 广播实时更新事件
      broadcastDataUpdate('categories', 'UPDATE', result.value);
      res.json({ success: true, data: result.value });
    } else {
      res.status(404).json({ success: false, message: '分類不存在' });
    }
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const database = await getDb();
    const categoryId = Number(req.params.id) || req.params.id;
    // 先查询分类，用于广播事件
    const category = await database.collection('categories').findOne({ id: categoryId });
    if (!category) {
      return res.status(404).json({ success: false, message: '分類不存在' });
    }
    await database.collection('categories').deleteOne({ id: categoryId });
    // 广播实时更新事件
    broadcastDataUpdate('categories', 'DELETE', category);
    res.json({ success: true });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 訂單 CRUD
app.get('/api/orders', async (req, res) => {
  try {
    const database = await getDb();
    const orders = await database.collection('orders').find({}).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, data: orders });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const database = await getDb();
    const order = { 
      id: 'ORD' + Date.now(), 
      status: 'pending', 
      createdAt: new Date().toISOString(), 
      ...req.body 
    };
    await database.collection('orders').insertOne(order);
    res.json({ success: true, data: order });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const database = await getDb();
    const result = await database.collection('orders').findOneAndUpdate(
      { id: req.params.id },
      { $set: { status: req.body.status, updatedAt: new Date().toISOString() } },
      { returnDocument: 'after' }
    );
    if (result.value) {
      res.json({ success: true, data: result.value });
    } else {
      res.status(404).json({ success: false, message: '訂單不存在' });
    }
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ====== 訂單狀態操作（接單/拒單/完成/收款）======
app.post('/api/orders/:id/accept', async (req, res) => {
  try {
    const database = await getDb();
    const result = await database.collection('orders').findOneAndUpdate(
      { id: req.params.id },
      { $set: { status: 'accepted', acceptedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } },
      { returnDocument: 'after' }
    );
    if (result.value) {
      res.json({ success: true, data: result.value });
    } else {
      res.status(404).json({ success: false, message: '訂單不存在' });
    }
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/orders/:id/reject', async (req, res) => {
  try {
    const database = await getDb();
    const result = await database.collection('orders').findOneAndUpdate(
      { id: req.params.id },
      { $set: { status: 'rejected', rejectReason: req.body.reason || '', rejectedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } },
      { returnDocument: 'after' }
    );
    if (result.value) {
      res.json({ success: true, data: result.value });
    } else {
      res.status(404).json({ success: false, message: '訂單不存在' });
    }
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/orders/:id/complete', async (req, res) => {
  try {
    const database = await getDb();
    const result = await database.collection('orders').findOneAndUpdate(
      { id: req.params.id },
      { $set: { status: 'completed', completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } },
      { returnDocument: 'after' }
    );
    if (result.value) {
      res.json({ success: true, data: result.value });
    } else {
      res.status(404).json({ success: false, message: '訂單不存在' });
    }
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/orders/:id/pay', async (req, res) => {
  try {
    const database = await getDb();
    const result = await database.collection('orders').findOneAndUpdate(
      { id: req.params.id },
      { $set: { status: 'paid', paymentMethod: req.body.paymentMethod || 'cash', paidAt: new Date().toISOString(), updatedAt: new Date().toISOString() } },
      { returnDocument: 'after' }
    );
    if (result.value) {
      res.json({ success: true, data: result.value });
    } else {
      res.status(404).json({ success: false, message: '訂單不存在' });
    }
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 增量輪詢：獲取指定時間後的新訂單（用於POS實時通知）
app.get('/api/orders/poll', async (req, res) => {
  try {
    const database = await getDb();
    const since = req.query.since;
    let query = {};
    if (since) {
      query.createdAt = { $gt: new Date(since) };
    }
    // 只返回 pending 和 accepted 狀態的活躍訂單
    query.status = { $in: ['pending', 'accepted'] };

    const orders = await database.collection('orders')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      data: orders,
      count: orders.length,
      serverTime: new Date().toISOString(),
      polledAt: new Date().toISOString()
    });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 獲取最新訂單時間戳（用於增量檢測）
app.get('/api/orders/latest', async (req, res) => {
  try {
    const database = await getDb();
    const latest = await database.collection('orders')
      .find({}, { sort: { createdAt: -1 }, limit: 1 })
      .toArray();

    res.json({
      success: true,
      latestOrderTime: latest.length > 0 ? latest[0].createdAt : null,
      totalOrders: await database.collection('orders').countDocuments({})
    });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 店鋪信息
app.get('/api/shop/info', async (req, res) => {
  try {
    const database = await getDb();
    const shopInfo = await database.collection('shopInfo').findOne({});
    res.json({ success: true, data: shopInfo || {} });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/shop/info', async (req, res) => {
  try {
    const database = await getDb();
    await database.collection('shopInfo').updateOne(
      {},
      { $set: { ...req.body, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );
    const shopInfo = await database.collection('shopInfo').findOne({});
    // 广播实时更新事件
    broadcastDataUpdate('shopInfo', 'UPDATE', shopInfo);
    res.json({ success: true, data: shopInfo });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 小程序设置管理
app.get('/api/miniapp/settings', async (req, res) => {
  try {
    const database = await getDb();
    const settings = await database.collection('miniapp_settings').find({}).toArray();
    res.json({ success: true, data: settings });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/miniapp/settings', async (req, res) => {
  try {
    const database = await getDb();
    const { type, data } = req.body;
    if (!type || !data) {
      return res.status(400).json({ success: false, message: 'type和data字段必填' });
    }
    const result = await database.collection('miniapp_settings').findOneAndUpdate(
      { type },
      { $set: { data, updatedAt: new Date().toISOString() } },
      { returnDocument: 'after', upsert: true }
    );
    const updatedSetting = result.value || { type, data, updatedAt: new Date().toISOString() };
    // 广播实时更新事件
    broadcastDataUpdate('miniapp_settings', 'UPDATE', updatedSetting);
    res.json({ success: true, data: updatedSetting });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 會員 CRUD
app.get('/api/members', async (req, res) => {
  try {
    const database = await getDb();
    const members = await database.collection('members').find({}).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, data: members });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/members', async (req, res) => {
  try {
    const database = await getDb();
    const member = { id: Date.now(), points: 0, level: 1, createdAt: new Date().toISOString(), ...req.body };
    await database.collection('members').insertOne(member);
    res.json({ success: true, data: member });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/members/:id', async (req, res) => {
  try {
    const database = await getDb();
    const result = await database.collection('members').findOneAndUpdate(
      { id: Number(req.params.id) || req.params.id },
      { $set: { ...req.body, updatedAt: new Date().toISOString() } },
      { returnDocument: 'after' }
    );
    if (result.value) {
      res.json({ success: true, data: result.value });
    } else {
      res.status(404).json({ success: false, message: '會員不存在' });
    }
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 優惠券 CRUD
app.get('/api/coupons', async (req, res) => {
  try {
    const database = await getDb();
    const coupons = await database.collection('coupons').find({}).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, data: coupons });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/coupons', async (req, res) => {
  try {
    const database = await getDb();
    const coupon = { id: Date.now(), createdAt: new Date().toISOString(), ...req.body };
    await database.collection('coupons').insertOne(coupon);
    res.json({ success: true, data: coupon });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/coupons/:id', async (req, res) => {
  try {
    const database = await getDb();
    const result = await database.collection('coupons').findOneAndUpdate(
      { id: Number(req.params.id) || req.params.id },
      { $set: { ...req.body, updatedAt: new Date().toISOString() } },
      { returnDocument: 'after' }
    );
    if (result.value) {
      res.json({ success: true, data: result.value });
    } else {
      res.status(404).json({ success: false, message: '優惠券不存在' });
    }
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/coupons/:id', async (req, res) => {
  try {
    const database = await getDb();
    await database.collection('coupons').deleteOne({ id: Number(req.params.id) || req.params.id });
    res.json({ success: true });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ====== 小程序設定（多端同步：POS ↔ 小程序）======

// 初始化小程序設定默認數據
async function initShopSettings() {
  const database = await getDb();

  // 快速操作按鈕
  const qa = await database.collection('quickActions').findOne({});
  if (!qa) {
    await database.collection('quickActions').insertOne({
      menu: { icon: '/images/menu-banner.png', text: '查看菜單' },
      cart: { icon: '/images/cart.png', text: '購物車' },
      order: { icon: '/images/orders.png', text: '我的訂單' }
    });
  }

  // 導航圖/banners
  const banners = await database.collection('banners').countDocuments();
  if (banners === 0) {
    await database.collection('banners').insertMany([
      { id: 1, image: '/images/banner1.jpg', title: '新鮮烘焙咖啡豆', link: '', sortOrder: 0, enabled: true },
      { id: 2, image: '/images/banner2.jpg', title: '手工精緻甜點', link: '', sortOrder: 1, enabled: true },
      { id: 3, image: '/images/banner3.jpg', title: '舒適用餐環境', link: '', sortOrder: 2, enabled: false }
    ]);
  }

  // 特色服務/services
  const services = await database.collection('services').countDocuments();
  if (services === 0) {
    await database.collection('services').insertMany([
      { id: 1, icon: 'coffee-o', title: '新鮮烘焙咖啡豆', description: '每日新鮮烘焙，保證咖啡豆的最佳風味', sortOrder: 0 },
      { id: 2, icon: 'logistics', title: '快速外送服務', description: '30分鐘內送達，確保咖啡溫熱如初', sortOrder: 1 },
      { id: 3, icon: 'wifi-o', title: '免費Wi-Fi', description: '高速網絡，適合工作與休閒', sortOrder: 2 },
      { id: 4, icon: 'car-o', title: '便利停車', description: '充足停車位，方便顧客停車', sortOrder: 3 }
    ]);
  }

  // 店資料底圖
  const bg = await database.collection('storeCardBg').findOne({});
  if (!bg) {
    await database.collection('storeCardBg').insertOne({
      image: '/images/store-card-bg.png',
      updatedAt: new Date().toISOString()
    });
  }

  console.log('[Init] ✅ 小程序設定默認數據已創建');
    dataVersion.bump('miniapp_settings')
    dataVersion.bump('shopInfo')
}

// 啟動時初始化（追加到 initDefaults 後）
const origInit = initDefaults;
initDefaults = async function() {
  await origInit();
  try { await initShopSettings(); } catch(e) { console.warn('[Init] 小程序設定初始化跳過:', e.message); }
};

// --- GET /api/settings/all — 一次性獲取所有小程序設定 ---
app.get('/api/settings/all', async (req, res) => {
  try {
    const database = await getDb();
    const [shopInfo, quickActions, banners, services, storeCardBg] = await Promise.all([
      database.collection('shopInfo').findOne({}),
      database.collection('quickActions').findOne({}),
      database.collection('banners').find({}).sort({ sortOrder: 1 }).toArray(),
      database.collection('services').find({}).sort({ sortOrder: 1 }).toArray(),
      database.collection('storeCardBg').findOne({})
    ]);
    res.json({
      success: true,
      data: {
        shopInfo: shopInfo || {},
        quickActions: quickActions || {},
        banners: banners || [],
        services: services || [],
        storeCardBgImage: storeCardBg?.image || ''
      }
    });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- PUT /api/settings/quickActions ---
app.put('/api/settings/quickActions', async (req, res) => {
  try {
    const database = await getDb();
    await database.collection('quickActions').updateOne(
      {}, { $set: { ...req.body, updatedAt: new Date().toISOString() } }, { upsert: true }
    );
    const data = await database.collection('quickActions').findOne({});
    res.json({ success: true, data });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- PUT /api/settings/banners ---
app.put('/api/settings/banners', async (req, res) => {
  try {
    const database = await getDb();
    const { banners } = req.body;
    if (!Array.isArray(banners)) return res.status(400).json({ success: false, message: 'banners must be array' });
    // 全量替換
    await database.collection('banners').deleteMany({});
    if (banners.length > 0) {
      await database.collection('banners').insertMany(banners.map((b, i) => ({
        ...b,
        sortOrder: b.sortOrder ?? i,
        updatedAt: new Date().toISOString()
      })));
    }
    const data = await database.collection('banners').find({}).sort({ sortOrder: 1 }).toArray();
    res.json({ success: true, data, count: data.length });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- PUT /api/settings/services ---
app.put('/api/settings/services', async (req, res) => {
  try {
    const database = await getDb();
    const { services } = req.body;
    if (!Array.isArray(services)) return res.status(400).json({ success: false, message: 'services must be array' });
    await database.collection('services').deleteMany({});
    if (services.length > 0) {
      await database.collection('services').insertMany(services.map((s, i) => ({
        ...s,
        sortOrder: s.sortOrder ?? i,
        updatedAt: new Date().toISOString()
      })));
    }
    const data = await database.collection('services').find({}).sort({ sortOrder: 1 }).toArray();
    res.json({ success: true, data, count: data.length });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- PUT /api/settings/storeCardBg ---
app.put('/api/settings/storeCardBg', async (req, res) => {
  try {
    const database = await getDb();
    const { image } = req.body;
    await database.collection('storeCardBg').updateOne(
      {}, { $set: { image, updatedAt: new Date().toISOString() } }, { upsert: true }
    );
    const data = await database.collection('storeCardBg').findOne({});
    res.json({ success: true, data });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- GET /api/miniapp/settings ---
app.get('/api/miniapp/settings', async (req, res) => {
  try {
    const database = await getDb();
    const settings = await database.collection('miniapp_settings').find({}).toArray();
    res.json({
      success: true,
      data: settings,
      count: settings.length
    });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- PUT /api/miniapp/settings ---
app.put('/api/miniapp/settings', async (req, res) => {
  try {
    const { type, data } = req.body;
    if (!type) return res.status(400).json({ success: false, message: 'type is required' });
    
    const database = await getDb();
    const now = new Date().toISOString();
    
    // 查找現有文檔
    const existing = await database.collection('miniapp_settings').findOne({ type });
    
    let result;
    if (existing) {
      // 更新現有文檔
      result = await database.collection('miniapp_settings').findOneAndUpdate(
        { type },
        { $set: { data, updatedAt: now, version: (existing.version || 0) + 1 } },
        { returnDocument: 'after' }
      );
    } else {
      // 創建新文檔
      const newDoc = {
        type,
        data,
        version: 1,
        createdAt: now,
        updatedAt: now
      };
      result = await database.collection('miniapp_settings').insertOne(newDoc);
      // 獲取插入的文檔
      newDoc._id = result.insertedId;
      result.value = newDoc;
    }
    
    // 廣播更新事件
    try {
      broadcastDataUpdate('miniapp_settings', 'UPDATE', { type, data });
    } catch (broadcastErr) {
      console.warn('[Broadcast] 廣播失敗:', broadcastErr.message);
    }
    
    res.json({
      success: true,
      data: result.value,
      operation: existing ? 'updated' : 'created'
    });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ====== POS 管理後台靜態文件服務 ======
// 服務 POS 前端靜態文件（/admin/ 路徑）
app.use('/admin', express.static(path.join(__dirname, 'public/admin'), {
  index: 'index.html',
  maxAge: '1h'
}));

// POS SPA fallback: 所有 /admin/* 路由返回 index.html（Vue Router 處理）
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin', 'index.html'));
});

// 404處理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API端點不存在',
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
    db: 'mongodb'
  });
});

// 錯誤處理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '服務器內部錯誤',
    timestamp: new Date().toISOString()
  });
});

// 啟動服務器
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('[Server] 開始啟動服務器...');
  // 先啟動服務器，然後異步初始化數據庫（失敗不影響服務）
  httpServer.listen(PORT, () => {
    console.log(`🚀 WECO CAFE API v2.0 (MongoDB) running on port ${PORT}`);
    console.log(`🔌 Socket.IO 實時服務已啟動 (客戶端連接: ws://localhost:${PORT})`);
    
    // 異步嘗試初始化數據庫（只記錄日誌，不阻止服務器）
    initDefaults().catch(err => {
      console.warn('[Server] 數據庫初始化失敗，但服務器已啟動（僅限測試）:', err.message);
    });
  });
}

// 導出給 Vercel / Serverless 平台使用
export default app;
