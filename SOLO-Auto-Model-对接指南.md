# SOLO Auto Model 对接配置指南

## 📋 快速配置

### 方法一：修改配置文件

在项目根目录找到或创建 `.env` 文件，添加以下配置：

```env
# SOLO Auto Model API 配置
MODEL_API_URL=http://你的服务器地址:端口/v1/chat/completions
MODEL_API_KEY=你的API密钥
MODEL_USE_MOCK=false
```

### 方法二：直接修改代码

打开 `simple-server.js`，找到 `generateMockResponse` 函数，替换为真实 API 调用：

```javascript
// 替换这个函数
async function callSOLOAutoModel(messages) {
  const response = await fetch(process.env.MODEL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MODEL_API_KEY}`
    },
    body: JSON.stringify({
      model: 'solo-auto-model',
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000
    })
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
}
```

## 🔧 详细步骤

### 1. 获取 API 信息

从您的 SOLO Auto Model 部署获取：
- **API URL**: 通常是 `http://服务器IP:端口/v1/chat/completions`
- **API Key**: 认证密钥

### 2. 创建配置文件

在项目根目录创建 `config.js`：

```javascript
module.exports = {
  soloAutoModel: {
    apiUrl: 'http://你的服务器:端口/v1/chat/completions',
    apiKey: '你的密钥',
    model: 'solo-auto-model',
    useMock: false
  }
};
```

### 3. 更新对话处理逻辑

修改 `simple-server.js` 中的聊天接口，添加真实 API 调用：

```javascript
// 在文件顶部添加
const config = require('./config');

// 修改聊天接口
app.post('/api/chat', async (req, res) => {
  const { message, conversationId } = req.body;
  const domain = detectDomain(message);
  
  let response;
  
  if (!config.soloAutoModel.useMock) {
    // 调用真实 SOLO Auto Model
    try {
      const fullResponse = await callSOLOAutoModel([
        { role: 'system', content: getSystemPrompt(domain) },
        { role: 'user', content: message }
      ]);
      response = fullResponse;
    } catch (error) {
      console.error('SOLO Auto Model 调用失败:', error);
      response = '抱歉，AI 服务暂时不可用。';
    }
  } else {
    // 使用模拟回复
    response = generateMockResponse(message, domain);
  }
  
  // ... 保存消息逻辑 ...
  
  res.json({
    success: true,
    data: {
      role: 'assistant',
      content: response,
      domain
    }
  });
});
```

## 📡 SOLO Auto Model API 格式

### 请求格式
```json
{
  "model": "模型名称",
  "messages": [
    {"role": "system", "content": "你是一个助手"},
    {"role": "user", "content": "用户问题"}
  ],
  "temperature": 0.7,
  "max_tokens": 2000
}
```

### 响应格式
```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "AI 回复内容"
      }
    }
  ]
}
```

## ✅ 配置检查清单

- [ ] 确认 SOLO Auto Model 服务正在运行
- [ ] 获取正确的 API URL
- [ ] 配置 API 密钥
- [ ] 测试 API 连通性
- [ ] 更新代码中的 API 调用
- [ ] 测试对话功能

## 🧪 测试 API 连通性

在命令行中测试：

```bash
curl -X POST http://你的API地址/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 你的密钥" \
  -d '{
    "model": "solo-auto-model",
    "messages": [{"role": "user", "content": "你好"}]
  }'
```

## ⚠️ 常见问题

### 1. 连接超时
- 检查 SOLO Auto Model 服务是否运行
- 确认防火墙设置
- 检查 API URL 是否正确

### 2. 认证失败
- 确认 API Key 正确
- 检查授权头格式

### 3. 响应格式错误
- 确认返回的是标准 OpenAI 格式
- 检查模型名称是否正确

## 📞 获取帮助

如果配置遇到问题，请提供：
1. SOLO Auto Model 的部署地址
2. 具体的错误信息
3. API 响应示例

---

**配置完成后，只需重启服务即可生效！**
