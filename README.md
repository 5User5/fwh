# SOLO Auto Model 微信服务号

一个基于 Python FastAPI 和 React 的微信服务号智能对话系统，集成了大语言模型和领域知识问答功能。

## 功能特性

- 🤖 **智能对话**：支持与大语言模型进行自然语言对话
- 🏋️ **领域问答**：内置减肥、健身、营养、健康等专业领域的知识问答
- 💬 **对话历史**：自动保存对话记录，支持上下文理解
- 📊 **管理后台**：提供可视化的管理界面和统计数据
- 🔒 **安全认证**：管理员登录认证功能
- 📝 **微信集成**：完整的微信服务号消息处理
- 🖼️ **图片生成**：支持图片生成功能（可选）

## 技术栈

### 后端
- **框架**：FastAPI
- **ORM**：SQLAlchemy
- **数据库**：SQLite
- **认证**：Python-JOSE, Passlib
- **日志**：Python logging

### 前端
- **框架**：React 18
- **UI组件**：Ant Design 5
- **路由**：React Router
- **数据可视化**：Recharts
- **HTTP客户端**：Axios

## 项目结构

```
服务号/
├── backend/                 # 后端代码
│   ├── app/
│   │   ├── api/            # API路由
│   │   ├── models/         # 数据模型
│   │   ├── schemas/        # Pydantic模式
│   │   ├── core/           # 核心配置
│   │   └── services/       # 业务逻辑
│   ├── main.py            # 应用入口
│   └── static/            # 静态文件
├── frontend/              # 前端代码
│   ├── src/
│   │   ├── components/    # 组件
│   │   ├── pages/         # 页面
│   │   ├── contexts/      # 上下文
│   │   └── services/      # API服务
│   └── public/
├── tests/                 # 测试文件
│   ├── test_wechat.py
│   ├── test_chat.py
│   └── test_model.py
├── .env.example           # 环境变量示例
├── requirements.txt       # Python依赖
├── start.bat             # Windows启动脚本
└── README.md
```

## 快速开始

### 前置要求

- Python 3.8+
- Node.js 16+
- npm 或 yarn

### 后端开发

1. 创建并激活虚拟环境：
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python -m venv venv
source venv/bin/activate
```

2. 安装依赖：
```bash
pip install -r requirements.txt
```

3. 配置环境变量：
```bash
# 复制示例文件
copy .env.example .env

# 编辑.env文件，填入必要的配置
```

4. 启动后端服务：
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

后端服务将在 http://localhost:8000 启动

### 前端开发

1. 安装依赖：
```bash
cd frontend
npm install
```

2. 启动开发服务器：
```bash
npm start
```

前端应用将在 http://localhost:3000 启动

### 一键启动（Windows）

使用提供的启动脚本：
```bash
start.bat
```

## 配置说明

通过 `.env` 文件配置应用：

```env
# 微信服务号配置
WECHAT_TOKEN=your_wechat_token
WECHAT_APPID=your_appid
WECHAT_SECRET=your_secret
WECHAT_ENCODING_AES_KEY=your_encoding_aes_key

# 数据库配置
DATABASE_URL=sqlite:///./solo_auto_model.db

# 模型API配置
MODEL_API_URL=http://localhost:8000/v1/chat/completions
MODEL_API_KEY=your_model_api_key
MODEL_TIMEOUT=30
MODEL_MAX_RETRIES=3
MODEL_RETRY_DELAY=1.0
MODEL_USE_MOCK=true

# 对话配置
MAX_CONTEXT_LENGTH=20
MAX_TOKENS=4000
SYSTEM_PROMPT=你是一个乐于助人的AI助手。

# 领域检测
ENABLE_DOMAIN_DETECTION=true
DEFAULT_DOMAIN=general

# 管理员配置
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_SECRET_KEY=your-secret-key-change-in-production

# 图片生成配置
ENABLE_IMAGE_GENERATION=false
IMAGE_API_URL=
IMAGE_API_KEY=
IMAGE_USE_MOCK=true
```

## API文档

启动后端服务后，访问以下地址查看API文档：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 微信服务号配置

1. 登录微信公众平台
2. 在开发 -> 基本配置中：
   - 设置服务器地址(URL): `https://your-domain.com/wechat`
   - 设置Token: 与.env中的WECHAT_TOKEN一致
   - 配置EncodingAESKey

## 部署指南

### 后端部署（使用uvicorn + gunicorn）

```bash
# 生产环境启动
cd backend
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000
```

### 前端部署

```bash
cd frontend
npm run build
# 将build目录内容部署到web服务器
```

### 使用Docker

创建Dockerfile（示例）：
```dockerfile
# 后端
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 运行测试

```bash
# 安装测试依赖
pip install pytest

# 运行测试
cd tests
pytest test_wechat.py -v
pytest test_chat.py -v
pytest test_model.py -v

# 运行所有测试
pytest -v
```

## 功能模块

### 领域问答

系统支持以下专业领域：
- **通用对话**：日常聊天和问答
- **减肥顾问**：提供专业的减肥建议和方案
- **健身教练**：提供运动和健身指导
- **营养师**：提供营养和饮食建议
- **健康顾问**：提供健康管理和预防建议

### 管理后台功能

- 用户和对话记录查看
- 系统配置管理
- 使用统计和数据可视化
- 管理员认证

## 常见问题

### 如何重置对话？
在微信中发送"清空对话"或"/clear"命令即可重置当前对话。

### 模型API调用失败？
检查.env中的MODEL_API_URL和MODEL_API_KEY配置是否正确，或设置MODEL_USE_MOCK=true使用模拟模式。

### 数据库位置？
SQLite数据库文件默认位于 `backend/solo_auto_model.db`

## 许可证

本项目仅供学习和研究使用。

## 贡献

欢迎提交Issue和Pull Request！

## 联系方式

如有问题，请通过以下方式联系：
- 提交GitHub Issue
- 发送邮件至项目维护者
