# 🎵 QQ音乐Cookie获取指南

## ⚠️ 重要提示

### 使用Cookie的风险：
- ❌ 可能违反QQ音乐服务条款
- ❌ Cookie会过期，需要定期更新
- ❌ 存在账号安全风险
- ❌ 不建议用于生产环境

### 我们的建议：
- ✅ 优先使用我们之前的方案（返回官方链接）
- ✅ 如果一定要用Cookie，请仅用于个人学习和测试
- ✅ 注意保护账号安全

---

## 📖 获取QQ音乐Cookie的步骤

### 方法一：使用浏览器开发者工具（推荐）

#### 步骤1：登录QQ音乐网页版
1. 打开浏览器，访问：https://y.qq.com
2. 登录你的QQ账号（建议使用VIP账号）

#### 步骤2：打开开发者工具
- **Chrome/Edge**: 按 `F12` 键，或右键 → 检查
- **Firefox**: 按 `F12` 键，或右键 → 检查元素
- **Safari**: 需先启用开发者工具（偏好设置 → 高级 → 勾选在菜单栏显示开发菜单）

#### 步骤3：找到Cookie
1. 在开发者工具中，切换到 **Application**（应用）标签
2. 在左侧菜单中找到 **Cookies**（Cookie）
3. 点击 **https://y.qq.com**
4. 在右侧你会看到所有的Cookie

#### 步骤4：复制Cookie
有两种方式：

**方式A：复制特定Cookie（推荐）**
- 找到以下关键Cookie并复制：
  - `uin`（你的QQ号）
  - `qqmusic_key`
  - `qm_keyst`
  - 其他以`qqmusic_`开头的Cookie

**方式B：复制全部Cookie**
- 在控制台（Console）标签中输入：
  ```javascript
  console.log(document.cookie);
  ```
- 按回车，然后复制输出的全部内容

---

### 方法二：使用浏览器插件

#### 推荐插件：
- **EditThisCookie**（Chrome/Edge）
- **Cookie-Editor**（Firefox）

#### 使用方法：
1. 在浏览器扩展商店安装插件
2. 访问QQ音乐并登录
3. 点击插件图标
4. 一键导出所有Cookie

---

## 🔧 Cookie使用示例

### 如果你想在项目中使用Cookie：

```javascript
// 示例：使用Cookie进行请求
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Referer': 'https://y.qq.com/',
  'Cookie': '这里粘贴你的Cookie内容'
};

// 发送请求时带上这些headers
```

---

## ⏰ Cookie有效期

- QQ音乐Cookie通常会在一段时间后过期
- 建议定期检查和更新
- 如果发现API调用失败，可能是Cookie过期了

---

## 🛡️ 安全建议

1. **不要分享Cookie**：Cookie包含你的账号信息
2. **定期更换**：定期重新获取Cookie
3. **使用小号**：建议使用专门的小号，不要用主号
4. **仅限学习**：仅用于个人学习和测试目的

---

## 🎯 回到我们的项目

### 我们的推荐方案（无需Cookie）：
使用 `simple-server-music-card.js` 或 `simple-server-netease.js`
- ✅ 稳定可靠
- ✅ 无需维护Cookie
- ✅ 完全合法

### 如果你一定要用Cookie：
需要修改代码，集成带Cookie的API请求，这会增加复杂度和维护成本。

---

## 📞 需要帮助？

如果你在获取Cookie或集成过程中遇到问题，告诉我！
