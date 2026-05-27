#!/bin/bash

# 微信服务号自动部署脚本
# 适用于 Ubuntu 服务器
# 域名: gubei.asia

set -e

echo "=========================================="
echo "  微信服务号自动部署脚本"
echo "  域名: gubei.asia"
echo "=========================================="

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo "请使用 root 用户运行此脚本"
    exit 1
fi

echo ""
echo "[1/6] 更新系统并安装依赖..."
apt update -y
apt upgrade -y
apt install -y git nginx curl -y

echo ""
echo "[2/6] 安装 Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

echo ""
echo "Node.js 版本: $(node -v)"
echo "npm 版本: $(npm -v)"

echo ""
echo "[3/6] 克隆项目代码..."
cd /root
if [ -d "fwh" ]; then
    echo "项目已存在，正在更新..."
    cd fwh
    git pull
else
    echo "克隆项目..."
    git clone https://github.com/5User5/fwh.git
    cd fwh
fi

echo ""
echo "安装 npm 依赖..."
npm install

echo ""
echo "[4/6] 配置 Nginx 反向代理..."

# 创建 Nginx 配置
cat > /etc/nginx/sites-available/wechat << 'EOF'
server {
    listen 80;
    server_name gubei.asia www.gubei.asia;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 启用配置
if [ -f /etc/nginx/sites-enabled/wechat ]; then
    rm /etc/nginx/sites-enabled/wechat
fi
ln -sf /etc/nginx/sites-available/wechat /etc/nginx/sites-enabled/

# 测试并重启 Nginx
nginx -t
systemctl restart nginx
systemctl enable nginx

echo ""
echo "[5/6] 配置防火墙..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8000/tcp
echo "y" | ufw enable

echo ""
echo "[6/6] 启动应用服务..."
npm install -g pm2
cd /root/fwh
pm2 delete wechat-assistant 2>/dev/null || true
pm2 start simple-server.js --name "wechat-assistant"
pm2 save
pm2 startup systemd -u root --hp /root

echo ""
echo "=========================================="
echo "  基础部署完成！"
echo "=========================================="
echo ""
echo "下一步操作："
echo "1. 配置 SSL 证书（HTTPS）"
echo "   方案一：使用 Let's Encrypt 免费证书"
echo "   apt install certbot python3-certbot-nginx -y"
echo "   certbot --nginx -d gubei.asia -d www.gubei.asia"
echo ""
echo "   方案二：使用阿里云 SSL 证书"
echo "   请将证书文件上传到服务器并配置 Nginx"
echo ""
echo "2. 在微信公众平台配置服务器地址："
echo "   URL: https://www.gubei.asia/wechat"
echo "   Token: SOLOAutoModel2024"
echo ""
echo "常用命令："
echo "  查看服务状态: pm2 status"
echo "  查看日志: pm2 logs wechat-assistant"
echo "  重启服务: pm2 restart wechat-assistant"
echo ""
echo "=========================================="
