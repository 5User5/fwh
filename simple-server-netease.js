const express = require('express');
const crypto = require('crypto');
const CONFIG = require('./config');
const app = express();
const PORT = 8000;

const userHistory = new Map();

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

async function searchNeteaseMusic(keyword) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    console.log('🎵 搜索网易云音乐:', keyword);
    
    const url = `https://netease-cloud-music-api-git-main-rain120.vercel.app/search?keywords=${encodeURIComponent(keyword)}&limit=3`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const data = await response.json();
    
    if (data.code === 200 && data.result && data.result.songs) {
      return data.result.songs.map(song => {
        const artistName = song.ar && song.ar[0] ? song.ar[0].name : '未知歌手';
        const albumName = song.al ? song.al.name : '';
        const albumPic = song.al ? song.al.picUrl : '';
        return {
          id: song.id,
          title: song.name,
          artist: artistName,
          album: albumName,
          picUrl: albumPic,
          url: `https://music.163.com/#/song?id=${song.id}`
        };
      });
    }
    return null;
  } catch (e) {
    console.error('🎵 搜索网易云音乐错误:', e.message);
    return null;
  }
}

app.get('/wechat', (req, res) => {
  const token = CONFIG.wechat.token;
  const { signature, timestamp, nonce, echostr } = req.query;
  const arr = [token, timestamp, nonce].sort();
  const hash = crypto.createHash('sha1').update(arr.join('')).digest('hex');
  res.send(hash === signature ? echostr : 'Invalid');
});

app.post('/wechat', async (req, res) => {
  try {
    const content = getText(req.body.match(/<Content>([\s\S]*)<\/Content>/)?.[1] || '');
    const from = getText(req.body.match(/<FromUserName>([\s\S]*)<\/FromUserName>/)?.[1] || '');
    const to = getText(req.body.match(/<ToUserName>([\s\S]*)<\/ToUserName>/)?.[1] || '');
    const msgType = getText(req.body.match(/<MsgType>([\s\S]*)<\/MsgType>/)?.[1] || '');

    console.log('📨 收到消息:', content, '来自:', from);
    
    let replyType = 'text';
    let replyContent = '';

    if (msgType === 'event') {
      const event = getText(req.body.match(/<Event>([\s\S]*)<\/Event>/)?.[1] || '');
      if (event === 'subscribe') {
        replyContent = '🎉 欢迎关注！\n\n我可以帮你：\n🎵 点歌：发送「点歌 歌曲名」\n💬 聊天：任意话题\n\n试试发送：点歌 小幸运';
      } else {
        replyContent = '';
      }
    } else if (msgType === 'text') {
      const isMusicRequest = content.startsWith('点歌') || content.startsWith('播放') || 
                             content.startsWith('点一首') || content.startsWith('听一首');
      
      if (isMusicRequest) {
        let songName = content.replace(/^点歌/, '').replace(/^播放/, '')
                             .replace(/^点一首/, '').replace(/^听一首/, '').trim();
        
        if (songName) {
          console.log('🎵 点歌请求:', songName);
          const songs = await searchNeteaseMusic(songName);
          
          if (songs && songs.length > 0) {
            replyContent = '🎵 为你找到：\n';
            songs.forEach((song, index) => {
              replyContent += `${index + 1}. ${song.title} - ${song.artist}\n   ${song.url}`;
              if (index < songs.length - 1) {
                replyContent += '\n';
              }
            });
            replyContent += '\n\n💡 点击链接可以直接在网易云音乐播放';
          } else {
            replyContent = `抱歉，没有找到「${songName}」相关的歌曲，请试试其他歌名！`;
          }
        } else {
          replyContent = '想点什么歌？请发送：点歌 歌曲名\n\n例如：点歌 小幸运';
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
          replyContent = '我是小张，你的智能助手！\n\n可以帮你点歌、聊天、查询天气等。\n试试：点歌 七里香';
        } else {
          try {
            let history = userHistory.get(from) || [];
            
            const systemPrompt = '你是小张，一个友好的智能助手。请用简洁、自然的中文回复。不要使用Markdown格式，不要用星号，不要加粗。用户可以使用「点歌 歌曲名」来点歌。';
            
            if (history.length === 0) {
              history.push({ role: 'system', content: systemPrompt });
            }
            
            history.push({ role: 'user', content: content });
            
            if (history.length > 20) {
              history = history.slice(-20);
            }
            
            console.log('🤖 发送到AI:', history.length, '条消息');
            
            const aiResponse = await fetch(CONFIG.soloAutoModel.apiUrl, {
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
            
            const aiData = await aiResponse.json();
            replyContent = aiData.choices?.[0]?.message?.content || '收到消息！';
            replyContent = replyContent.replace(/\*\*/g, '').replace(/\*/g, '');
            
            history.push({ role: 'assistant', content: replyContent });
            userHistory.set(from, history);
            
          } catch (e) {
            console.error('🤖 AI调用错误:', e.message);
            replyContent = '抱歉，服务暂时不可用，请稍后再试。';
          }
        }
      }
    } else {
      replyContent = '暂不支持该类型消息';
    }

    console.log('📤 回复:', replyContent);

    let xml = `<xml>
      <ToUserName><![CDATA[${from}]]></ToUserName>
      <FromUserName><![CDATA[${to}]]></FromUserName>
      <CreateTime>${Date.now()}</CreateTime>
      <MsgType><![CDATA[text]]></MsgType>
      <Content><![CDATA[${replyContent}]]></Content>
    </xml>`;

    res.set('Content-Type', 'application/xml');
    res.send(xml);

  } catch (e) {
    console.error('❌ 处理消息错误:', e.message);
    res.status(500).send('Error');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(60));
  console.log('  🎵 小张网易云音乐版服务已启动！');
  console.log('='.repeat(60));
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log('🎵 点歌功能: 已启用（网易云音乐）');
  console.log('='.repeat(60) + '\n');
});
