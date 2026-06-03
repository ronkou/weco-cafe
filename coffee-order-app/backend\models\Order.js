// 订单模型
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  options: [{
    name: String,
    value: String
  }],
  subtotal: {
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  // 订单标识
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // 会员关联
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    index: true
  },
  openid: {
    type: String,
    index: true
  },
  
  // 客户信息
  customerName: {
    type: String,
    default: '匿名客户'
  },
  customerPhone: {
    type: String,
    default: ''
  },
  customerAddress: {
    type: String,
    default: ''
  },
  
  // 订单商品
  items: [orderItemSchema],
  
  // 价格信息
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  deliveryFee: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  
  // 支付信息
  paymentMethod: {
    type: String,
    enum: ['wechat_pay', 'tenpay_global', 'cash', 'card'],
    default: 'wechat_pay'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded', 'failed'],
    default: 'unpaid'
  },
  paymentTime: {
    type: Date,
    default: null
  },
  paymentTransactionId: {
    type: String,
    default: ''
  },
  
  // 订单状态
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // 配送信息
  deliveryType: {
    type: String,
    enum: ['pickup', 'delivery'],
    default: 'pickup'
  },
  deliveryTime: {
    type: Date,
    default: null
  },
  
  // 优惠券
  couponId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
    default: null
  },
  couponDiscount: {
    type: Number,
    default: 0
  },
  
  // 备注
  notes: {
    type: String,
    default: ''
  },
  
  // 时间信息
  estimatedReadyTime: {
    type: Date,
    default: null
  },
  completedTime: {
    type: Date,
    default: null
  },
  cancelledTime: {
    type: Date,
    default: null
  },
  cancelledReason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true // 自动添加 createdAt 和 updatedAt
});

// 索引
orderSchema.index({ memberId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ orderNumber: 'text', customerName: 'text', customerPhone: 'text' });

// 静态方法
orderSchema.statics.findByOrderNumber = function(orderNumber) {
  return this.findOne({ orderNumber });
};

orderSchema.statics.findByMemberId = function(memberId, options = {}) {
  const query = this.find({ memberId });
  
  if (options.status) {
    query.where('status', options.status);
  }
  
  if (options.paymentStatus) {
    query.where('paymentStatus', options.paymentStatus);
  }
  
  query.sort({ createdAt: -1 });
  
  if (options.limit) {
    query.limit(options.limit);
  }
  
  if (options.skip) {
    query.skip(options.skip);
  }
  
  return query;
};

// 实例方法
orderSchema.methods.calculateTotal = function() {
  const itemsTotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  this.subtotal = itemsTotal;
  this.total = itemsTotal - this.discount + this.deliveryFee;
  return this;
};

orderSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  
  const now = new Date();
  switch (newStatus) {
    case 'completed':
      this.completedTime = now;
      break;
    case 'cancelled':
      this.cancelledTime = now;
      break;
  }
  
  return this.save();
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;