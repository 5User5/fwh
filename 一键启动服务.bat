@echo off
chcp 65001 >nul
title SOLO Auto Model 微信服务号启动器

echo ========================================
echo   SOLO Auto Model 一键启动器
echo ========================================
echo.

REM 检查 Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js
    echo 请先安装 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

REM 获取脚本所在目录
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo [1/4] 检查依赖安装...
if not exist "node_modules" (
    echo 正在安装后端依赖...
    call npm install
)

if not exist "frontend\node_modules" (
    echo 正在安装前端依赖...
    cd frontend
    call npm install
    cd ..
)

echo.
echo [2/4] 启动后端服务 (端口 8000)...
start "SOLO-Backend" cmd /k "node simple-server.js"

echo 等待后端启动...
timeout /t 3 /nobreak >nul

echo.
echo [3/4] 启动前端服务 (端口 3000)...
start "SOLO-Frontend" cmd /k "cd frontend && npm start"

echo.
echo [4/4] 打开浏览器...
timeout /t 5 /nobreak >nul
start http://localhost:8000

echo.
echo ========================================
echo   启动完成！
echo ========================================
echo.
echo 后端服务: http://localhost:8000
echo 前端服务: http://localhost:3000
echo 管理后台: http://localhost:3000
echo.
echo 管理员账号: admin / admin123
echo.
echo 请勿关闭这两个黑色窗口！
echo 关闭它们会停止服务。
echo ========================================
echo.

pause
