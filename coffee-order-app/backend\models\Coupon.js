// 优惠券模型
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  // 优惠券基本信息
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  
  // 优惠券类型
  type: {
    type: String,
    enum: ['discount', 'cash', 'free', 'shipping'],
    required: true
  },
  
  // 优惠值
  value: {
    type: Number,
    required: true,
    min: 0
  },
  
  // 使用条件
  minAmount: {
    type: Number,
    default: 0
  },
  maxDiscount: {
    type: Number,
    default: null
  },
  
  // 使用限制
  usageLimit: {
    type: Number,
    default: null // null表示无限制
  },
  usedCount: {
    type: Number,
    default: 0
  },
  
  // 适用商品
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  excludedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  
  // 有效期
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  
  // 状态
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired', 'depleted'],
    default: 'active'
  },
  
  // 用户限制
  perUserLimit: {
    type: Number,
    default: 1
  },
  
  // 其他信息
  description: {
    type: String,
    default: ''
  },
  termsAndConditions: {
    type: String,
    default: ''
  }
}, {
  timestamps: true // 自动添加 createdAt 和 updatedAt
});

// 索引
couponSchema.index({ code: 1 });
couponSchema.index({ status: 1 });
couponSchema.index({ validUntil: 1 });
couponSchema.index({ type: 1 });
couponSchema.index({ createdAt: -1 });

// 静态方法
couponSchema.statics.findByCode = function(code) {
  return this.findOne({ code: code.toUpperCase() });
};

couponSchema.statics.findActiveCoupons = function() {
  const now = new Date();
  return this.find({
    status: 'active',
    validFrom: { $lte: now },
    validUntil: { $gte: now }
  });
};

// 实例方法
couponSchema.methods.isValid = function() {
  const now = new Date();
  return (
    this.status === 'active' &&
    this.validFrom <= now &&
    this.validUntil >= now &&
    (this.usageLimit === null || this.usedCount < this.usageLimit)
  );
};

couponSchema.methods.applyDiscount = function(orderAmount) {
  if (orderAmount < this.minAmount) {
    throw new Error(`订单金额不足，最低消费${this.minAmount}`);
  }
  
  let discount = 0;
  
  switch (this.type) {
    case 'discount':
      discount = orderAmount * this.value;
      if (this.maxDiscount && discount > this.maxDiscount) {
        discount = this.maxDiscount;
      }
      break;
      
    case 'cash':
      discount = this.value;
      break;
      
    case 'free':
      discount = orderAmount;
      break;
      
    case 'shipping':
      discount = 0; // 免运费
      break;
  }
  
  return discount;
};

couponSchema.methods.incrementUsage = function() {
  this.usedCount += 1;
  
  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    this.status = 'depleted';
  }
  
  return this.save();
};

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;