// 数据库连接工具
const mongoose = require('mongoose');

class Database {
  constructor() {
    this.mongoose = mongoose;
    this.isConnected = false;
  }

  // 连接数据库
  async connect() {
    if (this.isConnected) {
      console.log('✅ 数据库已连接');
      return;
    }

    try {
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/weco_cafe';
      
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4 // 使用 IPv4
      };

      await mongoose.connect(MONGODB_URI, options);
      
      this.isConnected = true;
      console.log('✅ MongoDB连接成功');
      console.log(`📊 数据库: ${mongoose.connection.db.databaseName}`);
      console.log(`📡 主机: ${mongoose.connection.host}:${mongoose.connection.port}`);
      
      // 监听连接事件
      mongoose.connection.on('connected', () => {
        console.log('✅ MongoDB重新连接成功');
        this.isConnected = true;
      });
      
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB连接错误:', err.message);
        this.isConnected = false;
      });
      
      mongoose.connection.on('disconnected', () => {
        console.log('⚠️  MongoDB连接断开');
        this.isConnected = false;
      });
      
      // 进程退出时关闭连接
      process.on('SIGINT', this.close.bind(this));
      process.on('SIGTERM', this.close.bind(this));
      
    } catch (error) {
      console.error('❌ MongoDB连接失败:', error.message);
      console.log('⚠️  将使用内存数据模式');
      this.isConnected = false;
    }
  }

  // 关闭数据库连接
  async close() {
    if (!this.isConnected) return;
    
    try {
      await mongoose.connection.close();
      this.isConnected = false;
      console.log('✅ MongoDB连接已关闭');
    } catch (error) {
      console.error('❌ 关闭数据库连接失败:', error.message);
    }
  }

  // 检查数据库连接状态
  getStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      dbName: mongoose.connection.db?.databaseName,
      host: mongoose.connection.host,
      port: mongoose.connection.port
    };
  }

  // 健康检查
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', message: '数据库未连接' };
      }
      
      // 执行一个简单的查询来检查连接
      await mongoose.connection.db.admin().ping();
      return { status: 'healthy', message: '数据库连接正常' };
    } catch (error) {
      return { status: 'unhealthy', message: `数据库健康检查失败: ${error.message}` };
    }
  }

  // 获取数据库统计信息
  async getStats() {
    if (!this.isConnected) {
      return { error: '数据库未连接' };
    }
    
    try {
      const adminDb = mongoose.connection.db.admin();
      const serverStatus = await adminDb.serverStatus();
      
      const collections = await mongoose.connection.db.listCollections().toArray();
      
      return {
        server: {
          version: serverStatus.version,
          uptime: serverStatus.uptime,
          connections: serverStatus.connections
        },
        collections: collections.map(c => c.name),
        totalCollections: collections.length
      };
    } catch (error) {
      console.error('获取数据库统计信息失败:', error);
      return { error: error.message };
    }
  }
}

// 创建单例实例
const database = new Database();

module.exports = database;