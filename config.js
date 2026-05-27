// ==========================================
// 小张 配置文件
// ==========================================

// 推荐方案：使用 Ollama 本地运行模型（完全免费）
const CONFIG = {
  // 小张 设置
  soloAutoModel: {
    // DeepSeek API 地址
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    
    // DeepSeek API 密钥
    apiKey: 'sk-a37862ddb0fa482d9a1520d65e8a6139',
    
    // DeepSeek 模型名称
    model: 'deepseek-chat',
    
    // 是否使用模拟模式（false = 使用真实 Ollama）
    useMock: false,  // ← 设置为 false 启用真实 AI
    
    // 请求参数
    temperature: 0.7,
    maxTokens: 2000,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0
  },
  
  // 领域提示词配置
  domains: {
    general: '你是一个乐于助人的AI助手，名为小张。请用中文回答问题。',
    weight_loss: `你是一个专业的减肥顾问助手。请根据用户的问题，提供科学的减肥建议：
- 饮食建议：控制热量摄入，均衡营养
- 运动建议：制定合理的运动计划
- 生活习惯：养成健康的生活方式
- 心理建议：保持积极的心态
请用专业、温和的语气回答。`,
    fitness: '你是一个专业的健身教练。请为用户提供科学的健身指导。',
    nutrition: '你是一个专业的营养师。请为用户提供科学的饮食建议。'
  },
  
  // 图片生成设置
  imageGeneration: {
    enable: false,
    apiUrl: 'http://localhost:your-port/v1/images/generations',
    apiKey: ''
  },
  
  // 微信服务号配置
  wechat: {
    enabled: true,                    // 启用微信服务
    appId: 'wx63370fe4348399c2',     // 您的AppID
    appSecret: '208ffa3a3103c8adf90f3b9b1de1c76e',  // 您的AppSecret
    token: 'SOLOAutoModel2024',       // 验证Token（可自定义）
    encodingAESKey: '',                // 加密模式时填写（可选）
    encryptMode: false,                // false=明文模式, true=加密模式
    accessToken: null,                 // AccessToken缓存
    accessTokenExpireTime: 0           // Token过期时间
  }
};

module.exports = CONFIG;
