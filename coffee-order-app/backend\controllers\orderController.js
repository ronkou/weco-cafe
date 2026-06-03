// 订单控制器
// 实现mock-api.js中的订单相关功能

const { mockData } = require('./adminController');

// 工具函数：生成响应
function createResponse(success, data, message) {
  return {
    success,
    data,
    message: message || (success ? '操作成功' : '操作失败'),
    timestamp: new Date().toISOString()
  };
}

// 获取订单列表（管理员）
exports.getOrderList = async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 10 } = req.query;
    
    let filteredOrders = [...mockData.orders];
    
    if (status !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.status === status);
    }
    
    // 分页处理
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const pagedOrders = filteredOrders.slice(startIndex, endIndex);
    
    return res.json(createResponse(true, {
      orders: pagedOrders,
      total: filteredOrders.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(filteredOrders.length / limitNum)
    }));
  } catch (error) {
    console.error('获取订单列表错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};

// 更新订单状态
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    
    if (!orderId || !status) {
      return res.status(400).json(createResponse(false, null, '订单ID和状态不能为空'));
    }
    
    const orderIndex = mockData.orders.findIndex(order => order.id === orderId);
    
    if (orderIndex > -1) {
      mockData.orders[orderIndex].status = status;
      
      // 如果状态变为完成，记录完成时间
      if (status === 'completed') {
        mockData.orders[orderIndex].completeTime = new Date().toISOString();
      }
      
      return res.json(createResponse(true, {
        order: mockData.orders[orderIndex]
      }, '订单状态已更新'));
    } else {
      return res.status(404).json(createResponse(false, null, '订单不存在'));
    }
  } catch (error) {
    console.error('更新订单状态错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};

// 删除订单（仅限待付款订单）
exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json(createResponse(false, null, '订单ID不能为空'));
    }
    
    const orderIndex = mockData.orders.findIndex(order => order.id === orderId);
    
    if (orderIndex > -1) {
      const order = mockData.orders[orderIndex];
      
      // 仅允许删除未付款订单
      if (order.paymentStatus === 'unpaid') {
        mockData.orders.splice(orderIndex, 1);
        return res.json(createResponse(true, null, '订单已删除'));
      } else {
        return res.status(403).json(createResponse(false, null, '仅能删除待付款订单'));
      }
    } else {
      return res.status(404).json(createResponse(false, null, '订单不存在'));
    }
  } catch (error) {
    console.error('删除订单错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};

// 创建订单（小程序端）
exports.createOrder = async (req, res) => {
  try {
    const orderData = req.body;
    
    if (!orderData.items || orderData.items.length === 0) {
      return res.status(400).json(createResponse(false, null, '订单商品不能为空'));
    }
    
    // 生成订单ID
    const orderId = 'ORD' + Date.now();
    const orderNumber = new Date().toISOString().slice(0, 10).replace(/-/g, '') + 
                      String(mockData.orders.length + 1).padStart(4, '0');
    
    const newOrder = {
      id: orderId,
      orderNumber,
      customerName: orderData.customerName || '匿名客户',
      customerPhone: orderData.customerPhone || '',
      createTime: new Date().toISOString(),
      status: 'pending',
      items: orderData.items,
      total: orderData.total,
      discount: orderData.discount || 0,
      finalAmount: orderData.finalAmount || orderData.total,
      paymentMethod: orderData.paymentMethod || 'wechat_pay',
      paymentStatus: 'unpaid',
      memberId: orderData.memberId || null
    };
    
    mockData.orders.push(newOrder);
    
    return res.json(createResponse(true, {
      order: newOrder
    }, '订单创建成功'));
  } catch (error) {
    console.error('创建订单错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};

// 获取订单详情
exports.getOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = mockData.orders.find(order => order.id === id);
    
    if (order) {
      return res.json(createResponse(true, { order }));
    } else {
      return res.status(404).json(createResponse(false, null, '订单不存在'));
    }
  } catch (error) {
    console.error('获取订单详情错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};

// 获取订单列表（会员端）
exports.getOrderListForMember = async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 10, memberId } = req.query;
    
    let filteredOrders = mockData.orders.filter(order => order.memberId === memberId);
    
    if (status !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.status === status);
    }
    
    // 分页处理
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const pagedOrders = filteredOrders.slice(startIndex, endIndex);
    
    return res.json(createResponse(true, {
      orders: pagedOrders,
      total: filteredOrders.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(filteredOrders.length / limitNum)
    }));
  } catch (error) {
    console.error('获取会员订单列表错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};

// 取消订单
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json(createResponse(false, null, '订单ID不能为空'));
    }
    
    const orderIndex = mockData.orders.findIndex(order => order.id === orderId);
    
    if (orderIndex > -1) {
      const order = mockData.orders[orderIndex];
      
      // 只有未付款或待处理的订单可以取消
      if (order.paymentStatus === 'unpaid' && order.status === 'pending') {
        mockData.orders[orderIndex].status = 'cancelled';
        return res.json(createResponse(true, null, '订单已取消'));
      } else {
        return res.status(403).json(createResponse(false, null, '当前订单状态不允许取消'));
      }
    } else {
      return res.status(404).json(createResponse(false, null, '订单不存在'));
    }
  } catch (error) {
    console.error('取消订单错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};

// 支付订单
exports.payOrder = async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;
    
    if (!orderId || !paymentMethod) {
      return res.status(400).json(createResponse(false, null, '订单ID和支付方式不能为空'));
    }
    
    const orderIndex = mockData.orders.findIndex(order => order.id === orderId);
    
    if (orderIndex > -1) {
      const order = mockData.orders[orderIndex];
      
      if (order.paymentStatus === 'paid') {
        return res.status(400).json(createResponse(false, null, '订单已支付'));
      }
      
      // 模拟支付成功
      mockData.orders[orderIndex].paymentStatus = 'paid';
      mockData.orders[orderIndex].paymentMethod = paymentMethod;
      mockData.orders[orderIndex].paymentTime = new Date().toISOString();
      
      return res.json(createResponse(true, {
        order: mockData.orders[orderIndex]
      }, '支付成功'));
    } else {
      return res.status(404).json(createResponse(false, null, '订单不存在'));
    }
  } catch (error) {
    console.error('支付订单错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};