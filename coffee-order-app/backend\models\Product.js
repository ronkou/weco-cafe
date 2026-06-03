// 商品模型
// 修复记录：
//   [P0] updateStock 改为原子操作静态方法，防止并发超卖
//   [P1] 字段增加长度限制和合理范围校验
//   [P1] 增加 pre-save XSS sanitize（需安装 sanitize-html）
//   [P1] isAvailable() 补全 dailyLimit 判断逻辑
//   [P2] 明确错误消息，移除空注释块

const mongoose = require('mongoose');

// ─────────────────────────────────────────────
//  子文档：商品选项（如：温度、糖度、规格）
// ─────────────────────────────────────────────
const productOptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '选项名称不能为空'],
    trim: true,
    maxlength: [20, '选项名称不能超过20个字符']
  },
  values: [{
    type: String,
    required: true,
    trim: true
  }],
  required: {
    type: Boolean,
    default: false
  }
});

// ─────────────────────────────────────────────
//  主文档：商品
// ─────────────────────────────────────────────
const productSchema = new mongoose.Schema({
  // 商品基本信息
  name: {
    type: String,
    required: [true, '商品名称不能为空'],
    trim: true,
    minlength: [2, '商品名称至少2个字符'],
    maxlength: [50, '商品名称不能超过50个字符']
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, '分类不能为空'],
    index: true
  },

  // 价格信息
  price: {
    type: Number,
    required: [true, '价格不能为空'],
    min: [0, '价格不能为负数'],
    max: [99999, '价格超出合理范围（最大99999）']
  },
  originalPrice: {
    type: Number,
    default: null,
    min: [0, '原价不能为负数']
  },

  // 描述信息（写入前会自动 sanitize，见 pre-save hook）
  description: {
    type: String,
    default: '',
    maxlength: [500, '描述不能超过500个字符']
  },
  shortDescription: {
    type: String,
    default: '',
    maxlength: [100, '简短描述不能超过100个字符']
  },

  // 图片
  imageUrl: {
    type: String,
    default: ''
  },
  imageUrls: [{
    type: String
  }],

  // 选项和定制
  options: [productOptionSchema],

  // 库存信息
  stock: {
    type: Number,
    default: 0,
    min: [0, '库存不能为负数']
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: [0, '低库存阈值不能为负数']
  },

  // 销售信息
  salesCount: {
    type: Number,
    default: 0,
    min: 0
  },
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },

  // 分类和标签
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, '标签不能超过20个字符'],
    index: true
  }],

  // 状态
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'out_of_stock', 'coming_soon'],
      message: '状态值 {VALUE} 不合法'
    },
    default: 'active'
  },

  // 排序和展示
  sortOrder: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isRecommended: {
    type: Boolean,
    default: false
  },

  // 营养信息（可选）
  nutrition: {
    calories: { type: Number, default: 0, min: 0 },
    protein:  { type: Number, default: 0, min: 0 },
    fat:      { type: Number, default: 0, min: 0 },
    carbs:    { type: Number, default: 0, min: 0 }
  },

  // 制作时间（分钟）
  preparationTime: {
    type: Number,
    default: 5,
    min: [1, '制作时间至少1分钟'],
    max: [120, '制作时间不能超过120分钟']
  },

  // 每日限购数量（null 表示不限）
  dailyLimit: {
    type: Number,
    default: null,
    min: [1, '每日限购至少1件']
  }
}, {
  timestamps: true  // 自动维护 createdAt 和 updatedAt
});

