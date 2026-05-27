const express = require('express');
const cors = require('cors');
const CONFIG = require('./config');

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const crypto = require('crypto');

function verifyWechatSignature(req) {
  const { signature, timestamp, nonce } = req.query;
  const token = CONFIG.wechat.token;
  
  if (!signature || !timestamp || !nonce) {
    return false;
  }
  
  const arr = [token, timestamp, nonce].sort();
  const str = arr.join('');
  const sha1 = crypto.createHash('sha1');
  const hash = sha1.update(str).digest('hex');
  
  return hash === signature;
}

app.get('/wechat', (req, res) => {
  const { signature, timestamp, nonce, echostr } = req.query;
  console.log('收到微信验证请求');
  
  if (verifyWechatSignature(req)) {
    res.send(echostr);
    console.log('微信验证成功');
  } else {
    res.status(403).send('Invalid signature');
    console.log('微信验证失败');
  }
});

app.post('/wechat', express.text({ type: '*/*' }), async (req, res) => {
  try {
    console.log('\n=== 收到微信消息 ===');
    console.log('请求体:', req.body);
    
    const xml = req.body;
    const fromUser = xml.match(/<FromUserName><!\[CDATA\[([^\]]+)\]\]><\/FromUserName>/)?.[1] || '';
    const toUser = xml.match(/<ToUserName><!\[CDATA\[([^\]]+)\]\]><\/ToUserName>/)?.[1] || '';
    const msgType = xml.match(/<MsgType><!\[CDATA\[([^\]]+)\]\]><\/MsgType>/)?.[1] || '';
    const content = xml.match(/<Content><!\[CDATA\[([^\]]+)\]\]><\/Content>/)?.[1] || '';
    
    console.log('FromUser:', fromUser);
    console.log('ToUser:', toUser);
    console.log('MsgType:', msgType);
    console.log('Content:', content);
    
    let replyMsg = '';
    
    if (msgType === 'event') {
      console.log('处理事件消息');
      replyMsg = '🎉 欢迎关注小张助手！';
    } else if (msgType === 'text') {
      console.log('处理文本消息');
      
      if (content.includes('天气')) {
        console.log('检测到天气查询');
        replyMsg = '请问您想查询哪个城市的天气？';
      } else {
        console.log('调用AI回复');
        try {
          console.log('📡 正在调用 AI API:', CONFIG.soloAutoModel.apiUrl);
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);
          
          const response = await fetch(CONFIG.soloAutoModel.apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${CONFIG.soloAutoModel.apiKey}`
            },
            body: JSON.stringify({
              model: CONFIG.soloAutoModel.model,
              messages: [{ role: 'user', content: content }],
              temperature: CONFIG.soloAutoModel.temperature,
              max_tokens: CONFIG.soloAutoModel.maxTokens
            }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          console.log('✅ API 响应状态:', response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API 请求失败:', response.status, errorText);
            replyMsg = '抱歉，服务暂时不可用。';
          } else {
            const result = await response.json();
            replyMsg = result.choices[0].message.content || '收到消息！';
            console.log('✅ AI 回复成功');
          }
        } catch (error) {
          console.error('❌ AI 调用失败:', error.message);
          replyMsg = '抱歉，服务暂时不可用。';
        }
      }
    } else {
      replyMsg = '暂不支持该类型消息';
    }
    
    console.log('回复消息:', replyMsg);
    
    const xmlResponse = `
      <xml>
        <ToUserName><![CDATA[${fromUser}]]></ToUserName>
        <FromUserName><![CDATA[${toUser}]]></FromUserName>
        <CreateTime>${Date.now()}</CreateTime>
        <MsgType><![CDATA[text]]></MsgType>
        <Content><![CDATA[${replyMsg}]]></Content>
      </xml>
    `.trim();
    
    res.set('Content-Type', 'application/xml');
    res.send(xmlResponse);
    console.log('回复已发送');
    
  } catch (error) {
    console.error('❌ 处理消息失败:', error.message);
    res.status(500).send('Error');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 调试服务器启动在 http://localhost:${PORT}`);
});
