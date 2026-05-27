@echo off
chcp 65001 >nul
title 安装 Ollama + 配置模型

echo ========================================
echo   安装 Ollama 本地 AI 模型服务
echo ========================================
echo.

REM 检查是否已安装 Ollama
where ollama >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Ollama 已安装
    goto :skip_install
)

echo [1/3] 正在下载 Ollama...
powershell -Command "Invoke-WebRequest -Uri 'https://ollama.com/download/OllamaSetup.exe' -OutFile 'OllamaSetup.exe'"

echo [2/3] 正在安装 Ollama...
OllamaSetup.exe /S

echo.
echo 安装完成，等待服务启动...
timeout /t 5 /nobreak >nul

:skip_install

REM 设置环境变量
setx PATH "%PATH%;%USERPROFILE%\.ollama\bin" /M

echo.
echo [3/3] 下载推荐模型...
echo 正在下载 qwen2.5:7b 模型（约 4GB，请耐心等待）...
echo.

REM 启动 Ollama 服务并下载模型
start "Ollama-Service" cmd /k "ollama run qwen2.5:7b"

echo.
echo ========================================
echo   Ollama 安装完成！
echo ========================================
echo.
echo 模型正在后台下载，请等待几分钟...
echo.
echo 配置信息：
echo   API 地址: http://localhost:11434/v1/chat/completions
echo   模型名称: qwen2.5:7b
echo   API Key: 不需要（本地运行）
echo.
echo 下一步：
echo 1. 等待模型下载完成（终端显示"ready"）
echo 2. 修改 config.js 配置文件
echo 3. 重启服务
echo.

pause
