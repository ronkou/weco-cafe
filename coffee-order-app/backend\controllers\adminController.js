// 管理员控制器
// 实现mock-api.js中的管理员相关功能

// 模拟数据（暂时使用，后续替换为数据库）
let mockData = {
  adminAccount: {
    username: 'admin',
    password: 'admin123',
    name: '系统管理员',
    role: 'superadmin'
  },
  orders: [],
  members: [],
  coupons: [],
  shopInfo: {
    name: 'WECO CAFE',
    address: '澳門氹仔孫逸仙博士大馬路',
    phone: '+853 2888 8888',
    openingHours: '08:00 - 22:00',
    logoUrl: 'https://example.com/weco-cafe-logo.png',
    description: '澳門最受歡迎的精品咖啡店，提供優質咖啡和甜點'
  }
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

// 管理员登录
exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json(createResponse(false, null, '用户名和密码不能为空'));
    }

    if (username === mockData.adminAccount.username && password === mockData.adminAccount.password) {
      const token = 'admin_token_' + Date.now();
      const adminInfo = {
        id: 1,
        name: mockData.adminAccount.name,
        username: mockData.adminAccount.username,
        role: mockData.adminAccount.role
      };

      return res.json(createResponse(true, {
        token,
        adminInfo
      }, '登录成功'));
    } else {
      return res.status(401).json(createResponse(false, null, '用户名或密码错误'));
    }
  } catch (error) {
    console.error('管理员登录错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};

// 修改管理员密码
exports.updateAdminPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json(createResponse(false, null, '旧密码和新密码不能为空'));
    }

    if (oldPassword === mockData.adminAccount.password) {
      mockData.adminAccount.password = newPassword;
      return res.json(createResponse(true, null, '密码修改成功'));
    } else {
      return res.status(401).json(createResponse(false, null, '当前密码错误'));
    }
  } catch (error) {
    console.error('修改密码错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};

// 获取仪表板统计
exports.getDashboardStats = async (req, res) => {
  try {
    // 模拟统计数据
    const orderStats = {
      total: mockData.orders.length,
      unpaid: mockData.orders.filter(o => o.paymentStatus === 'unpaid').length,
      pending: mockData.orders.filter(o => o.status === 'pending').length,
      preparing: mockData.orders.filter(o => o.status === 'preparing').length,
      ready: mockData.orders.filter(o => o.status === 'ready').length,
      completed: mockData.orders.filter(o => o.status === 'completed').length,
      cancelled: mockData.orders.filter(o => o.status === 'cancelled').length
    };

    const memberStats = {
      total: mockData.members.length,
      todayNew: mockData.members.filter(m => {
        const today = new Date().toISOString().split('T')[0];
        return m.joinDate === today;
      }).length,
      active: mockData.members.filter(m => {
        const lastVisit = new Date(m.lastVisit);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return lastVisit >= sevenDaysAgo;
      }).length
    };

    const dashboardData = {
      orderStats,
      memberStats,
      todayRevenue: 1280,
      averageOrderValue: 95.5,
      popularProducts: [
        { name: '拿鐵咖啡', sales: 42 },
        { name: '美式咖啡', sales: 38 },
        { name: '卡布奇諾', sales: 25 }
      ]
    };

    return res.json(createResponse(true, dashboardData));
  } catch (error) {
    console.error('获取仪表板统计错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};

// 导出模拟数据供其他控制器使用
exports.mockData = mockData;