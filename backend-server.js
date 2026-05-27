const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 8000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/static', express.static(path.join(__dirname, 'backend/static')));

// 数据库初始化
const dbPath = path.join(__dirname, 'solo_auto_model.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err);
  } else {
    console.log('✅ SQLite 数据库已连接');
    initDatabase();
  }
});

// 初始化数据库表
function initDatabase() {
  db.serialize(() => {
    // 用户表
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      openid TEXT UNIQUE,
      nickname TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 对话表
    db.run(`CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // 消息表
    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER,
      role TEXT,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    )`);

    console.log('✅ 数据库表初始化完成');
  });
}

// 模拟的AI回复（替代Python的mock）
function generateMockResponse(userMessage, domain = 'general') {
  const responses = {
    general: [
      `你好！我是SOLO Auto Model助手。你说的是："${userMessage}"`,
      `很高兴为您服务！关于"${userMessage}"，我来帮您解答。`,
      `收到！这是一个很好的问题。让我想想怎么回答"${userMessage}"`
    ],
    weight_loss: [
      `关于减肥的问题：${userMessage}，建议您控制饮食热量摄入，每周进行3-5次有氧运动。`,
      `减肥小贴士：要健康减重，合理饮食+规律运动是关键！针对您的问题"${userMessage}"`,
      `健康减肥需要科学方法。针对您的问题"${userMessage}"，我建议...`
    ]
  };

  const domainResponses = responses[domain] || responses.general;
  return domainResponses[Math.floor(Math.random() * domainResponses.length)];
}

// 检测问题领域
function detectDomain(message) {
  const keywords = {
    weight_loss: ['减肥', '瘦身', '减重', '胖', '热量', '饮食', '运动', 'BMI', '减脂']
  };

  for (const [domain, words] of Object.entries(keywords)) {
    if (words.some(word => message.includes(word))) {
      return domain;
    }
  }
  return 'general';
}

// 微信验证接口 (GET)
app.get('/wechat', (req, res) => {
  const { signature, timestamp, nonce, echostr } = req.query;
  console.log('收到微信验证请求:', { signature, timestamp, nonce });
  res.send(echostr || 'success');
});

// 微信消息接口 (POST)
app.post('/wechat', (req, res) => {
  console.log('收到微信消息:', req.body);
  
  const replyMsg = generateMockResponse('收到用户消息');
  const xmlResponse = `
    <xml>
      <ToUserName><![CDATA[fromUser]]></ToUserName>
      <FromUserName><![CDATA[toUser]]></FromUserName>
      <CreateTime>${Date.now()}</CreateTime>
      <MsgType><![CDATA[text]]></MsgType>
      <Content><![CDATA[${replyMsg}]]></Content>
    </xml>
  `;
  
  res.set('Content-Type', 'application/xml');
  res.send(xmlResponse);
});

// 管理员登录
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'admin' && password === 'admin123') {
    res.json({
      success: true,
      token: 'mock-jwt-token-' + Date.now(),
      user: { username: 'admin', role: 'admin' }
    });
  } else {
    res.status(401).json({ success: false, message: '用户名或密码错误' });
  }
});

// 获取对话列表
app.get('/admin/conversations', (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;
  const offset = (page - 1) * pageSize;

  db.all(`SELECT c.*, u.nickname as user_nickname 
          FROM conversations c 
          LEFT JOIN users u ON c.user_id = u.id 
          ORDER BY c.updated_at DESC 
          LIMIT ? OFFSET ?`, 
    [parseInt(pageSize), offset], 
    (err, conversations) => {
      if (err) return res.status(500).json({ error: err.message });

      db.get('SELECT COUNT(*) as total FROM conversations', (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          success: true,
          data: conversations,
          pagination: {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            total: result.total
          }
        });
      });
    }
  );
});

// 获取对话详情
app.get('/admin/conversations/:id', (req, res) => {
  const { id } = req.params;

  db.all(`SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC`, 
    [id], 
    (err, messages) => {
      if (err) return res.status(500).json({ error: err.message });
      
      db.get(`SELECT * FROM conversations WHERE id = ?`, [id], (err, conversation) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          success: true,
          data: {
            conversation,
            messages
          }
        });
      });
    }
  );
});

