#!/bin/bash
# WECO CAFE Vercel 部署腳本
# 使用方法：
#   1. 先在 Vercel 設置頁面創建 Deploy Hook
#   2. 將 Deploy Hook URL 添加到 Vercel 項目設置 > Git > Deploy Hooks
#   3. 運行此腳本或使用 GitHub Actions 自動觸發

# 方案 A: 使用 Deploy Hook (推薦)
# 在 Vercel 項目設置中創建 deploy hook 後，替換下面的 URL
DEPLOY_HOOK_URL="https://api.vercel.com/v1/integrations/deploy/YOUR_DEPLOY_HOOK_ID"

# 觸發部署
if [ "$DEPLOY_HOOK_URL" != "https://api.vercel.com/v1/integrations/deploy/YOUR_DEPLOY_HOOK_ID" ]; then
  echo "觸發 Vercel 部署..."
  curl -X POST "$DEPLOY_HOOK_URL"
  echo ""
  echo "部署已觸發！請在 Vercel 儀表板查看進度。"
else
  echo "錯誤: 請先在 Vercel 設置中創建 Deploy Hook 並更新此腳本"
fi
