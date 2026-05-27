# QQ音乐Cookie配置指南

## 🎵 获取Cookie步骤

### 1. 在浏览器中获取Cookie

1. 打开 https://y.qq.com 并登录你的QQ音乐账号
2. 按 F12 打开开发者工具
3. 点击 Console（控制台）标签
4. 输入：`document.cookie`
5. 复制显示的全部内容

### 2. 创建配置文件

在服务器上创建文件：`/home/admin/fwh/qq-music-api/config/user-info.js`

内容如下：

```javascript
const userInfo = {
  loginUin: '你的QQ号',
  cookie: '把你复制的Cookie粘贴在这里'
};

module.exports = userInfo;
```

### 3. 启动QQ音乐API服务

```bash
cd /home/admin/fwh/qq-music-api
npm install
pm2 start npm --name "qq-music-api" -- start
pm2 logs qq-music-api
```

### 4. 测试API

访问：http://你的服务器IP:3200/explorer

或直接测试搜索：
http://localhost:3200/search?key=小幸运

## 🎯 配置完成后

配置好QQ音乐API后，启动微信公众号服务：

```bash
cd /home/admin/fwh
pm2 delete wechat-assistant
pm2 start simple-server-with-music.js --name "wechat-assistant"
pm2 logs wechat-assistant
```

然后在微信公众号中发送：
- `点歌 小幸运`
- `播放 七里香`

## ⚠️ 注意事项

- Cookie会过期，需要定期更新
- 建议使用QQ音乐VIP账号，可播放更多歌曲
- 妥善保管Cookie，不要泄露
