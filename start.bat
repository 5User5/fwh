@echo off
chcp 65001 >nul
echo ========================================
echo   SOLO Auto Model 微信服务号
echo ========================================
echo.

REM 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到Python，请先安装Python 3.8+
    pause
    exit /b 1
)

echo [1/3] 检查虚拟环境...
if not exist "venv" (
    echo 创建虚拟环境...
    python -m venv venv
)

echo [2/3] 激活虚拟环境并安装依赖...
call venv\Scripts\activate.bat
pip install -r requirements.txt

echo [3/3] 检查.env文件...
if not exist ".env" (
    echo 复制.env.example为.env...
    copy .env.example .env
    echo 请编辑.env文件配置必要的参数！
)

echo.
echo ========================================
echo   启动完成！
echo ========================================
echo.
echo 后端服务将在 http://localhost:8000 启动
echo 访问 http://localhost:8000/docs 查看API文档
echo.
echo 按 Ctrl+C 停止服务
echo.

cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
