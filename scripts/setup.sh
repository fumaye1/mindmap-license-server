#!/bin/bash

# 服务器初始化脚本 - mindmap-license-server

set -e

echo "=== Mindmap License Server 服务器初始化 ==="
echo ""

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo "请使用 root 用户运行此脚本"
    exit 1
fi

# 1. 更新系统
echo "步骤 1/7: 更新系统..."
apt update && apt upgrade -y
echo "✓ 系统更新完成"
echo ""

# 2. 安装 Node.js 18
echo "步骤 2/7: 安装 Node.js 18..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    echo "✓ Node.js 安装完成"
else
    echo "✓ Node.js 已安装"
fi
echo ""

# 3. 安装 MySQL
echo "步骤 3/7: 安装 MySQL..."
if ! command -v mysql &> /dev/null; then
    apt install -y mysql-server
    echo "✓ MySQL 安装完成"
else
    echo "✓ MySQL 已安装"
fi
echo ""

# 4. 安装 Nginx
echo "步骤 4/7: 安装 Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    echo "✓ Nginx 安装完成"
else
    echo "✓ Nginx 已安装"
fi
echo ""

# 5. 安装 Redis
echo "步骤 5/7: 安装 Redis..."
if ! command -v redis-server &> /dev/null; then
    apt install -y redis-server
    echo "✓ Redis 安装完成"
else
    echo "✓ Redis 已安装"
fi
echo ""

# 6. 安装 PM2
echo "步骤 6/7: 安装 PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    echo "✓ PM2 安装完成"
else
    echo "✓ PM2 已安装"
fi
echo ""

# 7. 配置防火墙
echo "步骤 7/7: 配置防火墙..."
if command -v ufw &> /dev/null; then
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    echo "✓ 防火墙配置完成"
else
    echo "⚠ UFW 未安装，跳过防火墙配置"
fi
echo ""

echo "=== 服务器初始化完成 ==="
echo ""
echo "下一步："
echo "1. 配置 MySQL 数据库"
echo "2. 配置 Redis"
echo "3. 部署应用"
echo ""
echo "更多信息，请参阅 aliyun_deployment.md"


