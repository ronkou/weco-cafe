# WECO CAFE Vercel 部署指南

## 問題診斷

**現象**: `/api/settings/payment` 等新路由返回 404，但 `/api/settings/all` 正常

**原因**: 代碼已正確上傳到 GitHub (1211行)，但 Vercel 部署未更新
- Vercel 未連接到 GitHub 倉庫
- 沒有自動部署觸發器

## 解決方案

### 方案 A: 手動觸發 Vercel 部署（推薦，快速）

1. **登入 Vercel**
   - 訪問 https://vercel.com/dashboard
   - 使用 GitHub 帳號登入

2. **找到項目**
   - 點擊 `weco-cafe-api` 項目

3. **觸發部署**
   - 點擊 `Deployments` 標籤
   - 點擊右上角 `Create Deployment`
   - 選擇 `weco-cafe` 倉庫
   - 點擊 `Deploy`

### 方案 B: 設置 GitHub Actions 自動部署（長期方案）

1. **獲取 Vercel 憑據**
   - 訪問 https://vercel.com/account/tokens
   - 創建新的 API Token

2. **添加 GitHub Secrets**
   - 訪問 https://github.com/ronkou/weco-cafe/settings/secrets
   - 添加以下 secrets:
     - `VERCEL_TOKEN`: 你的 Vercel API Token
     - `VERCEL_ORG_ID`: 團隊 ID (格式: team_xxx)
     - `VERCEL_PROJECT_ID`: 項目 ID (格式: prj_xxx)

3. **觸發工作流**
   - 訪問 https://github.com/ronkou/weco-cafe/actions
   - 點擊 `Deploy to Vercel` > `Run workflow`

### 方案 C: 使用 Deploy Hook（簡單）

1. **創建 Deploy Hook**
   - 在 Vercel 項目設置中，進入 `Git > Deploy Hooks`
   - 創建一個 hook，命名為 `github-deploy`

2. **添加 webhook 到 GitHub**
   - 訪問 GitHub 倉庫設置 > Webhooks
   - 添加 webhook:
     - Payload URL: 粘貼 Vercel Deploy Hook URL
     - Content type: application/json
     - Events: Just the push event

## 驗證部署

部署完成後，測試以下端點:

```bash
# 測試舊端點 (應正常工作)
curl https://api.wecocafe.com/api/settings/all

# 測試新端點 (部署後應正常工作)
curl https://api.wecocafe.com/api/settings/payment
curl https://api.wecocafe.com/api/test
```

## 代碼狀態

- ✅ 代碼已上傳到 GitHub (SHA: 50aa76ae4ec884f4e55b5d9a4a61bf807a0fba50)
- ✅ Payment routes 已定義 (lines 973-1047)
- ✅ 所有文件已準備就緒

## 聯繫

如有問題，請截圖錯誤信息並描述具體情況。
