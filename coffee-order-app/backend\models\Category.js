// 商品分类模型
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  // 分类基本信息
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  // 描述信息
  description: {
    type: String,
    default: ''
  },
  
  // 图片
  icon: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String,
    default: ''
  },
  
  // 层级关系
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  level: {
    type: Number,
    default: 1,
    min: 1
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
  isActive: {
    type: Boolean,
    default: true
  },
  
  // 统计信息
  productCount: {
    type: Number,
    default: 0
  },
  
  // 其他信息
  metadata: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true // 自动添加 createdAt 和 updatedAt
});

// 索引
categorySchema.index({ slug: 1 });
categorySchema.index({ parentId: 1 });
categorySchema.index({ level: 1 });
categorySchema.index({ sortOrder: 1 });
categorySchema.index({ isActive: 1, isFeatured: 1 });

// 静态方法
categorySchema.statics.findActiveCategories = function() {
  return this.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 });
};

categorySchema.statics.findFeaturedCategories = function() {
  return this.find({ 
    isActive: true,
    isFeatured: true 
  })
  .sort({ sortOrder: 1, name: 1 });
};

categorySchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug: slug.toLowerCase() });
};

// 实例方法
categorySchema.methods.incrementProductCount = function() {
  this.productCount += 1;
  return this.save();
};

categorySchema.methods.decrementProductCount = function() {
  this.productCount = Math.max(0, this.productCount - 1);
  return this.save();
};

categorySchema.methods.getBreadcrumbs = async function() {
  const breadcrumbs = [];
  let currentCategory = this;
  
  while (currentCategory) {
    breadcrumbs.unshift({
      id: currentCategory._id,
      name: currentCategory.name,
      slug: currentCategory.slug
    });
    
    if (currentCategory.parentId) {
      currentCategory = await this.constructor.findById(currentCategory.parentId);
    } else {
      currentCategory = null;
    }
  }
  
  return breadcrumbs;
};

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;