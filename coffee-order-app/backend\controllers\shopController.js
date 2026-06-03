// 商店控制器
// 实现mock-api.js中的商店相关功能

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

// 获取商店信息
exports.getShopInfo = async (req, res) => {
  try {
    return res.json(createResponse(true, {
      shopInfo: mockData.shopInfo
    }));
  } catch (error) {
    console.error('获取商店信息错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};

// 更新商店信息
exports.updateShopInfo = async (req, res) => {
  try {
    const shopData = req.body;
    
    mockData.shopInfo = {
      ...mockData.shopInfo,
      ...shopData
    };
    
    return res.json(createResponse(true, {
      shopInfo: mockData.shopInfo
    }, '商店信息已更新'));
  } catch (error) {
    console.error('更新商店信息错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};

// 上传LOGO
exports.uploadLogo = async (req, res) => {
  try {
    const { logoUrl, filePath } = req.body;
    
    // 使用传入的logoUrl或临时文件路径
    const newLogoUrl = logoUrl || filePath || 'https://example.com/uploaded-logo-' + Date.now() + '.png';
    
    mockData.shopInfo.logoUrl = newLogoUrl;
    
    return res.json(createResponse(true, {
      logoUrl: newLogoUrl
    }, 'LOGO上传成功'));
  } catch (error) {
    console.error('上传LOGO错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};

// 获取营业时间
exports.getBusinessHours = async (req, res) => {
  try {
    return res.json(createResponse(true, {
      businessHours: mockData.shopInfo.openingHours || '08:00 - 22:00'
    }));
  } catch (error) {
    console.error('获取营业时间错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};

// 获取门店地址
exports.getShopAddress = async (req, res) => {
  try {
    return res.json(createResponse(true, {
      address: mockData.shopInfo.address || '澳門氹仔某路123號',
      phone: mockData.shopInfo.phone || '+853 1234 5678'
    }));
  } catch (error) {
    console.error('获取门店地址错误:', error);
    return res.status(500).json(createResponse(false, null, '服务器内部错误'));
  }
};