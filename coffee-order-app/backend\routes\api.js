// API路由主文件
// 根据mock-api.js中的API设计路由

const express = require('express');
const router = express.Router();

// 导入控制器
const adminController = require('../controllers/adminController');
const orderController = require('../controllers/orderController');
const memberController = require('../controllers/memberController');
const couponController = require('../controllers/couponController');
const shopController = require('../controllers/shopController');
const productController = require('../controllers/productController');

// 管理员相关路由
router.post('/admin/login', adminController.adminLogin);
router.put('/admin/password', adminController.updateAdminPassword);
router.get('/admin/dashboard', adminController.getDashboardStats);

// 订单管理路由
router.get('/admin/orders', orderController.getOrderList);
router.put('/admin/orders', orderController.updateOrderStatus);
router.delete('/admin/orders', orderController.deleteOrder);

// 会员管理路由
router.get('/admin/members', memberController.getMemberList);
router.post('/admin/members', memberController.addMember);
router.put('/admin/members', memberController.updateMember);

// 优惠券管理路由
router.get('/admin/coupons', couponController.getCouponList);
router.post('/admin/coupons', couponController.createCoupon);
router.put('/admin/coupons', couponController.issueCoupon);

// 商店信息路由
router.get('/shop/info', shopController.getShopInfo);
router.put('/shop/info', shopController.updateShopInfo);
router.put('/shop/logo', shopController.uploadLogo);

// 会员相关路由（小程序端）
router.post('/member/login', memberController.memberLogin);
router.get('/member/info', memberController.getMemberInfo);
router.put('/member/update', memberController.updateMemberInfo);
router.get('/member/points', memberController.getMemberPoints);
router.get('/member/level', memberController.getMemberLevel);
router.get('/member/orders', memberController.getMemberOrders);

// 优惠券相关路由（小程序端）
router.get('/coupon/available', couponController.getAvailableCoupons);
router.get('/coupon/member', couponController.getMemberCoupons);
router.post('/coupon/receive', couponController.receiveCoupon);
router.post('/coupon/use', couponController.useCoupon);
router.get('/coupon/detail/:id', couponController.getCouponDetail);

// 订单相关路由（小程序端）
router.post('/order/create', orderController.createOrder);
router.get('/order/detail/:id', orderController.getOrderDetail);
router.get('/order/list', orderController.getOrderListForMember);
router.post('/order/cancel', orderController.cancelOrder);
router.post('/order/pay', orderController.payOrder);

// 商品相关路由
router.get('/product/categories', productController.getCategories);
router.get('/product/list', productController.getProducts);
router.get('/product/detail/:id', productController.getProductDetail);
router.get('/product/search', productController.searchProducts);

// 商店相关路由（小程序端）
router.get('/shop/hours', shopController.getBusinessHours);
router.get('/shop/address', shopController.getShopAddress);

// API文档
router.get('/docs', (req, res) => {
  res.json({
    message: 'WECO CAFE API 文档',
    version: '1.0.0',
    endpoints: {
      admin: {
        login: 'POST /api/admin/login',
        dashboard: 'GET /api/admin/dashboard',
        password: 'PUT /api/admin/password'
      },
      member: {
        login: 'POST /api/member/login',
        info: 'GET /api/member/info',
        orders: 'GET /api/member/orders'
      },
      order: {
        create: 'POST /api/order/create',
        list: 'GET /api/order/list',
        detail: 'GET /api/order/detail/:id',
        pay: 'POST /api/order/pay'
      },
      coupon: {
        available: 'GET /api/coupon/available',
        receive: 'POST /api/coupon/receive',
        use: 'POST /api/coupon/use'
      },
      product: {
        categories: 'GET /api/product/categories',
        list: 'GET /api/product/list',
        detail: 'GET /api/product/detail/:id'
      },
      shop: {
        info: 'GET /api/shop/info',
        hours: 'GET /api/shop/hours',
        address: 'GET /api/shop/address'
      }
    }
  });
});

module.exports = router;