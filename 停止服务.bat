@echo off
chcp 65001 >nul
title 停止 SOLO Auto Model 服务

echo ========================================
echo   停止 SOLO Auto Model 服务
echo ========================================
echo.

echo 正在停止前端服务...
taskkill /f /im node.exe /fi "WINDOWTITLE eq SOLO-Frontend*" 2>nul
taskkill /f /im node.exe /fi "WINDOWTITLE eq SOLO-Backend*" 2>nul

REM 停止所有 node 进程（谨慎使用）
echo.
echo 停止所有 Node.js 进程...
taskkill /f /im node.exe 2>nul

echo.
echo ========================================
echo   所有服务已停止
echo ========================================
echo.

pause
