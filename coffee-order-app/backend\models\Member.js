// 会员模型
const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  // 微信相关
  openid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  unionid: {
    type: String,
    index: true
  },
  
  // 会员基本信息
  name: {
    type: String,
    default: '微信用户'
  },
  phone: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  
  // 会员等级和积分
  level: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    default: 'bronze'
  },
  points: {
    type: Number,
    default: 0
  },
  
  // 统计信息
  totalOrders: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  
  // 时间信息
  joinDate: {
    type: Date,
    default: Date.now
  },
  lastVisit: {
    type: Date,
    default: Date.now
  },
  birthday: {
    type: Date,
    default: null
  },
  
  // 其他信息
  preferences: {
    type: Map,
    of: String,
    default: {}
  },
  
  // 状态
  status: {
    type: String,
    enum: ['active', 'inactive', 'banned'],
    default: 'active'
  }
}, {
  timestamps: true // 自动添加 createdAt 和 updatedAt
});

// 索引
memberSchema.index({ level: 1, points: -1 });
memberSchema.index({ lastVisit: -1 });
memberSchema.index({ totalSpent: -1 });

// 静态方法
memberSchema.statics.findByOpenid = function(openid) {
  return this.findOne({ openid });
};

memberSchema.statics.findByPhone = function(phone) {
  return this.findOne({ phone });
};

// 实例方法
memberSchema.methods.addPoints = function(points, reason = '') {
  this.points += points;
  return this.save();
};

memberSchema.methods.updateLevel = function() {
  const points = this.points;
  let newLevel = 'bronze';
  
  if (points >= 10000) newLevel = 'diamond';
  else if (points >= 5000) newLevel = 'platinum';
  else if (points >= 2000) newLevel = 'gold';
  else if (points >= 500) newLevel = 'silver';
  
  if (newLevel !== this.level) {
    this.level = newLevel;
    return this.save();
  }
  
  return Promise.resolve(this);
};

const Member = mongoose.model('Member', memberSchema);

module.exports = Member;