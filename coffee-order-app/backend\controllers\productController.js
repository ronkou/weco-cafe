// 商品控制器
// 实现mock-api.js中的商品相关功能

// 模拟商品数据
const mockProducts = {
  categories: [
    { id: 1, name: '咖啡', icon: 'coffee', description: '精選咖啡飲品' },
    { id: 2, name: '茶飲', icon: 'tea', description: '各式茶類飲品' },
    { id: 3, name: '甜點', icon: 'dessert', description: '精緻甜點蛋糕' },
    { id: 4, name: '輕食', icon: 'food', description: '三明治、沙拉等' }
  ],
  
  products: [
    {
      id: 1,
      name: '拿鐵咖啡',
      categoryId: 1,
      price: 35,
      description: '濃縮咖啡與鮮奶的完美結合',
      imageUrl: 'https://example.com/latte.jpg',
      options: [
        { id: 1, name: '溫度', values: ['熱', '冰'] },
        { id: 2, name: '甜度', values: ['無糖', '半糖', '全糖'] },
        { id: 3, name: '牛奶', values: ['全脂', '低脂', '燕麥奶'] }
      ],
      tags: ['熱門', '推薦'],
      stock: 100,
      sales: 42
    },
    {
      id: 2,
      name: '美式咖啡',
      categoryId: 1,
      price: 28,
      description: '經典美式黑咖啡',
      imageUrl: 'https://example.com/americano.jpg',
      options: [
        { id: 1, name: '溫度', values: ['熱', '冰'] },
        { id: 2, name: '甜度', values: ['無糖', '半糖', '全糖'] }
      ],
      tags: ['熱門'],
      stock: 150,
      sales: 38
    },
    {
      id: 3,
      name: '卡布奇諾',
      categoryId: 1,
      price: 38,
      description: '濃郁咖啡與奶泡的經典組合',
      imageUrl: 'https://example.com/cappuccino.jpg',
      options: [
        { id: 1, name: '溫度', values: ['熱', '冰'] },
        { id: 2, name: '甜度', values: ['無糖', '半糖', '全糖'] }
      ],
      tags: ['推薦'],
      stock: 80,
      sales: 25
    },
    {
      id: 4,
      name: '提拉米蘇',
      categoryId: 3,
      price: 45,
      description: '義式經典甜點',
      imageUrl: 'https://example.com/tiramisu.jpg',
      options: [],
      tags: ['甜點', '推薦'],
      stock: 30,
      sales: 18
    }
  ]
};

// 工具函数：生成响应
function createResponse(success, data, message) {
  return {
    success,
    data,
    message: message || (success ? '操作成功' : '操作失败'),
    timestamp: new Date().toISOString()
  };
}

// 获取商品分类
exports.getCategories = async (req, res) => {
  try {
    return res.json(createResponse(true, {
      categories: mockProducts.categories
    }));
  } catch (error) {
    console.error('获取商品分类错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};

// 获取商品列表
exports.getProducts = async (req, res) => {
  try {
    const { category = '', page = 1, limit = 20 } = req.query;
    
    let filteredProducts = [...mockProducts.products];
    
    if (category) {
      filteredProducts = filteredProducts.filter(product => 
        product.categoryId === parseInt(category)
      );
    }
    
    // 分页处理
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    
    // 如果limit足够大，返回所有商品
    const pagedProducts = limitNum >= 100 ? 
      filteredProducts : 
      filteredProducts.slice(startIndex, endIndex);
    
    return res.json(createResponse(true, {
      products: pagedProducts,
      total: filteredProducts.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(filteredProducts.length / limitNum)
    }));
  } catch (error) {
    console.error('获取商品列表错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};

// 获取商品详情
exports.getProductDetail = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = mockProducts.products.find(p => p.id === parseInt(id));
    
    if (product) {
      return res.json(createResponse(true, { product }));
    } else {
      return res.status(404).json(createResponse(false, null, '商品不存在'));
    }
  } catch (error) {
    console.error('获取商品详情错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};

// 搜索商品
exports.searchProducts = async (req, res) => {
  try {
    const { keyword, page = 1, limit = 20 } = req.query;
    
    if (!keyword || keyword.trim() === '') {
      return res.status(400).json(createResponse(false, null, '搜索关键词不能为空'));
    }
    
    const searchTerm = keyword.toLowerCase();
    
    const filteredProducts = mockProducts.products.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
    
    // 分页处理
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const pagedProducts = filteredProducts.slice(startIndex, endIndex);
    
    return res.json(createResponse(true, {
      products: pagedProducts,
      total: filteredProducts.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(filteredProducts.length / limitNum),
      keyword: searchTerm
    }));
  } catch (error) {
    console.error('搜索商品错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};