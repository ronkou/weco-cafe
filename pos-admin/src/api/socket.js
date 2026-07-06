/**
 * Socket.IO 客户端服务
 * 用于POS端实时接收后端数据更新
 * 
 * 事件类型：
 * - data_update: 数据更新事件（商品、订单、会员、优惠券等）
 * - new_order: 新订单推送（兼容旧版）
 * - order_status_changed: 订单状态变更
 * - product_updated: 商品信息更新
 * 
 * 订阅机制：
 * 客户端可以订阅特定集合的更新，例如 ['products', 'orders', 'members', 'coupons']
 */

import { io } from 'socket.io-client'
import { useAuthStore } from '../stores/auth'
import { useOrderStore } from '../stores/order'

// 根据环境配置Socket.IO服务器URL
const SOCKET_URL = import.meta.env.VITE_WS_URL || 
  (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 
   window.location.origin)

class SocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 10
    this.reconnectDelay = 3000
    
    // 事件监听器映射
    this.listeners = new Map()
    
    // 自动重连定时器
    this.reconnectTimer = null
    
    // 订阅的集合
    this.subscribedCollections = []
    
    // 心跳检测
    this.heartbeatInterval = null
  }

  /**
   * 连接到Socket.IO服务器
   */
  connect() {
    if (this.socket?.connected) {
      console.log('[Socket] 已经连接')
      return
    }

    console.log('[Socket] 正在连接到:', SOCKET_URL)

    const authStore = useAuthStore()
    const token = authStore.token

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: {
        token: token ? `Bearer ${token}` : ''
      },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      query: {
        clientType: 'pos-admin',
        version: '2.0'
      }
    })

    this._setupEventListeners()
  }

  /**
   * 设置事件监听器
   */
  _setupEventListeners() {
    if (!this.socket) return

    // 连接成功
    this.socket.on('connect', () => {
      console.log('[Socket] 连接成功，Socket ID:', this.socket.id)
      this.isConnected = true
      this.reconnectAttempts = 0
      this.emit('connect', this.socket.id)
      
      // 连接后自动订阅
      this._subscribeToCollections()
      
      // 开始心跳检测
      this._startHeartbeat()
    })

    // 连接错误
    this.socket.on('connect_error', (error) => {
      console.error('[Socket] 连接错误:', error.message)
      this.emit('error', error)
    })

    // 断开连接
    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] 断开连接，原因:', reason)
      this.isConnected = false
      this.emit('disconnect', reason)
      
      // 停止心跳
      this._stopHeartbeat()
      
      // 如果不是手动断开，尝试重连
      if (reason !== 'io client disconnect') {
        this._scheduleReconnect()
      }
    })

    // 欢迎消息
    this.socket.on('welcome', (data) => {
      console.log('[Socket] 服务器欢迎:', data.message)
      this.emit('welcome', data)
    })

    // 数据更新事件
    this.socket.on('data_update', (event) => {
      console.log('[Socket] 数据更新事件:', event.collection, event.operation)
      this._handleDataUpdate(event)
      this.emit('data_update', event)
    })

    // 订阅成功
    this.socket.on('subscribed', (data) => {
      console.log('[Socket] 订阅成功:', data.collections)
      this.emit('subscribed', data)
    })

    // 自定义事件转发
    this.socket.onAny((eventName, ...args) => {
      if (!['connect', 'connect_error', 'disconnect', 'welcome', 'data_update', 'subscribed'].includes(eventName)) {
        this.emit(eventName, ...args)
      }
    })
  }

  /**
   * 订阅特定集合的更新
   * @param {Array<string>} collections - 要订阅的集合名称数组
   */
  subscribe(collections = ['products', 'orders', 'members', 'coupons', 'shopInfo', 'miniapp_settings']) {
    if (!this.isConnected) {
      console.warn('[Socket] 未连接，无法订阅')
      return
    }

    this.subscribedCollections = collections
    this.socket.emit('subscribe', { collections })
    console.log('[Socket] 订阅请求已发送:', collections)
  }

  /**
   * 取消订阅
   * @param {Array<string>} collections - 要取消订阅的集合名称数组
   */
  unsubscribe(collections) {
    if (!this.isConnected) return

    this.socket.emit('unsubscribe', { collections })
    
    // 更新本地订阅列表
    if (collections) {
      this.subscribedCollections = this.subscribedCollections.filter(
        col => !collections.includes(col)
      )
    } else {
      this.subscribedCollections = []
    }
  }

  /**
   * 自动订阅之前设置的集合
   */
  _subscribeToCollections() {
    if (this.subscribedCollections.length > 0) {
      this.subscribe(this.subscribedCollections)
    }
  }

  /**
   * 处理数据更新事件
   */
  _handleDataUpdate(event) {
    const { collection, operation, data } = event
    
    switch (collection) {
      case 'orders':
        this._handleOrderUpdate(operation, data)
        break
        
      case 'products':
        this._handleProductUpdate(operation, data)
        break
        
      case 'members':
        this._handleMemberUpdate(operation, data)
        break
        
      case 'coupons':
        this._handleCouponUpdate(operation, data)
        break
        
      case 'shopInfo':
        this._handleShopInfoUpdate(operation, data)
        break
        
      case 'miniapp_settings':
        this._handleMiniappSettingsUpdate(operation, data)
        break
        
      default:
        console.log('[Socket] 未知集合更新:', collection)
    }
  }

  /**
   * 处理订单更新
   */
  _handleOrderUpdate(operation, orderData) {
    const orderStore = useOrderStore()
    
    switch (operation) {
      case 'CREATE':
        // 新订单
        orderStore.addNewOrder(orderData)
        break
        
      case 'UPDATE':
        // 更新现有订单
        const index = orderStore.orders.findIndex(o => o.id === orderData.id)
        if (index !== -1) {
          orderStore.orders[index] = { ...orderStore.orders[index], ...orderData }
        }
        break
        
      case 'DELETE':
        // 删除订单
        orderStore.orders = orderStore.orders.filter(o => o.id !== orderData.id)
        break
        
      case 'SYNC':
        // 批量同步，重新获取订单列表
        orderStore.fetchOrders('pending')
        break
    }
  }

  /**
   * 处理商品更新
   */
  _handleProductUpdate(operation, productData) {
    // 商品更新逻辑，可以在需要时实现
    console.log('[Socket] 商品更新:', operation, productData)
    
    // 触发商品更新事件，供组件监听
    this.emit('product_updated', { operation, data: productData })
  }

  /**
   * 处理会员更新
   */
  _handleMemberUpdate(operation, memberData) {
    console.log('[Socket] 会员更新:', operation, memberData)
    
    // 触发会员更新事件，供组件监听
    this.emit('member_updated', { operation, data: memberData })
  }

  /**
   * 处理优惠券更新
   */
  _handleCouponUpdate(operation, couponData) {
    console.log('[Socket] 优惠券更新:', operation, couponData)
    
    // 触发优惠券更新事件，供组件监听
    this.emit('coupon_updated', { operation, data: couponData })
  }

  /**
   * 处理店铺信息更新
   */
  _handleShopInfoUpdate(operation, shopData) {
    console.log('[Socket] 店铺信息更新:', operation, shopData)
    
    // 触发店铺信息更新事件，供组件监听
    this.emit('shopinfo_updated', { operation, data: shopData })
  }

  /**
   * 处理小程序设置更新
   */
  _handleMiniappSettingsUpdate(operation, settingsData) {
    console.log('[Socket] 小程序设置更新:', operation, settingsData)
    
    // 触发小程序设置更新事件，供组件监听
    this.emit('miniapp_settings_updated', { operation, data: settingsData })
  }

  /**
   * 开始心跳检测
   */
  _startHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval)
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.socket.emit('ping', { clientTime: Date.now() })
      }
    }, 30000) // 每30秒一次心跳
  }

  /**
   * 停止心跳检测
   */
  _stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * 安排重连
   */
  _scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    
    this.reconnectAttempts++
    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      console.error('[Socket] 已达到最大重连次数，停止重连')
      return
    }
    
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1)
    console.log(`[Socket] ${delay/1000}秒后尝试重连 (第${this.reconnectAttempts}次)`)
    
    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, delay)
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    
    this.isConnected = false
    this._stopHeartbeat()
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    
    console.log('[Socket] 已手动断开连接')
  }

  /**
   * 发送自定义事件（轉發給 Socket.IO 服務器）
   */
  emitToServer(eventName, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(eventName, data)
    } else {
      console.warn(`[Socket] 未連接，無法發送事件: ${eventName}`)
    }
  }

  /**
   * 触发本地事件（通知訂閱者）
   */
  emit(eventName, ...args) {
    if (this.listeners.has(eventName)) {
      this.listeners.get(eventName).forEach(callback => {
        try {
          callback(...args)
        } catch (error) {
          console.error(`[Socket] 事件监听器错误 (${eventName}):`, error)
        }
      })
    }
  }

  /**
   * 添加事件监听器
   */
  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, [])
    }
    this.listeners.get(eventName).push(callback)
  }

  /**
   * 移除事件监听器
   */
  off(eventName, callback) {
    if (this.listeners.has(eventName)) {
      const callbacks = this.listeners.get(eventName)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * 获取连接状态
   */
  getConnectionState() {
    return this.isConnected ? 'connected' : 'disconnected'
  }
}

// 导出单例
export const socketService = new SocketService()

// 默认导出，方便使用
export default socketService