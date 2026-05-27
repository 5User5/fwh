# 🎵 QQ音乐API部署说明

## 📋 概述

这是一套完整的QQ音乐API对接方案，包含：
- QQ音乐API服务端（Rain120开源项目）
- 微信公众号服务器（支持点歌功能）
- PM2进程管理配置

---

## 🚀 快速开始

### 1️⃣ 在服务器上部署QQ音乐API

```bash
# 进入项目目录
cd /home/admin/fwh

# 下载QQ音乐API项目
git clone https://github.com/Rain120/qq-music-api.git

# 进入项目目录
cd qq-music-api

# 安装依赖
npm install

# 创建配置文件
mkdir -p config
cat > config/user-info.js << 'EOF'
const userInfo = {
  loginUin: '你的QQ号',
  cookie: '你的QQ音乐Cookie',
};
module.exports = userInfo;
EOF
```

### 2️⃣ 获取QQ音乐Cookie

1. 打开浏览器，访问 https://y.qq.com
2. 登录你的QQ音乐账号（需要会员才能听VIP歌曲）
3. 按 `F12` 打开开发者工具
4. 切换到 `Network`（网络）标签
5. 刷新页面，任意点击一个请求
6. 在 `Request Headers` 中找到 `Cookie`
7. 复制完整的Cookie内容，粘贴到 `config/user-info.js` 中

### 3️⃣ 启动QQ音乐API

```bash
# 测试启动（先看看是否正常）
npm start

# 如果正常，使用PM2启动（推荐）
pm2 start npm --name "qq-music-api" -- start

# 查看日志
pm2 logs qq-music-api
```

服务会在 `http://localhost:3200` 启动

### 4️⃣ 部署微信公众号音乐版

```bash
# 回到主目录
cd /home/admin/fwh

# 上传 simple-server-with-music.js 到服务器

# 停止旧服务
pm2 delete wechat-assistant

# 启动新服务
pm2 start simple-server-with-music.js --name "wechat-assistant"

# 查看日志
pm2 logs wechat-assistant --lines 50
```

---

## 📱 功能测试

### 点歌功能

在微信公众号中发送：
- `点歌 小幸运`
- `播放 七里香`
- `点一首 晴天`

### 其他功能

- 正常对话
- 查询天气（如果已配置）
- 询问时间

---

## 🔧 配置文件说明

### config/user-info.js (QQ音乐)

```javascript
const userInfo = {
  loginUin: '123456789',        // 你的QQ号
  cookie: 'pgv_pvi=...; uin=...',  // 完整的QQ音乐Cookie
};
module.exports = userInfo;
```

### config.js (微信公众号)

确保你的微信配置正确：
- token
- appId
- appSecret
- AI API配置

---

## 📊 API说明

### QQ音乐API端点

| 功能 | 端点 | 说明 |
|------|------|------|
| 搜索 | /search?key=关键词 | 搜索歌曲 |
| 播放链接 | /song/url?id=songmid | 获取播放链接 |
| 歌词 | /lyric?id=songmid | 获取歌词 |
| 歌单详情 | /songlist?id=歌单ID | 获取歌单 |
| API Explorer | /explorer | 在线调试界面 |

访问 `http://你的服务器IP:3200/explorer` 可以查看完整API文档

---

## 🛠️ 常见问题

### Q: QQ音乐API启动失败？

A: 检查端口3200是否被占用，或者尝试更换端口：
```bash
# 查看端口占用
netstat -tlnp | grep 3200

# 如果需要，修改端口（在项目源码中）
```

### Q: 搜索不到歌曲？

A: 可能是Cookie过期了，重新获取Cookie并更新配置文件

### Q: 无法获取播放链接？

A: 确保你的QQ音乐账号是VIP会员，很多歌曲需要VIP才能播放

### Q: 如何更新QQ音乐API项目？

```bash
cd /home/admin/fwh/qq-music-api
git pull
pm2 restart qq-music-api
```

---

## 📁 文件说明

| 文件 | 说明 |
|------|------|
| `deploy-qq-music-api.sh` | 自动部署脚本 |
| `simple-server-with-music.js` | 微信公众号服务器（音乐版） |
| `simple-server.js` | 原微信公众号服务器（全功能版） |
| `qq-music-api/` | QQ音乐API项目目录 |

---

## 🎯 下一步

- ✅ 部署QQ音乐API服务
- ✅ 配置QQ音乐Cookie
- ✅ 启动微信公众号服务器
- 🎮 测试点歌功能
- 🔧 根据需要添加更多功能（天气、位置等）

---

## 📚 参考资料

- QQ音乐API项目: https://github.com/Rain120/qq-music-api
- 在线文档: https://rain120.github.io/qq-music-api/

---

祝您使用愉快！🎵
