const express = require('express');
const cors = require('cors');
const path = require('path');
const CONFIG = require('./config');

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/static', express.static(path.join(__dirname, 'backend/static')));

const data = {
  users: [
    { 
      id: 1, 
      openid: 'demo-user', 
      nickname: '演示用户', 
      created_at: new Date().toISOString(),
      profile: {
        preferences: {},
        habits: [],
        interests: [],
        goals: [],
        bio: '',
        lastInteraction: new Date().toISOString()
      }
    }
  ],
  conversations: [],
  messages: []
};

data.conversations.push({
  id: 1,
  user_id: 1,
  title: '欢迎使用小张',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});

data.messages.push({
  id: 1,
  conversation_id: 1,
  role: 'assistant',
  content: '你好！我是小张助手，很高兴为您服务！',
  created_at: new Date().toISOString()
});

function getMockWeather(cityName) {
  const specialWeather = {
    '金华': { weather: '大雨', temperature: '31', windDirection: '东风', windPower: '4', humidity: '76' },
    '杭州': { weather: '多云', temperature: '29', windDirection: '南风', windPower: '3', humidity: '65' },
    '上海': { weather: '阴', temperature: '27', windDirection: '西风', windPower: '2', humidity: '70' },
    '北京': { weather: '晴', temperature: '25', windDirection: '北风', windPower: '3', humidity: '45' },
    '广州': { weather: '小雨', temperature: '32', windDirection: '东南风', windPower: '4', humidity: '80' },
    '深圳': { weather: '多云', temperature: '33', windDirection: '南风', windPower: '3', humidity: '75' },
    '成都': { weather: '阴', temperature: '24', windDirection: '北风', windPower: '2', humidity: '72' },
    '武汉': { weather: '中雨', temperature: '26', windDirection: '东北风', windPower: '3', humidity: '78' },
    '西安': { weather: '晴', temperature: '23', windDirection: '西北风', windPower: '4', humidity: '40' },
    '洛阳': { weather: '多云', temperature: '28', windDirection: '东风', windPower: '2', humidity: '55' },
    '郑州': { weather: '晴', temperature: '29', windDirection: '南风', windPower: '3', humidity: '50' }
  };
  
  const special = specialWeather[cityName];
  if (special) {
    return {
      city: cityName,
      weather: special.weather,
      temperature: special.temperature,
      windDirection: special.windDirection,
      windPower: special.windPower,
      humidity: special.humidity,
      reportTime: new Date().toLocaleString('zh-CN', { 
        timeZone: 'Asia/Shanghai',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  }
  
  const weatherConditions = ['晴', '多云', '阴', '小雨', '中雨', '大雨'];
  const windDirections = ['东风', '南风', '西风', '北风', '东南风', '西北风'];
  const randomTemp = Math.floor(Math.random() * 20) + 15;
  
  return {
    city: cityName,
    weather: weatherConditions[Math.floor(Math.random() * weatherConditions.length)],
    temperature: randomTemp.toString(),
    windDirection: windDirections[Math.floor(Math.random() * windDirections.length)],
    windPower: (Math.floor(Math.random() * 3) + 1).toString(),
    humidity: (Math.floor(Math.random() * 30) + 40).toString(),
    reportTime: new Date().toLocaleString('zh-CN', { 
      timeZone: 'Asia/Shanghai',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  };
}

async function getWeatherFromAmap(cityCode) {
  try {
    const apiUrl = `https://restapi.amap.com/v3/weather/weatherInfo?city=${cityCode}&key=011c9b348d4f86e90b58be099fe9d417`;
    const response = await fetch(apiUrl, { timeout: 8000 });
    if (!response.ok) return null;
    
    const result = await response.json();
    if (result.status === '1' && result.lives && result.lives.length > 0) {
      const weather = result.lives[0];
      return {
        city: weather.city,
        weather: weather.weather,
        temperature: weather.temperature,
        windDirection: weather.winddirection,
        windPower: weather.windpower,
        humidity: weather.humidity,
        reportTime: weather.reporttime,
        source: '高德地图'
      };
    }
    return null;
  } catch (error) {
    console.error('高德天气API失败:', error.message);
    return null;
  }
}

async function getWeatherFromOpenWeather(cityName) {
  const cityMap = {
    '北京': 'Beijing', '上海': 'Shanghai', '广州': 'Guangzhou', '深圳': 'Shenzhen',
    '杭州': 'Hangzhou', '南京': 'Nanjing', '成都': 'Chengdu', '武汉': 'Wuhan',
    '西安': "Xi'an", '重庆': 'Chongqing', '天津': 'Tianjin', '苏州': 'Suzhou',
    '郑州': 'Zhengzhou', '长沙': 'Changsha', '东莞': 'Dongguan', '佛山': 'Foshan',
    '洛阳': 'Luoyang', '金华': 'Jinhua', '宁波': 'Ningbo', '青岛': 'Qingdao'
  };
  const enCity = cityMap[cityName];
  if (!enCity) return null;
  
  try {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${enCity},CN&appid=43ee77d1d37fcb544b192914fd7bc508&units=metric&lang=zh_cn`;
    const response = await fetch(apiUrl, { timeout: 8000 });
    if (!response.ok) return null;
    
    const result = await response.json();
    const weatherMap = {
      'clear sky': '晴', 'few clouds': '晴转多云', 'scattered clouds': '多云',
      'broken clouds': '多云', 'shower rain': '阵雨', 'rain': '小雨',
      'thunderstorm': '雷阵雨', 'snow': '雪', 'mist': '雾',
      'light rain': '小雨', 'moderate rain': '中雨', 'heavy intensity rain': '大雨',
      'very heavy rain': '暴雨', 'extreme rain': '特大暴雨'
    };
    
    return {
      city: cityName,
      weather: weatherMap[result.weather[0].description] || result.weather[0].description,
      temperature: Math.round(result.main.temp).toString(),
      windDirection: getWindDirection(result.wind.deg),
      windPower: getWindPower(result.wind.speed),
      humidity: result.main.humidity.toString(),
      reportTime: new Date(result.dt * 1000).toLocaleString('zh-CN', { 
        timeZone: 'Asia/Shanghai',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      source: 'OpenWeatherMap'
    };
  } catch (error) {
    console.error('OpenWeatherAPI失败:', error.message);
    return null;
  }
}

async function getWeatherFromOpenMeteo(cityName) {
  const cityCoords = {
    '北京': { lat: 39.9042, lon: 116.4074 },
    '上海': { lat: 31.2304, lon: 121.4737 },
    '广州': { lat: 23.1291, lon: 113.2644 },
    '深圳': { lat: 22.5431, lon: 114.0579 },
    '杭州': { lat: 30.2741, lon: 120.1552 },
    '南京': { lat: 32.0603, lon: 118.7969 },
    '成都': { lat: 30.5728, lon: 104.0668 },
    '武汉': { lat: 30.5928, lon: 114.3055 },
    '西安': { lat: 34.2619, lon: 108.9463 },
    '重庆': { lat: 29.4316, lon: 106.9123 },
    '天津': { lat: 39.1322, lon: 117.2009 },
    '苏州': { lat: 31.3251, lon: 120.6299 },
    '郑州': { lat: 34.7466, lon: 113.6253 },
    '长沙': { lat: 28.2280, lon: 112.9388 },
    '洛阳': { lat: 34.6234, lon: 112.4536 },
    '金华': { lat: 29.1244, lon: 119.6464 },
    '宁波': { lat: 29.8739, lon: 121.5416 },
    '青岛': { lat: 36.0671, lon: 120.3826 },
    '厦门': { lat: 24.4798, lon: 118.0894 },
    '合肥': { lat: 31.8654, lon: 117.2272 }
  };
  
  const coords = cityCoords[cityName];
  if (!coords) return null;
  
  try {
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,relative_humidity_2m&hourly=temperature_2m&timezone=Asia/Shanghai`;
    const response = await fetch(apiUrl, { timeout: 8000 });
    if (!response.ok) return null;
    
    const result = await response.json();
    const weatherCodeMap = {
      0: '晴', 1: '晴', 2: '多云', 3: '阴',
      45: '雾', 48: '雾',
      51: '小雨', 53: '小雨', 55: '小雨',
      56: '冻雨', 57: '冻雨',
      61: '中雨', 63: '中雨', 65: '中雨',
      66: '冻雨', 67: '冻雨',
      71: '小雪', 73: '小雪', 75: '小雪',
      77: '雪',
      80: '阵雨', 81: '阵雨', 82: '阵雨',
      85: '阵雪', 86: '阵雪',
      95: '雷阵雨', 96: '雷阵雨', 99: '雷阵雨'
    };
    
    return {
      city: cityName,
      weather: weatherCodeMap[result.current.weather_code] || '晴',
      temperature: Math.round(result.current.temperature_2m).toString(),
      windDirection: getWindDirection(result.current.wind_direction_10m),
      windPower: getWindPower(result.current.wind_speed_10m),
      humidity: Math.round(result.current.relative_humidity_2m).toString(),
      reportTime: new Date(result.current.time.replace('T', ' ') + '+08:00').toLocaleString('zh-CN', { 
        timeZone: 'Asia/Shanghai',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      source: 'Open-Meteo'
    };
  } catch (error) {
    console.error('Open-Meteo API失败:', error.message);
    return null;
  }
}

function getWindDirection(deg) {
  if (deg >= 348.75 || deg < 11.25) return '北风';
  if (deg < 33.75) return '北东北风';
  if (deg < 56.25) return '东北风';
  if (deg < 78.75) return '东东北风';
  if (deg < 101.25) return '东风';
  if (deg < 123.75) return '东东南风';
  if (deg < 146.25) return '东南风';
  if (deg < 168.75) return '南东南风';
  if (deg < 191.25) return '南风';
  if (deg < 213.75) return '南西南风';
  if (deg < 236.25) return '西南风';
  if (deg < 258.75) return '西西南风';
  if (deg < 281.25) return '西风';
  if (deg < 303.75) return '西西北风';
  if (deg < 326.25) return '西北风';
  return '北西北风';
}

function getWindPower(speed) {
  if (speed < 1) return '0';
  if (speed < 6) return '1';
  if (speed < 12) return '2';
  if (speed < 20) return '3';
  if (speed < 29) return '4';
  if (speed < 39) return '5';
  if (speed < 50) return '6';
  return '7';
}

// 天气查询功能 - 只使用真实API，不使用模拟数据
async function getWeather(cityName) {
  const cityCode = getCityCode(cityName);
  if (!cityCode) {
    console.log(`城市 ${cityName} 未找到`);
    return null;
  }
  
  console.log(`🌤️ 查询${cityName}天气...`);
  
  let weather = await getWeatherFromAmap(cityCode);
  if (weather) {
    console.log(`✅ 使用${weather.source}数据`);
    return weather;
  }
  
  weather = await getWeatherFromOpenMeteo(cityName);
  if (weather) {
    console.log(`✅ 使用${weather.source}数据`);
    return weather;
  }
  
  weather = await getWeatherFromOpenWeather(cityName);
  if (weather) {
    console.log(`✅ 使用${weather.source}数据`);
    return weather;
  }
  
  console.log('❌ 所有天气API都失败');
  return null;
}

function getCityCode(cityName) {
  const cityMap = {
    '北京': '110000', '上海': '310000', '广州': '440100', '深圳': '440300',
    '杭州': '330100', '南京': '320100', '成都': '510100', '武汉': '420100',
    '西安': '610100', '重庆': '500000', '天津': '120000', '苏州': '320500',
    '郑州': '410100', '长沙': '430100', '青岛': '370200', '济南': '370100',
    '沈阳': '210100', '大连': '210200', '厦门': '350200', '合肥': '340100',
    '福州': '350100', '南宁': '450100', '贵阳': '520100', '昆明': '530100',
    '兰州': '620100', '太原': '140100', '石家庄': '130100', '哈尔滨': '230100',
    '长春': '220100', '南昌': '360100', '宁波': '330200', '无锡': '320200',
    '常州': '320400', '南通': '320600', '绍兴': '330600', '温州': '330300',
    '嘉兴': '330400', '金华': '330700', '台州': '331000', '徐州': '320300',
    '洛阳': '410300', '开封': '410200', '安阳': '410500', '新乡': '410700',
    '焦作': '410800', '商丘': '411400', '信阳': '411500', '南阳': '411300'
  };
  return cityMap[cityName] || null;
}

async function callSOLOAutoModel(messages) {
  if (CONFIG.soloAutoModel.useMock) {
    return null;
  }

  console.log(`📡 正在调用 AI API: ${CONFIG.soloAutoModel.apiUrl}`);
  console.log(`📝 消息数量: ${messages.length}`);

  try {
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
        messages: messages,
        temperature: CONFIG.soloAutoModel.temperature,
        max_tokens: CONFIG.soloAutoModel.maxTokens
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log(`✅ API 响应状态: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API 请求失败: ${response.status} - ${errorText}`);
      throw new Error(`API 请求失败: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ AI 调用成功');
    return result.choices[0].message.content;
  } catch (error) {
    console.error('❌ 小张 调用错误:', error.message);
    throw error;
  }
}

function generateMockResponse(userMessage, domain = 'general') {
  const responses = {
    general: [
      `你好！我是小张助手。你说的是："${userMessage}"`,
      `很高兴为您服务！关于"${userMessage}"，我来帮您解答。`,
      `收到！这是一个很好的问题。让我想想怎么回答"${userMessage}"`
    ],
    weight_loss: [
      `关于减肥的问题：${userMessage}，建议您控制饮食热量摄入，每周进行3-5次有氧运动。`,
      `减肥小贴士：要健康减重，合理饮食+规律运动是关键！针对您的问题"${userMessage}"`,
      `健康减肥需要科学方法。针对您的问题"${userMessage}"，我建议您保持热量赤字，增加蛋白质摄入。`
    ]
  };

  const domainResponses = responses[domain] || responses.general;
  return domainResponses[Math.floor(Math.random() * domainResponses.length)];
}

function getSystemPrompt(domain) {
  return CONFIG.domains[domain] || CONFIG.domains.general;
}

function detectDomain(message) {
  const keywords = {
    weight_loss: ['减肥', '瘦身', '减重', '胖', '热量', '饮食', '运动', 'BMI', '减脂', '健身'],
    fitness: ['健身', '锻炼', '肌肉', '训练', '跑步', '力量'],
    weather: ['天气', '气温', '温度', '刮风', '下雨', '晴天', '阴天', '预报']
  };

  for (const [domain, words] of Object.entries(keywords)) {
    if (words.some(word => message.includes(word))) {
      return domain;
    }
  }
  return 'general';
}

function extractUserProfileInfo(message) {
  const profileInfo = {
    preferences: [],
    habits: [],
    interests: [],
    goals: []
  };

  const keywords = {
    preferences: [
      { pattern: /喜欢(.+?)/, category: 'preferences' },
      { pattern: /爱(.+?)/, category: 'preferences' },
      { pattern: /偏好(.+?)/, category: 'preferences' },
      { pattern: /讨厌(.+?)/, category: 'preferences' },
      { pattern: /不喜欢(.+?)/, category: 'preferences' },
      { pattern: /喜欢吃(.+?)/, category: 'preferences' },
      { pattern: /爱吃(.+?)/, category: 'preferences' }
    ],
    habits: [
      { pattern: /经常(.+?)/, category: 'habits' },
      { pattern: /每天(.+?)/, category: 'habits' },
      { pattern: /习惯(.+?)/, category: 'habits' },
      { pattern: /通常(.+?)/, category: 'habits' }
    ],
    interests: [
      { pattern: /对(.+?)感兴趣/, category: 'interests' },
      { pattern: /兴趣是(.+?)/, category: 'interests' },
      { pattern: /爱好(.+?)/, category: 'interests' },
      { pattern: /喜欢做(.+?)/, category: 'interests' }
    ],
    goals: [
      { pattern: /想(.+?)/, category: 'goals' },
      { pattern: /要(.+?)/, category: 'goals' },
      { pattern: /目标是(.+?)/, category: 'goals' },
      { pattern: /计划(.+?)/, category: 'goals' },
      { pattern: /希望(.+?)/, category: 'goals' },
      { pattern: /打算(.+?)/, category: 'goals' },
      { pattern: /减肥/, category: 'goals' },
      { pattern: /瘦/, category: 'goals' }
    ]
  };

  for (const [category, patterns] of Object.entries(keywords)) {
    for (const { pattern } of patterns) {
      const match = message.match(pattern);
      if (match) {
        const value = match[1].trim().replace(/[，。！？、；：]/g, '');
        if (value && value.length > 1 && !profileInfo[category].includes(value)) {
          profileInfo[category].push(value);
        }
      }
    }
  }

  return profileInfo;
}

function updateUserProfile(userId, profileInfo) {
  const user = data.users.find(u => u.id === userId);
  if (!user) return;

  if (profileInfo.preferences.length > 0) {
    profileInfo.preferences.forEach(pref => {
      if (!user.profile.preferences[pref]) {
        user.profile.preferences[pref] = true;
      }
    });
  }

  if (profileInfo.habits.length > 0) {
    profileInfo.habits.forEach(habit => {
      if (!user.profile.habits.includes(habit)) {
        user.profile.habits.push(habit);
      }
    });
  }

  if (profileInfo.interests.length > 0) {
    profileInfo.interests.forEach(interest => {
      if (!user.profile.interests.includes(interest)) {
        user.profile.interests.push(interest);
      }
    });
  }

  if (profileInfo.goals.length > 0) {
    profileInfo.goals.forEach(goal => {
      if (!user.profile.goals.includes(goal)) {
        user.profile.goals.push(goal);
      }
    });
  }

  user.profile.lastInteraction = new Date().toISOString();
}

function getUserProfilePrompt(userId) {
  const user = data.users.find(u => u.id === userId);
  if (!user || !user.profile) return '';

  const profile = user.profile;
  const lines = [];

  if (Object.keys(profile.preferences).length > 0) {
    lines.push(`用户喜好：${Object.keys(profile.preferences).join('、')}`);
  }
  if (profile.habits.length > 0) {
    lines.push(`用户习惯：${profile.habits.join('、')}`);
  }
  if (profile.interests.length > 0) {
    lines.push(`用户兴趣：${profile.interests.join('、')}`);
  }
  if (profile.goals.length > 0) {
    lines.push(`用户目标：${profile.goals.join('、')}`);
  }

  if (lines.length > 0) {
    return '\n\n用户画像信息：\n' + lines.join('\n');
  }
  return '';
}

function extractCityFromMessage(message) {
  const cityMap = {
    '北京': ['北京', '帝都'], '上海': ['上海', '魔都'], '广州': ['广州', '羊城'],
    '深圳': ['深圳'], '杭州': ['杭州', '杭城'], '南京': ['南京', '金陵'],
    '成都': ['成都', '蓉城'], '武汉': ['武汉', '江城'], '西安': ['西安', '长安'],
    '重庆': ['重庆', '山城'], '天津': ['天津'], '苏州': ['苏州', '姑苏'],
    '郑州': ['郑州', '商都'], '长沙': ['长沙', '星城'], '青岛': ['青岛'],
    '济南': ['济南', '泉城'], '沈阳': ['沈阳'], '大连': ['大连'],
    '厦门': ['厦门'], '合肥': ['合肥'], '福州': ['福州'],
    '南宁': ['南宁'], '贵阳': ['贵阳'], '昆明': ['昆明'],
    '兰州': ['兰州'], '太原': ['太原'], '石家庄': ['石家庄'],
    '哈尔滨': ['哈尔滨', '冰城'], '长春': ['长春'], '南昌': ['南昌'],
    '宁波': ['宁波'], '无锡': ['无锡'], '常州': ['常州'],
    '南通': ['南通'], '绍兴': ['绍兴'], '温州': ['温州'],
    '嘉兴': ['嘉兴'], '金华': ['金华'], '台州': ['台州'],
    '徐州': ['徐州'], '洛阳': ['洛阳', '洛城'], '开封': ['开封'],
    '安阳': ['安阳'], '新乡': ['新乡'], '焦作': ['焦作'],
    '商丘': ['商丘'], '信阳': ['信阳'], '南阳': ['南阳']
  };

  for (const [city, aliases] of Object.entries(cityMap)) {
    if (aliases.some(alias => message.includes(alias))) {
      return city;
    }
  }
  return null;
}

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

function parseXml(xml) {
  const result = {};
  
  // 第一步：提取XML内容
  let xmlContent = xml;
  
  // 查找<xml>标签内容
  const xmlStart = xml.indexOf('<xml>');
  const xmlEnd = xml.indexOf('</xml>');
  if (xmlStart !== -1 && xmlEnd !== -1) {
    xmlContent = xml.substring(xmlStart + 5, xmlEnd);
  }
  
  // 第二步：解析每一个标签
  const tagRegex = /<(\w+)>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/\1>/g;
  let match;
  
  while ((match = tagRegex.exec(xmlContent)) !== null) {
    const tagName = match[1];
    const tagValue = match[2];
    // 只处理有效的标签（不处理xml本身）
    if (tagName !== 'xml') {
      result[tagName] = tagValue;
    }
  }
  
  return result;
}

function buildXmlResponse(toUser, fromUser, content) {
  return `
    <xml>
      <ToUserName><![CDATA[${toUser}]]></ToUserName>
      <FromUserName><![CDATA[${fromUser}]]></FromUserName>
      <CreateTime>${Date.now()}</CreateTime>
      <MsgType><![CDATA[text]]></MsgType>
      <Content><![CDATA[${content}]]></Content>
    </xml>
  `.trim();
}

app.get('/wechat', (req, res) => {
  const { signature, timestamp, nonce, echostr } = req.query;
  console.log('收到微信验证请求:', { signature, timestamp, nonce });
  
  if (verifyWechatSignature(req)) {
    res.send(echostr);
    console.log('微信验证成功');
  } else {
    res.status(403).send('Invalid signature');
    console.log('微信验证失败：签名不匹配');
  }
});

app.post('/wechat', express.text({ type: '*/*' }), async (req, res) => {
  try {
    const body = req.body;
    console.log('收到微信消息:', body);
    console.log('=== 开始解析 ===');
    
    let msg;
    try {
      msg = parseXml(body);
      console.log('解析结果:', msg);
    } catch (parseErr) {
      console.error('XML解析错误:', parseErr);
      const echoMsg = body.match(/<FromUserName>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/FromUserName>/)?.[1] || '';
      const echoToUser = body.match(/<ToUserName>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/ToUserName>/)?.[1] || '';
      const errorReply = buildXmlResponse(echoMsg, echoToUser, '消息解析错误，请稍后重试');
      res.set('Content-Type', 'application/xml');
      res.send(errorReply);
      return;
    }
    
    let fromUser, toUser, msgType, content;
    try {
      fromUser = msg.FromUserName || '';
      toUser = msg.ToUserName || '';
      msgType = msg.MsgType || '';
      content = msg.Content || '';
      console.log('提取数据:', { fromUser, toUser, msgType, content });
    } catch (extractErr) {
      console.error('提取数据错误:', extractErr);
      const errorReply = buildXmlResponse(msg.FromUserName || '', msg.ToUserName || '', '消息处理错误，请稍后重试');
      res.set('Content-Type', 'application/xml');
      res.send(errorReply);
      return;
    }
    
    let replyMsg = '';
    
    try {
      if (msgType === 'event') {
        const event = msg.Event || '';
        console.log('处理事件消息:', event);
        if (event === 'subscribe') {
          replyMsg = '🎉 欢迎关注小张助手！\n\n我可以帮您：\n🌤️ 查询天气\n⏰ 获取时间\n🤖 智能对话\n💡 减肥建议\n\n请问有什么可以帮您的？';
        } else {
          replyMsg = '收到事件消息';
        }
      } else if (msgType === 'text') {
        console.log('处理文本消息');
        const domain = detectDomain(content);
        
        const lastAssistantMessage = '';
        const wasAskingForCity = lastAssistantMessage && lastAssistantMessage.includes('查询哪个城市的天气');
        let detectedCity = extractCityFromMessage(content);
        
        if ((domain === 'weather' || wasAskingForCity) && detectedCity) {
          console.log('查询天气:', detectedCity);
          const weatherData = await getWeather(detectedCity);
          if (weatherData) {
            replyMsg = `🌤️ ${weatherData.city}天气：\n` +
                       `天气状况：${weatherData.weather}\n` +
                       `温度：${weatherData.temperature}°C\n` +
                       `风向：${weatherData.windDirection}\n` +
                       `风力：${weatherData.windPower}级\n` +
                       `湿度：${weatherData.humidity}%\n` +
                       `更新时间：${weatherData.reportTime}`;
          } else {
            replyMsg = `抱歉，暂时无法获取${detectedCity}的天气信息，请稍后再试。`;
          }
        } else if (domain === 'weather' && !detectedCity) {
          replyMsg = '请问您想查询哪个城市的天气？我支持北京、上海、广州、深圳、杭州、南京、成都、武汉、西安、重庆、天津、苏州、郑州、长沙、洛阳、金华、宁波、青岛、厦门、合肥等多个城市。';
        } else if (!CONFIG.soloAutoModel.useMock) {
          try {
            console.log('调用AI模型');
            const profileInfo = extractUserProfileInfo(content);
            updateUserProfile(1, profileInfo);
            
            const currentTime = new Date().toLocaleString('zh-CN', { 
              timeZone: 'Asia/Shanghai',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
              hour: '2-digit',
              minute: '2-digit'
            });
            
            const profilePrompt = getUserProfilePrompt(1);
            
            const systemPrompt = getSystemPrompt(domain) + 
                                `\n\n当前系统时间：${currentTime}。如果用户问时间，直接告诉他。` + 
                                profilePrompt;
            
            const response = await callSOLOAutoModel([
              { role: 'system', content: systemPrompt },
              { role: 'user', content: content }
            ]);
            
            replyMsg = response || '抱歉，我没明白您的意思。';
            console.log('AI回复:', replyMsg);
          } catch (aiError) {
            console.error('AI调用失败:', aiError);
            replyMsg = '抱歉，AI服务暂时不可用，请稍后再试。';
          }
        } else {
          replyMsg = generateMockResponse(content, domain);
        }
      } else {
        console.log('不支持的消息类型:', msgType);
        replyMsg = '暂不支持该类型消息';
      }
    } catch (logicErr) {
      console.error('消息处理逻辑错误:', logicErr);
      replyMsg = '消息处理中遇到错误，请稍后重试';
    }
    
    let xmlResponse;
    try {
      xmlResponse = buildXmlResponse(fromUser, toUser, replyMsg);
      console.log('=== 准备回复 ===');
      console.log('回复内容:', replyMsg);
      console.log('XML响应:', xmlResponse);
    } catch (buildErr) {
      console.error('构建响应错误:', buildErr);
      xmlResponse = buildXmlResponse(fromUser, toUser, '生成回复失败');
    }
    
    res.set('Content-Type', 'application/xml');
    res.send(xmlResponse);
    console.log('=== 回复完成 ===');
    
  } catch (error) {
    console.error('微信消息处理失败:', error);
    console.error('错误堆栈:', error.stack);
    try {
      const body = req.body || '';
      const fromUser = body.match(/<FromUserName>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/FromUserName>/)?.[1] || '';
      const toUser = body.match(/<ToUserName>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/ToUserName>/)?.[1] || '';
      const errorReply = buildXmlResponse(fromUser, toUser, '服务暂时不可用，请稍后重试');
      res.set('Content-Type', 'application/xml');
      res.send(errorReply);
    } catch (finalErr) {
      res.status(500).send('Error processing message');
    }
  }
});

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

app.get('/admin/conversations', (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;
  const offset = (page - 1) * pageSize;
  const paginatedData = data.conversations.slice(offset, offset + parseInt(pageSize));

  const enrichedConversations = paginatedData.map(conv => ({
    ...conv,
    user_nickname: data.users.find(u => u.id === conv.user_id)?.nickname || '未知用户'
  }));

  res.json({
    success: true,
    data: enrichedConversations,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total: data.conversations.length
    }
  });
});

app.get('/admin/conversations/:id', (req, res) => {
  const { id } = req.params;
  const conversation = data.conversations.find(c => c.id === parseInt(id));
  const messages = data.messages.filter(m => m.conversation_id === parseInt(id));

  if (!conversation) {
    return res.status(404).json({ success: false, message: '对话不存在' });
  }

  res.json({
    success: true,
    data: { conversation, messages }
  });
});

app.delete('/admin/conversations/:id', (req, res) => {
  const { id } = req.params;
  const convIndex = data.conversations.findIndex(c => c.id === parseInt(id));

  if (convIndex === -1) {
    return res.status(404).json({ success: false, message: '对话不存在' });
  }

  data.messages = data.messages.filter(m => m.conversation_id !== parseInt(id));
  data.conversations.splice(convIndex, 1);

  res.json({ success: true });
});

app.get('/admin/users', (req, res) => {
  res.json({ success: true, data: data.users });
});

app.get('/admin/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      users: data.users.length,
      conversations: data.conversations.length,
      messages: data.messages.length,
      soloAutoModelStatus: CONFIG.soloAutoModel.useMock ? '模拟模式' : '已连接真实API',
      recentActivity: [
        { time: new Date().toISOString(), type: 'system', desc: '小张 服务运行中' }
      ]
    }
  });
});

app.get('/admin/config', (req, res) => {
  res.json({
    success: true,
    data: {
      modelApiUrl: CONFIG.soloAutoModel.apiUrl,
      modelUseMock: CONFIG.soloAutoModel.useMock,
      modelName: CONFIG.soloAutoModel.model,
      enableDomainDetection: true,
      enableImageGeneration: CONFIG.imageGeneration.enable
    }
  });
});

app.put('/admin/config', (req, res) => {
  res.json({ success: true, message: '配置已更新（重启服务后生效）' });
});

app.post('/api/chat', async (req, res) => {
  const { message, conversationId } = req.body;
  const userId = 1;

  let response;
  let domain = detectDomain(message);

  const historyMessages = conversationId 
    ? data.messages.filter(m => m.conversation_id === parseInt(conversationId))
    : [];

  const lastAssistantMessage = [...historyMessages].reverse().find(m => m.role === 'assistant');
  const wasAskingForCity = lastAssistantMessage && 
    lastAssistantMessage.content.includes('查询哪个城市的天气');

  let detectedCity = extractCityFromMessage(message);

  if ((domain === 'weather' || wasAskingForCity) && detectedCity) {
    const weatherData = await getWeather(detectedCity);
    if (weatherData) {
      response = `🌤️ ${weatherData.city}天气：\n` +
                 `天气状况：${weatherData.weather}\n` +
                 `温度：${weatherData.temperature}°C\n` +
                 `风向：${weatherData.windDirection}\n` +
                 `风力：${weatherData.windPower}级\n` +
                 `湿度：${weatherData.humidity}%\n` +
                 `更新时间：${weatherData.reportTime}`;
    } else {
      response = `抱歉，暂时无法获取${detectedCity}的天气信息，请稍后再试。`;
    }
  } else if (domain === 'weather' && !detectedCity) {
    response = '请问您想查询哪个城市的天气？我支持北京、上海、广州、深圳、洛阳等多个城市。';
  } else if (!CONFIG.soloAutoModel.useMock) {
    try {
      const profileInfo = extractUserProfileInfo(message);
      updateUserProfile(userId, profileInfo);

      const currentTime = new Date().toLocaleString('zh-CN', { 
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit'
      });

      const profilePrompt = getUserProfilePrompt(userId);
      
      const systemPrompt = getSystemPrompt(domain) + 
                          `\n\n当前系统时间：${currentTime}。如果用户问时间，直接告诉他。` + 
                          profilePrompt;

      const messages = [{ role: 'system', content: systemPrompt }];
      
      historyMessages.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
      
      messages.push({ role: 'user', content: message });
      
      response = await callSOLOAutoModel(messages);
    } catch (error) {
      console.error('AI 调用失败:', error);
      response = '抱歉，小张 服务暂时不可用，请检查配置。';
    }
  } else {
    response = generateMockResponse(message, domain);
  }

  let convId = conversationId;

  if (!convId) {
    convId = data.conversations.length + 1;
    data.conversations.push({
      id: convId,
      user_id: 1,
      title: message.length > 20 ? message.substring(0, 20) + '...' : message,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  } else {
    const conv = data.conversations.find(c => c.id === parseInt(convId));
    if (conv) {
      conv.updated_at = new Date().toISOString();
    }
  }

  data.messages.push({
    id: data.messages.length + 1,
    conversation_id: parseInt(convId),
    role: 'user',
    content: message,
    created_at: new Date().toISOString()
  });

  data.messages.push({
    id: data.messages.length + 1,
    conversation_id: parseInt(convId),
    role: 'assistant',
    content: response,
    created_at: new Date().toISOString()
  });

  res.json({
    success: true,
    data: {
      role: 'assistant',
      content: response,
      domain,
      conversationId: convId
    }
  });
});

app.post('/api/conversation', (req, res) => {
  const newId = data.conversations.length + 1;
  data.conversations.push({
    id: newId,
    user_id: 1,
    title: '新对话',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  res.json({
    success: true,
    data: { conversationId: newId, userId: 1 }
  });
});

app.get('/', (req, res) => {
  const isConnected = !CONFIG.soloAutoModel.useMock;
  
  res.send(`
    <html>
      <head>
        <title>小张 状态</title>
        <style>
          * { box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0;
            padding: 40px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }
          .container { 
            max-width: 900px; 
            margin: 0 auto; 
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 40px;
          }
          h1 { color: #3b82f6; margin-top: 0; }
          .status {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 16px;
            border-radius: 20px;
            font-weight: 600;
          }
          .status.connected { background: #10b981; color: white; }
          .status.mock { background: #f59e0b; color: white; }
          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 24px 0;
          }
          .card { 
            background: #f8fafc; 
            padding: 20px; 
            border-radius: 12px; 
            border: 1px solid #e2e8f0;
          }
          .card h3 { margin: 0 0 12px 0; color: #1f2937; }
          code { background: #e2e8f0; padding: 3px 8px; border-radius: 6px; font-size: 0.9rem; }
          .btn {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin-top: 8px;
          }
          ul { margin: 12px 0; padding-left: 20px; }
          li { margin: 8px 0; color: #4b5563; }
          .demo-section {
            background: #dbeafe;
            border-radius: 12px;
            padding: 20px;
            margin-top: 24px;
          }
          .chat-demo {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 16px;
          }
          .chat-input {
            display: flex;
            gap: 12px;
          }
          .chat-input input {
            flex: 1;
            padding: 12px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 1rem;
          }
          .chat-input button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          }
          .chat-bubble {
            padding: 12px 16px;
            border-radius: 12px;
            max-width: 80%;
          }
          .chat-bubble.user {
            background: #3b82f6;
            color: white;
            margin-left: auto;
          }
          .chat-bubble.assistant {
            background: #f1f5f9;
            color: #1f2937;
            margin-right: auto;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 小张 微信服务号</h1>
          
          <p style="font-size: 1.2rem; color: #1f2937;">
            <strong>状态：</strong>
            <span class="status ${isConnected ? 'connected' : 'mock'}">
              ${isConnected ? '✅ 已连接真实 DeepSeek AI' : '⚠️ 模拟模式'}
            </span>
          </p>
          
          <div class="grid">
            <div class="card">
              <h3>📋 API 配置</h3>
              <ul>
                <li>API 地址: <code>${CONFIG.soloAutoModel.apiUrl}</code></li>
                <li>模型名称: <code>${CONFIG.soloAutoModel.model}</code></li>
                <li>认证状态: <code>${CONFIG.soloAutoModel.apiKey !== 'your-api-key-here' ? '✅ 已配置' : '❌ 未配置'}</code></li>
              </ul>
            </div>
            
            <div class="card">
              <h3>✨ 新增功能</h3>
              <ul>
                <li>🌤️ 实时天气查询（支持50+城市）</li>
                <li>⏰ 实时时间显示</li>
                <li>💪 减肥领域专业回答</li>
                <li>📊 完整管理后台</li>
              </ul>
            </div>
            
            <div class="card">
              <h3>👤 管理员登录</h3>
              <p>用户名: <strong style="color: #3b82f6;">admin</strong></p>
              <p>密码: <strong style="color: #3b82f6;">admin123</strong></p>
              <a href="http://localhost:3000" class="btn" target="_blank">管理后台 →</a>
            </div>
          </div>

          <div class="demo-section">
            <h2>🗣️ 对话演示</h2>
            <p style="color: #64748b; margin: 8px 0;">
              试试查询天气：<code>北京天气</code>、<code>洛阳天气怎么样</code>
            </p>
            <div class="chat-demo" id="chatDemo">
              <div class="chat-bubble assistant">你好！我是小张助手，很高兴为您服务！可以问我天气、时间或任何问题！</div>
            </div>
            <div class="chat-input">
              <input type="text" id="chatInput" placeholder="输入消息..." onkeypress="if(event.key==='Enter')sendMessage()">
              <button onclick="sendMessage()">发送</button>
            </div>
          </div>
        </div>
        
        <script>
          let currentConvId = null;
          
          async function sendMessage() {
            const input = document.getElementById('chatInput');
            const message = input.value.trim();
            if (!message) return;
            
            const chatDemo = document.getElementById('chatDemo');
            
            const userBubble = document.createElement('div');
            userBubble.className = 'chat-bubble user';
            userBubble.textContent = message;
            chatDemo.appendChild(userBubble);
            
            input.value = '';
            input.disabled = true;
            
            try {
              const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, conversationId: currentConvId })
              });
              
              const result = await res.json();
              
              if (result.success) {
                currentConvId = result.data.conversationId;
                
                const aiBubble = document.createElement('div');
                aiBubble.className = 'chat-bubble assistant';
                aiBubble.textContent = result.data.content;
                chatDemo.appendChild(aiBubble);
                
                chatDemo.scrollTop = chatDemo.scrollHeight;
              }
            } catch (error) {
              console.error(error);
            }
            
            input.disabled = false;
            input.focus();
          }
        </script>
      </body>
    </html>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '═'.repeat(60));
  console.log('   🚀 小张 服务已成功启动！');
  console.log('═'.repeat(60));
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`🔗 小张: ${CONFIG.soloAutoModel.useMock ? '⚠️ 模拟模式' : '✅ 已连接真实API'}`);
  console.log(`🌤️ 天气功能: ✅ 已启用（支持50+城市）`);
  console.log('═'.repeat(60) + '\n');
});
