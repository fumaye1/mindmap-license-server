#!/bin/bash

# SSL 设置脚本 - mindmap-license-server

set -e

if [ -z "$1" ]; then
    echo "用法: $0 <domain>"
    echo "示例: $0 your-domain.com"
    exit 1
fi

DOMAIN=$1

echo "=== Mindmap License Server SSL 设置 ==="
echo "域名: $DOMAIN"
echo ""

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo "请使用 root 用户运行此脚本"
    exit 1
fi

# 1. 安装 Certbot
echo "步骤 1/3: 安装 Certbot..."
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
    echo "✓ Certbot 安装完成"
else
    echo "✓ Certbot 已安装"
fi
echo ""

# 2. 获取 SSL 证书
echo "步骤 2/3: 获取 SSL 证书..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
echo "✓ SSL 证书获取完成"
echo ""

# 3. 设置自动续期
echo "步骤 3/3: 设置自动续期..."
(crontab -l 2>/dev/null; echo "0 0,12 * * * certbot renew --quiet") | crontab -
echo "✓ 自动续期设置完成"
echo ""

echo "=== SSL 设置完成 ==="
echo ""
echo "证书位置:"
echo "  证书: /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
echo "  私钥: /etc/letsencrypt/live/$DOMAIN/privkey.pem"
echo ""
echo "下一步："
echo "1. 更新 Nginx 配置文件中的域名"
echo "2. 重启 Nginx: systemctl restart nginx"
echo "3. 测试 HTTPS 访问"
