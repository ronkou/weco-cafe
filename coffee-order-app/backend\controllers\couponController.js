// 优惠券控制器
// 实现mock-api.js中的优惠券相关功能

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

// 获取优惠券列表（管理员）
exports.getCouponList = async (req, res) => {
  try {
    const { type = 'all', status = 'active', page = 1, limit = 10 } = req.query;
    
    let filteredCoupons = [...mockData.coupons];
    
    if (type !== 'all') {
      filteredCoupons = filteredCoupons.filter(coupon => coupon.type === type);
    }
    
    if (status !== 'all') {
      filteredCoupons = filteredCoupons.filter(coupon => coupon.status === status);
    }
    
    // 分页处理
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const pagedCoupons = filteredCoupons.slice(startIndex, endIndex);
    
    return res.json(createResponse(true, {
      coupons: pagedCoupons,
      total: filteredCoupons.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(filteredCoupons.length / limitNum)
    }));
  } catch (error) {
    console.error('获取优惠券列表错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};

// 创建优惠券
exports.createCoupon = async (req, res) => {
  try {
    const couponData = req.body;
    
    if (!couponData.name || !couponData.type) {
      return res.status(400).json(createResponse(false, null, '优惠券名称和类型不能为空'));
    }
    
    const newCoupon = {
      id: mockData.coupons.length + 1,
      ...couponData,
      used: 0,
      available: couponData.total || 100,
      status: 'active',
      createTime: new Date().toISOString()
    };
    
    mockData.coupons.push(newCoupon);
    
    return res.json(createResponse(true, {
      coupon: newCoupon
    }, '优惠券创建成功'));
  } catch (error) {
    console.error('创建优惠券错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};

// 发放优惠券
exports.issueCoupon = async (req, res) => {
  try {
    const { couponId, memberId, quantity = 1 } = req.body;
    
    if (!couponId || !memberId) {
      return res.status(400).json(createResponse(false, null, '优惠券ID和会员ID不能为空'));
    }
    
    const couponIndex = mockData.coupons.findIndex(c => c.id === couponId);
    
    if (couponIndex > -1) {
      const coupon = mockData.coupons[couponIndex];
      
      if (coupon.available < quantity) {
        return res.status(400).json(createResponse(false, null, '优惠券数量不足'));
      }
      
      // 更新优惠券数量
      coupon.used += quantity;
      coupon.available = coupon.total - coupon.used;
      
      return res.json(createResponse(true, {
        coupon: coupon,
        issuedQuantity: quantity,
        memberId
      }, '优惠券发放成功'));
    } else {
      return res.status(404).json(createResponse(false, null, '优惠券不存在'));
    }
  } catch (error) {
    console.error('发放优惠券错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};

// 获取可用优惠券列表（小程序端）
exports.getAvailableCoupons = async (req, res) => {
  try {
    const memberId = req.query.memberId || req.headers['x-member-id'];
    
    // 获取所有活跃且未过期的优惠券
    const now = new Date();
    const availableCoupons = mockData.coupons.filter(coupon => {
      if (coupon.status !== 'active') return false;
      
      // 检查是否过期
      if (coupon.expireTime && new Date(coupon.expireTime) < now) {
        return false;
      }
      
      // 检查是否有剩余数量
      if (coupon.available <= 0) return false;
      
      return true;
    });
    
    return res.json(createResponse(true, {
      coupons: availableCoupons
    }));
  } catch (error) {
    console.error('获取可用优惠券错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};

// 获取会员优惠券
exports.getMemberCoupons = async (req, res) => {
  try {
    const memberId = req.query.memberId || req.headers['x-member-id'];
    const { status = 'all' } = req.query;
    
    if (!memberId) {
      return res.status(401).json(createResponse(false, null, '未授权访问'));
    }
    
    // 模拟会员优惠券数据
    const memberCoupons = [
      {
        id: 1,
        couponId: 1,
        memberId: memberId,
        couponName: '新会员优惠',
        type: 'discount',
        value: 0.9,
        minAmount: 50,
        status: 'usable',
        receiveTime: '2026-03-28',
        expireTime: '2026-04-30'
      },
      {
        id: 2,
        couponId: 2,
        memberId: memberId,
        couponName: '满减券',
        type: 'cash',
        value: 10,
        minAmount: 100,
        status: 'used',
        receiveTime: '2026-03-25',
        useTime: '2026-03-28',
        orderId: 'ORD001'
      }
    ];
    
    let filteredCoupons = memberCoupons;
    
    if (status !== 'all') {
      filteredCoupons = memberCoupons.filter(coupon => coupon.status === status);
    }
    
    return res.json(createResponse(true, {
      coupons: filteredCoupons
    }));
  } catch (error) {
    console.error('获取会员优惠券错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};

// 领取优惠券
exports.receiveCoupon = async (req, res) => {
  try {
    const memberId = req.query.memberId || req.headers['x-member-id'];
    const { couponId } = req.body;
    
    if (!memberId) {
      return res.status(401).json(createResponse(false, null, '未授权访问'));
    }
    
    if (!couponId) {
      return res.status(400).json(createResponse(false, null, '优惠券ID不能为空'));
    }
    
    const coupon = mockData.coupons.find(c => c.id === couponId);
    
    if (!coupon) {
      return res.status(404).json(createResponse(false, null, '优惠券不存在'));
    }
    
    // 检查优惠券是否可用
    if (coupon.status !== 'active') {
      return res.status(400).json(createResponse(false, null, '优惠券不可用'));
    }
    
    if (coupon.available <= 0) {
      return res.status(400).json(createResponse(false, null, '优惠券已领完'));
    }
    
    // 检查是否过期
    if (coupon.expireTime && new Date(coupon.expireTime) < new Date()) {
      return res.status(400).json(createResponse(false, null, '优惠券已过期'));
    }
    
    // 更新优惠券数量
    coupon.used += 1;
    coupon.available = coupon.total - coupon.used;
    
    // 这里应该将优惠券添加到会员账户中
    // 模拟成功
    
    return res.json(createResponse(true, {
      coupon: coupon
    }, '优惠券领取成功'));
  } catch (error) {
    console.error('领取优惠券错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};

// 使用优惠券
exports.useCoupon = async (req, res) => {
  try {
    const memberId = req.query.memberId || req.headers['x-member-id'];
    const { couponId, orderId } = req.body;
    
    if (!memberId) {
      return res.status(401).json(createResponse(false, null, '未授权访问'));
    }
    
    if (!couponId || !orderId) {
      return res.status(400).json(createResponse(false, null, '优惠券ID和订单ID不能为空'));
    }
    
    // 这里应该检查会员是否拥有该优惠券
    // 模拟成功
    
    return res.json(createResponse(true, {
      couponId,
      orderId,
      discountApplied: 10
    }, '优惠券使用成功'));
  } catch (error) {
    console.error('使用优惠券错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};

// 获取优惠券详情
exports.getCouponDetail = async (req, res) => {
  try {
    const { id } = req.params;
    
    const coupon = mockData.coupons.find(c => c.id === parseInt(id));
    
    if (coupon) {
      return res.json(createResponse(true, { coupon }));
    } else {
      return res.status(404).json(createResponse(false, null, '优惠券不存在'));
    }
  } catch (error) {
    console.error('获取优惠券详情错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};