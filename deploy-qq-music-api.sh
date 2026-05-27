#!/bin/bash
# QQ音乐API部署脚本

echo "========================================="
echo "QQ音乐API 部署脚本"
echo "========================================="
echo ""

# 进入项目目录
cd /home/admin/fwh

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装Node.js"
    exit 1
fi
echo "✅ Node.js 已安装: $(node -v)"

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装npm"
    exit 1
fi
echo "✅ npm 已安装: $(npm -v)"
echo ""

# 克隆QQ音乐API项目
echo "📦 下载QQ音乐API项目..."
if [ -d "qq-music-api" ]; then
    echo "⚠️  目录已存在，正在更新..."
    cd qq-music-api
    git pull || true
else
    git clone https://github.com/Rain120/qq-music-api.git
    cd qq-music-api
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 创建配置文件
echo "⚙️  配置用户信息..."
if [ ! -f "config/user-info.js" ]; then
    cat > config/user-info.js << 'EOF'
const userInfo = {
  loginUin: '你的QQ号码',
  cookie: '你的QQ音乐Cookie',
}

module.exports = userInfo
EOF
    echo "✅ 已创建配置文件: config/user-info.js"
else
    echo "✅ 配置文件已存在"
fi

echo ""
echo "========================================="
echo "部署完成！"
echo "========================================="
echo ""
echo "📝 下一步操作："
echo "1. 编辑配置文件: nano config/user-info.js"
echo "   填入你的QQ号码和QQ音乐Cookie"
echo ""
echo "2. 启动服务: npm start"
echo "   或者使用PM2: pm2 start npm --name 'qq-music-api' -- start"
echo ""
echo "3. 访问API Explorer: http://你的服务器IP:3200/explorer"
echo ""
echo "📖 如何获取QQ音乐Cookie："
echo "1. 打开浏览器，访问 https://y.qq.com"
echo "2. 登录你的QQ音乐账号（需要会员）"
echo "3. 按F12打开开发者工具"
echo "4. 切换到 Network 标签"
echo "5. 刷新页面，任意找一个请求"
echo "6. 在 Request Headers 中找到 Cookie"
echo "7. 复制全部Cookie内容到配置文件中"
echo ""
