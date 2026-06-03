// 会员控制器
// 实现mock-api.js中的会员相关功能

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

// 会员登录（小程序端）
exports.memberLogin = async (req, res) => {
  try {
    const { code, userInfo } = req.body;
    
    if (!code) {
      return res.status(400).json(createResponse(false, null, '微信code不能为空'));
    }
    
    // 这里应该调用微信API获取openid和session_key
    // 模拟返回
    const openid = 'mock_openid_' + Date.now();
    const sessionKey = 'mock_session_key_' + Date.now();
    
    // 查找或创建会员
    let member = mockData.members.find(m => m.openid === openid);
    
    if (!member) {
      member = {
        id: mockData.members.length + 1,
        openid,
        name: userInfo?.nickName || '微信用户',
        phone: '',
        level: 'bronze',
        points: 100,
        joinDate: new Date().toISOString().split('T')[0],
        lastVisit: new Date().toISOString().split('T')[0],
        totalOrders: 0,
        totalSpent: 0,
        avatar: userInfo?.avatarUrl || ''
      };
      mockData.members.push(member);
    } else {
      // 更新最后访问时间
      member.lastVisit = new Date().toISOString().split('T')[0];
    }
    
    const token = 'member_token_' + Date.now();
    
    return res.json(createResponse(true, {
      token,
      memberInfo: member
    }, '登录成功'));
  } catch (error) {
    console.error('会员登录错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};

// 获取会员信息
exports.getMemberInfo = async (req, res) => {
  try {
    // 这里应该从token中解析会员ID
    const memberId = req.query.memberId || req.headers['x-member-id'];
    
    if (!memberId) {
      return res.status(401).json(createResponse(false, null, '未授权访问'));
    }
    
    const member = mockData.members.find(m => m.id === parseInt(memberId));
    
    if (member) {
      return res.json(createResponse(true, { memberInfo: member }));
    } else {
      return res.status(404).json(createResponse(false, null, '会员不存在'));
    }
  } catch (error) {
    console.error('获取会员信息错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};

// 更新会员信息
exports.updateMemberInfo = async (req, res) => {
  try {
    const memberId = req.query.memberId || req.headers['x-member-id'];
    const memberData = req.body;
    
    if (!memberId) {
      return res.status(401).json(createResponse(false, null, '未授权访问'));
    }
    
    const memberIndex = mockData.members.findIndex(m => m.id === parseInt(memberId));
    
    if (memberIndex > -1) {
      mockData.members[memberIndex] = {
        ...mockData.members[memberIndex],
        ...memberData
      };
      
      return res.json(createResponse(true, {
        memberInfo: mockData.members[memberIndex]
      }, '会员信息已更新'));
    } else {
      return res.status(404).json(createResponse(false, null, '会员不存在'));
    }
  } catch (error) {
    console.error('更新会员信息错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};

// 获取会员积分
exports.getMemberPoints = async (req, res) => {
  try {
    const memberId = req.query.memberId || req.headers['x-member-id'];
    
    if (!memberId) {
      return res.status(401).json(createResponse(false, null, '未授权访问'));
    }
    
    const member = mockData.members.find(m => m.id === parseInt(memberId));
    
    if (member) {
      return res.json(createResponse(true, {
        points: member.points,
        level: member.level
      }));
    } else {
      return res.status(404).json(createResponse(false, null, '会员不存在'));
    }
  } catch (error) {
    console.error('获取会员积分错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};

// 获取会员等级
exports.getMemberLevel = async (req, res) => {
  try {
    const memberId = req.query.memberId || req.headers['x-member-id'];
    
    if (!memberId) {
      return res.status(401).json(createResponse(false, null, '未授权访问'));
    }
    
    const member = mockData.members.find(m => m.id === parseInt(memberId));
    
    if (member) {
      return res.json(createResponse(true, {
        level: member.level,
        nextLevel: getNextLevel(member.level),
        pointsToNextLevel: getPointsToNextLevel(member.points, member.level)
      }));
    } else {
      return res.status(404).json(createResponse(false, null, '会员不存在'));
    }
  } catch (error) {
    console.error('获取会员等级错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};

// 获取会员订单历史
exports.getMemberOrders = async (req, res) => {
  try {
    const memberId = req.query.memberId || req.headers['x-member-id'];
    const { page = 1, limit = 10 } = req.query;
    
    if (!memberId) {
      return res.status(401).json(createResponse(false, null, '未授权访问'));
    }
    
    const filteredOrders = mockData.orders.filter(order => order.memberId === memberId);
    
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
    console.error('获取会员订单历史错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};

// 获取会员列表（管理员）
exports.getMemberList = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // 分页处理
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const pagedMembers = mockData.members.slice(startIndex, endIndex);
    
    return res.json(createResponse(true, {
      members: pagedMembers,
      total: mockData.members.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(mockData.members.length / limitNum),
      stats: getMemberStats()
    }));
  } catch (error) {
    console.error('获取会员列表错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};

// 添加新会员（管理员）
exports.addMember = async (req, res) => {
  try {
    const memberData = req.body;
    
    if (!memberData.name) {
      return res.status(400).json(createResponse(false, null, '会员姓名不能为空'));
    }
    
    const newMember = {
      id: mockData.members.length + 1,
      ...memberData,
      points: memberData.points || 100,
      joinDate: new Date().toISOString().split('T')[0],
      lastVisit: new Date().toISOString().split('T')[0],
      totalOrders: 0,
      totalSpent: 0
    };
    
    mockData.members.push(newMember);
    
    return res.json(createResponse(true, {
      member: newMember
    }, '会员添加成功'));
  } catch (error) {
    console.error('添加会员错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};

// 更新会员信息（管理员）
exports.updateMember = async (req, res) => {
  try {
    const { memberId, updateData } = req.body;
    
    if (!memberId || !updateData) {
      return res.status(400).json(createResponse(false, null, '会员ID和更新数据不能为空'));
    }
    
    const memberIndex = mockData.members.findIndex(member => member.id === memberId);
    
    if (memberIndex > -1) {
      mockData.members[memberIndex] = {
        ...mockData.members[memberIndex],
        ...updateData
      };
      
      return res.json(createResponse(true, {
        member: mockData.members[memberIndex]
      }, '会员信息已更新'));
    } else {
      return res.status(404).json(createResponse(false, null, '会员不存在'));
    }
  } catch (error) {
    console.error('更新会员信息错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};

// 辅助函数：获取会员统计
function getMemberStats() {
  const members = mockData.members;
  const today = new Date().toISOString().split('T')[0];
  
  return {
    total: members.length,
    todayNew: members.filter(m => m.joinDate === today).length,
    active: members.filter(m => {
      const lastVisit = new Date(m.lastVisit);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return lastVisit >= sevenDaysAgo;
    }).length
  };
}

// 辅助函数：获取下一等级
function getNextLevel(currentLevel) {
  const levels = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
  const currentIndex = levels.indexOf(currentLevel);
  return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
}

// 辅助函数：获取升级所需积分
function getPointsToNextLevel(currentPoints, currentLevel) {
  const levelPoints = {
    bronze: 500,
    silver: 2000,
    gold: 5000,
    platinum: 10000
  };
  
  const nextLevel = getNextLevel(currentLevel);
  if (!nextLevel) return 0;
  
  const requiredPoints = levelPoints[currentLevel] || 0;
  return Math.max(0, requiredPoints - currentPoints);
}