// 删除对话
app.delete('/admin/conversations/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM messages WHERE conversation_id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.run('DELETE FROM conversations WHERE id = ?', [id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

// 获取用户列表
app.get('/admin/users', (req, res) => {
  db.all('SELECT * FROM users ORDER BY created_at DESC', (err, users) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, data: users });
  });
});

// 获取系统统计
app.get('/admin/stats', (req, res) => {
  db.serialize(() => {
    db.get('SELECT COUNT(*) as users FROM users', (err, usersResult) => {
      db.get('SELECT COUNT(*) as conversations FROM conversations', (err, convResult) => {
        db.get('SELECT COUNT(*) as messages FROM messages', (err, msgResult) => {
          res.json({
            success: true,
            data: {
              users: usersResult.users,
              conversations: convResult.conversations,
              messages: msgResult.messages,
              recentActivity: [
                { time: new Date().toISOString(), type: 'message', desc: '模拟用户对话' }
              ]
            }
          });
        });
      });
    });
  });
});

// 获取配置
app.get('/admin/config', (req, res) => {
  res.json({
    success: true,
    data: {
      modelApiUrl: 'http://localhost:8000/v1/chat/completions',
      enableDomainDetection: true,
      enableImageGeneration: false
    }
  });
});

// 更新配置
app.put('/admin/config', (req, res) => {
  res.json({ success: true, message: '配置已更新' });
});

// 简单的聊天接口用于测试
app.post('/api/chat', (req, res) => {
  const { message, conversationId } = req.body;
  const domain = detectDomain(message);
  const response = generateMockResponse(message, domain);
  
  // 保存到数据库（模拟）
  if (conversationId) {
    db.run('INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)', 
      [conversationId, 'user', message]);
    db.run('INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)', 
      [conversationId, 'assistant', response]);
  }
  
  res.json({
    success: true,
    data: {
      role: 'assistant',
      content: response,
      domain
    }
  });
});

// 创建新对话
app.post('/api/conversation', (req, res) => {
  const { openid = 'demo-user' } = req.body;
  
  // 创建或获取用户
  db.get('SELECT * FROM users WHERE openid = ?', [openid], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const createUserOrGet = (callback) => {
      if (user) {
        callback(user);
      } else {
        db.run('INSERT INTO users (openid, nickname) VALUES (?, ?)', 
          [openid, '演示用户'], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            db.get('SELECT * FROM users WHERE id = ?', [this.lastID], callback);
          });
      }
    };
    
    createUserOrGet((userObj) => {
      db.run('INSERT INTO conversations (user_id, title) VALUES (?, ?)', 
        [userObj.id, '新对话'], function(err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({
            success: true,
            data: { conversationId: this.lastID, userId: userObj.id }
          });
        });
    });
  });
});

// 根路径
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>SOLO Auto Model API</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto; margin: 40px; }
          h1 { color: #3b82f6; }
          .container { max-width: 800px; margin: 0 auto; }
          .card { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 10px 0; }
          code { background: #e2e8f0; padding: 2px 6px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 SOLO Auto Model 微信服务号</h1>
          <p>后端服务已正常运行！</p>
          
          <div class="card">
            <h3>📋 可用接口</h3>
            <ul>
              <li><code>GET /</code> - 此页面</li>
              <li><code>GET /wechat</code> - 微信验证</li>
              <li><code>POST /wechat</code> - 微信消息处理</li>
              <li><code>POST /admin/login</code> - 管理员登录</li>
              <li><code>GET /admin/conversations</code> - 对话列表</li>
              <li><code>GET /admin/stats</code> - 系统统计</li>
            </ul>
          </div>
          
          <div class="card">
            <h3>👤 管理员登录</h3>
            <p>用户名: <strong>admin</strong></p>
            <p>密码: <strong>admin123</strong></p>
          </div>
          
          <div class="card">
            <h3>🌐 管理后台</h3>
            <p>访问: <a href="http://localhost:3000" target="_blank">http://localhost:3000</a></p>
          </div>
        </div>
      </body>
    </html>
  `);
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ SOLO Auto Model 后端服务已启动！`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`📚 API 文档: http://localhost:${PORT}`);
  console.log(`\n💡 提示: 前端将在 http://localhost:3000 运行\n`);
});
