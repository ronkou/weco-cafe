# WECO CAFE 微信點單系統

> 微信小程序 + Vue3 管理後台 + Express + MongoDB Atlas + Socket.IO

## 🚀 快速開始

### 1. 安裝依賴
```bash
npm install
cd pos-admin && npm install
```

### 2. 設置環境變量
複製 `.env.example` 並填入：
```bash
cp .env.example .env
```
必填項目：
- `MONGODB_URI` — MongoDB Atlas 連接字符串
- `TOKEN_SECRET` — Token 簽名密鑰（隨機 32+ 字元）
- `PASSWORD_SALT` — 密碼加鹽
- `ALLOWED_ORIGINS` — CORS 白名單

### 3. 本地開發
```bash
# 啟動後端
npm run dev

# 啟動管理後台
cd pos-admin && npm run dev
```

## 📁 項目結構

```
weco-cafe/
├── index.js                 # 後端 API 主文件 (Express + MongoDB + Socket.IO)
├── package.json
├── vercel.json              # Vercel 部署配置
├── public/admin/            # 管理後台構建產物
├── pos-admin/               # Vue3 管理後台源碼
│   ├── src/
│   │   ├── api/             # 11 個 API 模組
│   │   ├── views/           # 7 個頁面
│   │   ├── utils/           # 工具函數
│   │   ├── stores/          # 狀態管理
│   │   └── router/
│   └── package.json
└── coffee-order-app/        # 微信小程序源碼
    ├── pages/               # 14 個頁面
    ├── backend/             # 小程序獨立後端（向後兼容）
    └── app.js / app.json / app.wxss
```

## 🔌 API 端點

### 認證
- `POST /api/admin/login` — 管理員登錄（限速：5 次/分鐘）
- `GET  /api/admin/verify` — 驗證 token

### 商品 / 分類（需 token）
- `GET/POST/PUT/DELETE /api/products[/:id]`
- `GET/POST/PUT/DELETE /api/categories[/:id]`
- `POST /api/sync/products` — 批量同步

### 訂單
- `POST /api/orders`
- `PUT /api/orders/:id/status`
- `POST /api/orders/:id/{accept|reject|complete|pay}`

### 會員 / 優惠券
- `POST/PUT /api/members[/:id]`
- `POST/PUT/DELETE /api/coupons[/:id]`

### 設置
- `GET/PUT /api/settings/{shop,quickActions,banners,services,storeCardBg,payment}`
- `POST /api/settings/payment/test`

### 小程序
- `GET/PUT /api/miniapp/settings`

## 🔐 安全特性

| 特性 | 實現 |
|------|------|
| 密碼哈希 | SHA-256 + salt |
| Token 簽名 | HMAC-SHA256 + timing-safe 驗證 |
| 寫入 API 保護 | 全局 requireAuth + rate limit (60 req/min) |
| 登入限速 | IP-based, 5 次/分鐘 |
| CORS | 白名單 origin |
| Body 限制 | 5MB |
| 請求超時 | 30 秒 |
| 安全 Headers | X-Content-Type-Options, X-Frame-Options 等 |

## 🚢 部署

### Vercel
```bash
vercel --prod
```

### 環境變量（Vercel Dashboard 設置）
- `MONGODB_URI`
- `TOKEN_SECRET`
- `PASSWORD_SALT`
- `ALLOWED_ORIGINS`
- `DEFAULT_ADMIN_PASSWORD`（首次部署）

詳見 [DEPLOY.md](./DEPLOY.md)。

## 📡 WebSocket (Socket.IO)

連接端點：`wss://api.wecocafe.com/socket.io/`

事件：
- `subscribe { collections: [...] }` — 訂閱數據更新
- `data_update { collection, data }` — 服務器推送

## 🛠 技術棧

| 層 | 技術 |
|-----|------|
| 後端 | Node.js + Express + Socket.IO + MongoDB |
| 管理後台 | Vue 3 + Vite + Vant UI + Pinia |
| 小程序 | 微信原生 + Vant Weapp |
| 資料庫 | MongoDB Atlas |
| 部署 | Vercel (前端+API) |

## 📄 授權

Proprietary — RONK © 2026