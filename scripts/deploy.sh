#!/bin/bash

# 部署脚本 - mindmap-license-server

set -e

echo "=== Mindmap License Server 部署脚本 ==="
echo ""

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "错误: Node.js 未安装。请先安装 Node.js 18+"
    exit 1
fi

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo "错误: npm 未安装。请先安装 npm"
    exit 1
fi

# 1. 安装依赖
echo "步骤 1/5: 安装依赖..."
npm install
echo "✓ 依赖安装完成"
echo ""

# 2. 构建项目
echo "步骤 2/5: 构建项目..."
npm run build
echo "✓ 项目构建完成"
echo ""

# 3. 初始化数据库
echo "步骤 3/5: 初始化数据库..."
read -p "是否初始化数据库？(y/n): " init_db
if [ "$init_db" = "y" ]; then
    npm run db:init
fi
echo "✓ 数据库初始化完成"
echo ""

# 4. 生成密钥对
echo "步骤 4/5: 生成密钥对..."
read -p "是否生成新的密钥对？(y/n): " gen_keys
if [ "$gen_keys" = "y" ]; then
    npm run gen:keys
    echo ""
    echo "请将生成的密钥添加到 .env 文件中"
fi
echo "✓ 密钥对生成完成"
echo ""

# 5. 部署应用
echo "步骤 5/5: 部署应用..."
read -p "是否现在部署应用？(y/n): " do_deploy
if [ "$do_deploy" = "y" ]; then
    pm2 restart ecosystem.config.js --env production
    echo "✓ 应用部署完成"
fi

echo ""
echo "=== 部署流程完成 ==="
echo ""
echo "下一步："
echo "1. 配置 Nginx"
echo "2. 设置 SSL 证书"
echo "3. 测试 API 端点"
echo ""
echo "更多信息，请参阅 aliyun_deployment.md"
