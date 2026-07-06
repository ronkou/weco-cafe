# WECO CAFE 項目文件清單總覽

> 生成日期：2026-07-06
> 工作目錄：2 個 · 總計約 177MB · 420+ 個文件

---

## 📁 兩個工作目錄

| 目錄 | 路徑 | 大小 | 文件數 | 用途 |
|------|------|------|--------|------|
| 主項目 | `C:\Users\Administrator\WorkBuddy\weco-cafe\` | 173MB | 386 | 後端 API + 小程序 + 管理後台 |
| workspace | `C:\Users\Administrator\WorkBuddy\20260408121402\` | 3.7MB | 34 | 當前 session 的文檔與調試資料 |

---

## 🟪 weco-cafe/ (主項目)

### 根目錄配置文件

| 文件 | 大小 | 說明 |
|------|------|------|
| `index.js` | 40KB (1211 行) | **後端 API 主文件** · Express + MongoDB |
| `vercel.json` | 196B | Vercel 部署配置 |
| `package.json` | 323B | 後端依賴聲明 |
| `package-lock.json` | 45KB | 依賴鎖定 |
| `Dockerfile` | 137B | Docker 容器配置 |
| `.gitignore` | 472B | Git 忽略規則 |
| `README.md` | 59B | 項目說明 |

### 部署 & 腳本

| 文件 | 大小 | 說明 |
|------|------|------|
| `DEPLOY.md` | 2.2KB | Vercel 部署指南 |
| `deploy.sh` | 801B | Deploy Hook 觸發腳本 |
| `push-to-github.py` | 4.6KB | GitHub API 推送腳本 |
| `push-to-github.sh` | 1.1KB | Git push 腳本 |
| `set-env.ps1` | 351B | 環境變量設置 |
| `build-trigger.txt` | 43B | 構建觸發標記 |
| `.github/workflows/deploy.yml` | 624B | GitHub Actions 自動部署工作流 |

### coffee-order-app/ (微信小程序 · 4.2MB)

**小程序核心文件：**

| 文件 | 大小 | 說明 |
|------|------|------|
| `app.js` | 22KB | 小程序入口邏輯 |
| `app.json` | 1.7KB | 全局配置（頁面、tabBar、window） |
| `app.wxss` | 4.4KB | 全局樣式 |
| `project.config.json` | 1.2KB | IDE 項目配置 |

**pages/ 14 個頁面：**

```
pages/
├── admin/                    # 管理功能
│   ├── admin.js              # 管理首頁
│   ├── coupon-manager.js     # 優惠券管理
│   ├── payment-settings.js   # 支付設置
│   ├── member-levels/        # 會員等級
│   └── role-management/      # 角色管理
├── cart/                     # 購物車
├── coupon/                   # 優惠券
├── index/                    # 首頁
├── item-detail/              # 商品詳情
├── menu/                     # 菜單
├── order/                    # 訂單詳情
├── orders/                   # 訂單列表
├── payment/                  # 支付
├── profile/                  # 個人中心
└── webview/                  # 內嵌網頁
```

**backend/ (小程序後端獨立版本)：**

```
backend/
├── index.js                  # 後端入口
├── controllers/
│   ├── adminController.js
│   ├── couponController.js
│   ├── memberController.js
│   ├── orderController.js
│   ├── productController.js
│   └── shopController.js
├── models/
│   ├── Category.js
│   ├── Coupon.js
│   ├── Member.js
│   ├── Order.js
│   └── Product.js
├── public/admin/             # 構建產物
├── public/admin.bak/         # 備份構建
├── Dockerfile
├── ecosystem.config.js
├── .env.example
└── DEPLOYMENT.md
```

**20 份指南文檔：**

| 文件 | 大小 |
|------|------|
| ADMIN-GUIDE.md | 7.7KB |
| CLOUD-DEPLOYMENT-DECISION-TOOL.md | 5.1KB |
| COMPLETE-TEST-PLAN.md | 10KB |
| DEPLOYMENT-CHECKLIST.md | 11KB |
| DEPLOYMENT-GUIDE.md | 8.9KB |
| DEV-GUIDE.md | 5.4KB |
| LOCAL-TEST-GUIDE.md | 8.6KB |
| PERFORMANCE-OPTIMIZATION.md | 13.5KB |
| PUBLISH-ACTION-PLAN.md | 8.9KB |
| QUICK-DECISION-GUIDE.md | 4.2KB |
| QUICK-PUBLISH-CHECKLIST.md | 3.9KB |
| QUICK-START-TEST.md | 8.5KB |
| START-TESTING-NOW.md | 6KB |
| SUBSCRIBE-MESSAGE-GUIDE.md | 7.1KB |
| TEST-EXECUTION-KIT.md | 11.5KB |
| THIRD-PARTY-DEVELOPMENT-GUIDE.md | 10.8KB |
| TODAY-ACTION-CHEAT-SHEET.md | 6.6KB |
| USER-MANUAL.md | 11.2KB |
| WECHAT-CLOUD-RUN-GUIDE.md | 10.4KB |
| WECHAT-MINI-PROGRAM-PUBLISH-GUIDE.md | 7.5KB |
| 多支付方式同時生效-使用說明.md | - |

### pos-admin/ (Vue3 管理後台 · 122MB)

**項目配置：**

| 文件 | 說明 |
|------|------|
| `package.json` | Vue3 + Vite + Vant |
| `vite.config.js` | Vite 構建配置 |
| `index.html` | 入口 HTML |
| `.env` / `.env.local` / `.env.production` | 環境變量 |
| `README.md` | 管理後台說明 |

**src/api/ — 11 個 API 模組：**

```
api/
├── auth.js          # 認證
├── coupon.js        # 優惠券
├── member.js        # 會員
├── order.js         # 訂單
├── payment.js       # 支付
├── product.js       # 商品
├── report.js        # 報表
├── request.js       # 請求封裝
├── settings.js      # 設置
├── socket.js        # WebSocket
└── user.js          # 用戶
```

**src/views/ — 7 個頁面：**

```
views/
├── Dashboard.vue                    # 儀表板
├── Login.vue                        # 登入
├── Management.vue                   # 管理設置（含自動保存）
├── Management.sync-conflict-*.vue   # ⚠️ 同步衝突備份
├── Orders.vue                       # 訂單管理
├── PosOrder.vue                     # POS 下單
├── Report.vue                       # 報表
└── Settlement.vue                   # 結算
```

**src/utils/ — 7 個工具：**

```
utils/
├── auto-save.js          # 自動保存（防抖 800ms）
├── image-compress.js     # 圖片壓縮
├── keyboard-shortcuts.js # 鍵盤快捷鍵
├── offline.js            # 離線支持
├── platform.js           # 平台檢測
├── syncService.js        # 同步服務
└── websocket.js          # WebSocket 客戶端
```

**其他：**

```
src/
├── App.vue              # 根組件
├── main.js              # 入口
├── router/index.js      # 路由
├── stores/
│   ├── auth.js          # 認證狀態
│   └── order.js         # 訂單狀態
├── components/
│   └── OrderCard.vue    # 訂單卡片
└── styles/
    ├── android-fixes.css
    └── safari-fixes.css
