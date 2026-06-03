// WebSocket客户端测试脚本
// 用于验证Socket.IO服务器是否正常工作

const { io } = require('socket.io-client');

const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

console.log('🔌 連接至 WebSocket 服務器...');

socket.on('connect', () => {
  console.log('✅ 已連接至服務器');
  console.log('Socket ID:', socket.id);
  
  // 訂閱數據更新
  socket.emit('subscribe', {
    collections: ['products', 'shopInfo', 'miniapp_settings']
  });
});

socket.on('welcome', (data) => {
  console.log('👋 收到歡迎消息:', data);
});

socket.on('subscribed', (data) => {
  console.log('📡 訂閱成功:', data.collections);
});

socket.on('data_update', (event) => {
  console.log('🔄 收到數據更新事件:');
  console.log('  類型:', event.type);
  console.log('  集合:', event.collection);
  console.log('  操作:', event.operation);
  console.log('  時間:', event.timestamp);
  console.log('  數據:', JSON.stringify(event.data, null, 2));
});

socket.on('pong', (data) => {
  console.log('🏓 收到心跳回應:', data.serverTime);
});

socket.on('disconnect', (reason) => {
  console.log('❌ 連接斷開，原因:', reason);
});

socket.on('connect_error', (error) => {
  console.log('❌ 連接錯誤:', error.message);
});

// 發送測試心跳
setInterval(() => {
  if (socket.connected) {
    socket.emit('ping', { clientTime: new Date().toISOString() });
  }
}, 10000);

// 手動測試廣播
setTimeout(() => {
  if (socket.connected) {
    console.log('\n📢 模擬數據更新...');
    // 這裡可以手動觸發一個測試事件
    // 在實際應用中，這個事件應該由服務器API觸發
  }
}, 3000);

// 優雅退出
process.on('SIGINT', () => {
  console.log('\n👋 關閉測試客戶端...');
  socket.disconnect();
  process.exit(0);
});

console.log('測試客戶端運行中，按 Ctrl+C 退出...');
console.log('等待服務器事件...\n');