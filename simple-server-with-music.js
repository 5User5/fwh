const express = require('express');
const crypto = require('crypto');
const CONFIG = require('./config');
const app = express();
const PORT = 8000;

const userHistory = new Map();
const userLocation = new Map();

app.use(express.text({ type: '*/*' }));

function getText(str) {
  if (!str) return '';
  const c = str.indexOf('[CDATA[');
  if (c >= 0) {
    const e = str.indexOf(']]>', c + 7);
    if (e >= 0) return str.substring(c + 7, e);
  }
  return str.trim();
}

async function searchQQMusic(keyword) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const searchUrl = `http://localhost:3200/search?key=${encodeURIComponent(keyword)}`;
    console.log('🎵 搜索QQ音乐:', searchUrl);
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    const result = await response.json();
    console.log('🎵 QQ音乐搜索结果:', result);
    
    if (result && result.data && result.data.list && result.data.list.length > 0) {
      const song = result.data.list[0];
      return {
        title: song.songname || song.name,
        description: song.singer && song.singer[0] ? song.singer[0].name : '未知歌手',
        url: `https://y.qq.com/n/yqq/song/${song.songmid || song.mid}.html`,
        songmid: song.songmid || song.mid
      };
    }
    return null;
  } catch (e) {
    console.error('🎵 搜索QQ音乐错误:', e.message);
    return null;
  }
}

async function getSongPlayUrl(songmid) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const url = `http://localhost:3200/song/url?id=${songmid}`;
    console.log('🎵 获取播放链接:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    const result = await response.json();
    console.log('🎵 播放链接结果:', result);
    
    if (result && result.data && result.data[0]) {
      return result.data[0].url;
    }
    return null;
  } catch (e) {
    console.error('🎵 获取播放链接错误:', e.message);
    return null;
  }
}

app.get('/wechat', (req, res) => {
  console.log('=== 收到微信验证请求 ===');
  const token = CONFIG.wechat.token;
  const { signature, timestamp, nonce, echostr } = req.query;
  const arr = [token, timestamp, nonce].sort();
  const hash = crypto.createHash('sha1').update(arr.join('')).digest('hex');
  res.send(hash === signature ? echostr : 'Invalid');
});

app.post('/wechat', async (req, res) => {
  console.log('=== 收到微信消息 ===');
  console.log('原始请求:', req.body);
  
  const content = getText(req.body.match(/<Content>([\s\S]*)<\/Content>/)?.[1] || '');
  const from = getText(req.body.match(/<FromUserName>([\s\S]*)<\/FromUserName>/)?.[1] || '');
  const to = getText(req.body.match(/<ToUserName>([\s\S]*)<\/ToUserName>/)?.[1] || '');
  const type = getText(req.body.match(/<MsgType>([\s\S]*)<\/MsgType>/)?.[1] || '');
  
  console.log('内容:', content);
  console.log('类型:', type);
  console.log('来自:', from);
  
  let reply = '';
  
  if (type === 'event') {
    const eventType = getText(req.body.match(/<Event>([\s\S]*)<\/Event>/)?.[1] || '');
    console.log('事件类型:', eventType);
    
    if (eventType === 'subscribe') {
      reply = '🎉 欢迎关注小张助手！\n\n我可以帮您：\n🎵 点歌功能：发送"点歌 歌曲名"\n🌤️ 查询天气\n🤖 智能对话\n\n请问有什么可以帮您的？';
    } else {
      reply = '收到事件消息';
    }
  } else if (type === 'text') {
    const isMusicRequest = content.startsWith('点歌') || content.startsWith('播放') || 
                           content.startsWith('点一首') || content.startsWith('听一首');
    
    if (isMusicRequest) {
      let songName = content.replace(/^点歌/, '').replace(/^播放/, '')
                           .replace(/^点一首/, '').replace(/^听一首/, '').trim();
      
      if (songName) {
        console.log('🎵 点歌请求:', songName);
        const musicData = await searchQQMusic(songName);
        
        if (musicData) {
          reply = `🎵 为您找到：${musicData.title} - ${musicData.description}\n\n点击链接收听：${musicData.url}`;
        } else {
          reply = `抱歉，没有找到「${songName}」相关的歌曲，请试试其他歌名！`;
        }
      } else {
        reply = '想点什么歌？请发送：点歌 歌曲名';
      }
    } else {
      const identityQuestions = ['你是谁', '你叫什么', '你是谁呀', '你叫什么名字'];
      let isIdentityQuestion = false;
      for (let q of identityQuestions) {
        if (content.includes(q)) {
          isIdentityQuestion = true;
          break;
        }
      }
      
      if (isIdentityQuestion) {
        reply = '我是小张，您的智能助手！我可以帮您点歌、查询天气、智能对话。';
      } else {
        try {
          let history = userHistory.get(from) || [];
          
          let systemPrompt = '你是小张，一个友好的智能助手。请用简洁、自然的中文回复。用户可以使用"点歌 歌曲名"来点歌。';
          
          if (history.length === 0) {
            history.push({ role: 'system', content: systemPrompt });
          }
          
          history.push({ role: 'user', content: content });
          
          if (history.length > 20) {
            history = history.slice(-20);
          }
          
          console.log('📡 发送到AI的消息:', history.length, '条');
          
          const response = await fetch(CONFIG.soloAutoModel.apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${CONFIG.soloAutoModel.apiKey}`
            },
            body: JSON.stringify({
              model: CONFIG.soloAutoModel.model,
              messages: history
            })
          });
          
          const result = await response.json();
          reply = result.choices?.[0]?.message?.content || '收到消息！';
          
          reply = reply.replace(/\*\*/g, '').replace(/\*/g, '');
          
          history.push({ role: 'assistant', content: reply });
          userHistory.set(from, history);
          
        } catch (e) {
          console.error('❌ AI调用错误:', e.message);
          reply = '抱歉，服务暂时不可用，请稍后再试。';
        }
      }
    }
  } else {
    reply = '暂不支持该类型消息';
  }
  
  console.log('📤 回复:', reply);
  
  const xml = `<xml>
    <ToUserName><![CDATA[${from}]]></ToUserName>
    <FromUserName><![CDATA[${to}]]></FromUserName>
    <CreateTime>${Date.now()}</CreateTime>
    <MsgType><![CDATA[text]]></MsgType>
    <Content><![CDATA[${reply}]]></Content>
  </xml>`;
  
  res.set('Content-Type', 'application/xml');
  res.send(xml);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '═'.repeat(60));
  console.log('   🚀 小张 音乐版服务已启动！');
  console.log('═'.repeat(60));
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`🎵 QQ音乐API: http://localhost:3200`);
  console.log('═'.repeat(60) + '\n');
});