```

### public/admin/ (構建產物 · 262KB)

編譯後的前端資源，包含 CSS、JS 和 logo。

### .workbuddy/memory/ (開發歷程 · ~206KB)

| 文件 | 大小 | 日期 |
|------|------|------|
| 2026-03-28.md | 21KB | 初始開發 |
| 2026-03-29.md | 51KB | 小程序開發 |
| 2026-03-30.md | 49KB | 功能實現 |
| 2026-03-31.md | 32KB | 調試優化 |
| 2026-04-08.md | 20KB | 後端整合 |
| 2026-04-09.md | 27KB | API 開發 |
| 2026-04-10.md | 3KB | 部署測試 |
| MEMORY.md | 6.3KB | 長期記憶 |

**另含：**
- `admin-demo.html` (15KB) — 管理界面演示
- `api-integration-test.html` (31KB) — API 集成測試頁

---

## 🟩 20260408121402/ (workspace)

### 項目文檔 (.md)

| 文件 | 大小 | 說明 |
|------|------|------|
| `PROJECT-SUMMARY.md` | 4.4KB | 項目總結 |
| `POS管理界面扩展指南.md` | 6.9KB | POS 擴展指南 |
| `Railway部署指南.md` | 4.3KB | Railway 部署 |
| `WebSocket迁移部署指南.md` | 3.9KB | WebSocket 遷移 |
| `Vercel与MongoDB服务记录.md` | 5KB | 服務記錄 |
| `GitHub上傳完成報告.md` | 4.9KB | 上傳報告 |
| `小程序管理后台扩展方案A.md` | 4.1KB | 擴展方案 |
| `env-vars-payment.md` | 1.5KB | 支付環境變量 |
| `index.js-for-github.md` | 4.8KB | GitHub 版本索引 |

### 調試截圖 (.png)

| 文件 | 大小 |
|------|------|
| `current_page.png` | 57KB |
| `dashboard.png` | 59KB |
| `dashboard2.png` | 59KB |
| `debug_screenshot.png` | 57KB |
| `login_attempt.png` | 23KB |

### 調試腳本

| 文件 | 大小 | 說明 |
|------|------|------|
| `analyze_page.py` | 3.7KB | 頁面分析 |
| `debug_page.py` | 2.4KB | 頁面調試 |
| `test_login.py` | 4.7KB | 登入測試 |
| `fix-mgmt.mjs` | 845B | 管理界面修復 |
| `remove-railway-toml.ps1` | 985B | Railway 配置清理 |

### 其他文件

| 文件 | 說明 |
|------|------|
| `response.txt` | API 響應記錄 |
| `el.src'` / `img.src)'` | ⚠️ 調試殘留文件（可清理） |
| `nul` | ⚠️ 空文件（可清理） |

### .workbuddy/memory/ (~44KB)

| 文件 | 大小 | 日期 |
|------|------|------|
| 2026-04-09.md | 1.8KB | 初始記錄 |
| 2026-04-10.md | 20KB | API 開發 |
| 2026-04-11.md | 10KB | 功能擴展 |
| 2026-04-12.md | 1.4KB | 小修正 |
| 2026-04-13.md | 1.2KB | 部署準備 |
| 2026-04-14.md | 6KB | Railway 部署 |
| 2026-04-15.md | 1.1KB | 後續調整 |
| 2026-05-14.md | 1.6KB | 進度更新 |
| MEMORY.md | 3.9KB | 長期記憶 |

---

## 🚀 部署狀態

| 服務 | URL | 狀態 |
|------|-----|------|
| Vercel 前端 | https://wecocafe.com | ✅ 已部署 |
| Vercel API | https://api.wecocafe.com/api | ⚠️ 部署未更新 |
| Railway WebSocket | https://weco-cafe-backend-production.up.railway.app | ✅ 已部署 |
| MongoDB Atlas | 集群 `wearmo` / 數據庫 `weco-cafe` | ✅ 運行中 |
| GitHub | https://github.com/ronkou/weco-cafe | ✅ 已同步 |

**關鍵問題**：Vercel API 部署未更新，新路由（lines 838+）返回 404。需要手動觸發 Vercel 重新部署。

---

## ⚠️ 注意事項

1. **同步衝突文件**：
   - `pos-admin/src/views/Management.sync-conflict-20260424-155531-G4IC36F.vue`
   - `coffee-order-app/backend/index.sync-conflict-20260424-155421-G4IC36F.js`
   - `coffee-order-app/backend/package.sync-conflict-20260424-155504-G4IC36F.json`
   - 這些是文件同步衝突產生的備份，建議對比後刪除

2. **備份目錄**：
   - `coffee-order-app/backend/public/admin.bak/` — 舊版構建產物備份
   - 可在確認當前版本正常後清理

3. **調試殘留**：
   - `20260408121402/el.src'`、`img.src)'`、`nul` — 調試過程產生的無效文件
   - 建議清理

4. **GitHub 集成缺失**：
   - Vercel 沒有 GitHub 自動部署鉤子
   - 已創建 `.github/workflows/deploy.yml` 但需要配置 Vercel token

---

## 📊 文件類型統計

| 類型 | 數量 | 主要用途 |
|------|------|----------|
| JavaScript (.js) | ~50 | 後端 API + 前端邏輯 |
| Vue (.vue) | ~10 | 管理後台組件 |
| Markdown (.md) | ~40 | 文檔與指南 |
| 配置 (.json) | ~15 | 項目配置 |
| 樣式 (.css/.wxss) | ~10 | 樣式定義 |
| 模板 (.wxml) | ~15 | 小程序頁面模板 |
| 圖片 (.png) | ~10 | 圖標與截圖 |
| 構建產物 | ~30 | 編譯後的 JS/CSS |

---

*本清單由 WorkBuddy 自動生成 · 2026-07-06*