// ─────────────────────────────────────────────
//  索引
// ─────────────────────────────────────────────
productSchema.index({ categoryId: 1, status: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isRecommended: 1 });
productSchema.index({ salesCount: -1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

// ─────────────────────────────────────────────
//  Hooks
// ─────────────────────────────────────────────

/**
 * [P1 修复] 保存前清理 description/shortDescription 中的 HTML 标签，防止 XSS
 * 依赖：npm install sanitize-html
 * 若暂未安装，该 hook 会跳过处理并打印警告
 */
productSchema.pre('save', function(next) {
  let sanitizeHtml;
  try {
    sanitizeHtml = require('sanitize-html');
  } catch {
    console.warn('[Product] 警告：sanitize-html 未安装，description 未做 XSS 过滤。请运行 npm install sanitize-html');
    return next();
  }

  const stripAll = { allowedTags: [], allowedAttributes: {} };

  if (this.isModified('description')) {
    this.description = sanitizeHtml(this.description, stripAll);
  }
  if (this.isModified('shortDescription')) {
    this.shortDescription = sanitizeHtml(this.shortDescription, stripAll);
  }

  next();
});

// ─────────────────────────────────────────────
//  静态方法
// ─────────────────────────────────────────────

/**
 * 查询指定分类下的所有上架商品
 */
productSchema.statics.findActiveProducts = function(categoryId = null) {
  const query = this.find({ status: 'active' });
  if (categoryId) query.where('categoryId', categoryId);
  return query.sort({ sortOrder: 1, createdAt: -1 });
};

/**
 * 查询推荐商品
 */
productSchema.statics.findFeaturedProducts = function(limit = 10) {
  return this.find({ status: 'active', isFeatured: true })
    .sort({ sortOrder: 1, salesCount: -1 })
    .limit(limit);
};

/**
 * [P0 修复] 原子扣减库存，防止并发超卖
 *
 * 使用 MongoDB $inc + 条件过滤，整个操作在数据库层面原子执行。
 * 替代原来的「先读、再改、再写」实例方法（存在竞态条件）。
 *
 * @param {string}  productId - 商品 ObjectId
 * @param {number}  quantity  - 扣减数量（正整数）
 * @returns {Promise<Document>} 更新后的商品文档
 * @throws {Error} 当库存不足时抛出错误
 */
productSchema.statics.decrementStock = async function(productId, quantity) {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error('扣减数量必须为正整数');
  }

  const updated = await this.findOneAndUpdate(
    {
      _id: productId,
      status: 'active',
      stock: { $gte: quantity }   // 库存充足才允许扣减
    },
    {
      $inc: {
        stock: -quantity,         // 原子减库存
        salesCount: quantity      // 原子增销量
      }
    },
    { new: true }                 // 返回更新后的文档
  );

  if (!updated) {
    // findOneAndUpdate 返回 null：商品不存在、已下架、或库存不足
    const product = await this.findById(productId).select('stock status').lean();
    if (!product) throw new Error('商品不存在');
    if (product.status !== 'active') throw new Error('商品已下架');
    throw new Error(`库存不足（当前库存：${product.stock}，需要：${quantity}）`);
  }

  // 低库存事件：可在此接入通知系统（邮件/微信模板消息/钉钉等）
  if (updated.stock <= updated.lowStockThreshold) {
    console.warn(`[Product] 低库存提醒：${updated.name}（id: ${updated._id}）剩余库存 ${updated.stock}`);
    // TODO: await notifyLowStock(updated)
  }

  return updated;
};

/**
 * 原子增加库存（用于补货、退单等场景）
 *
 * @param {string}  productId - 商品 ObjectId
 * @param {number}  quantity  - 增加数量（正整数）
 * @returns {Promise<Document>} 更新后的商品文档
 */
productSchema.statics.incrementStock = async function(productId, quantity) {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error('增加数量必须为正整数');
  }

  const updated = await this.findByIdAndUpdate(
    productId,
    { $inc: { stock: quantity } },
    { new: true }
  );

  if (!updated) throw new Error('商品不存在');
  return updated;
};

// ─────────────────────────────────────────────
//  实例方法
// ─────────────────────────────────────────────

/**
 * [P1 修复] 判断商品是否可下单
 * 原代码未考虑 dailyLimit，现已补全
 *
 * @param {number} todaySalesCount - 今日该商品已售数量（由调用方传入）
 * @returns {boolean}
 */
productSchema.methods.isAvailable = function(todaySalesCount = 0) {
  if (this.status !== 'active') return false;
  if (this.stock <= 0) return false;
  if (this.dailyLimit !== null && todaySalesCount >= this.dailyLimit) return false;
  return true;
};

/**
 * 获取商品可用状态的详细原因（用于前端展示提示文案）
 *
 * @param {number} todaySalesCount - 今日该商品已售数量
 * @returns {{ available: boolean, reason: string }}
 */
productSchema.methods.getAvailabilityStatus = function(todaySalesCount = 0) {
  if (this.status === 'inactive')    return { available: false, reason: '商品已下架' };
  if (this.status === 'coming_soon') return { available: false, reason: '即将上市' };
  if (this.status === 'out_of_stock') return { available: false, reason: '暂时售罄' };
  if (this.stock <= 0)               return { available: false, reason: '库存不足' };
  if (this.dailyLimit !== null && todaySalesCount >= this.dailyLimit) {
    return { available: false, reason: '今日已售罄' };
  }
  return { available: true, reason: '' };
};

// ─────────────────────────────────────────────
//  导出
// ─────────────────────────────────────────────
const Product = mongoose.model('Product', productSchema);

module.exports = Product;
