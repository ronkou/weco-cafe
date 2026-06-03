@echo off
chcp 65001 >nul
title WECO CAFE 后端服务

echo.
echo ========================================
echo   WECO CAFE 后端服务启动器
echo ========================================
echo.

::: 进入后端目录
cd /d "%~dp0"

::: 检查 Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js
    echo 请先安装: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js 版本:
node --version

::: 检查 npm
echo [OK] npm 版本:
npm --version

::: 安装依赖（如需要）
if not exist "node_modules" (
    echo.
    echo [1/2] 正在安装依赖...
    npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
)

::: 启动服务
echo.
echo [2/2] 启动后端服务...
echo    端口: %PORT%
echo    MongoDB: mongodb+srv://ronkou@wearmo.oflm07j.mongodb.net
echo.
echo ========================================
echo   按 Ctrl+C 停止服务
echo ========================================
echo.

::: 启动 nodemon（热重载模式）
npm run dev
