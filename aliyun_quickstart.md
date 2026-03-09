# 阿里云版本快速开始指南

本指南帮助你快速在阿里云轻量服务器上部署 mindmap-license-server。

## 前置要求

- 阿里云账户
- 域名（可选，但推荐）
- SSH 客户端

## 快速部署（5分钟）

### 1. 购买服务器

1. 登录阿里云控制台
2. 购买轻量应用服务器（Ubuntu 22.04，2核2GB）
3. 等待服务器创建完成

### 2. 连接服务器

```bash
ssh root@your-server-ip
```

### 3. 运行初始化脚本

```bash
# 克隆代码
cd /var/www
git clone https://github.com/your-username/mindmap-license-server.git
cd mindmap-license-server

# 运行初始化脚本
chmod +x scripts/setup.sh
./scripts/setup.sh
```

脚本会自动：
- 更新系统
- 安装必要软件（Node.js、MySQL、Nginx、Redis）

说明：`scripts/setup.sh` 主要负责安装依赖与基础防火墙配置；数据库建库建用户、`.env`、建表与启动请继续参考 `aliyun_deployment.md` 或 `hk_light_server_runbook.md`。

### 4. 配置域名（可选）

如果你有域名，配置 DNS 指向你的服务器 IP，然后运行：

```bash
chmod +x scripts/setup-ssl.sh
./scripts/setup-ssl.sh your-domain.com
```

### 5. 测试部署

```bash
# 测试健康检查
curl http://your-server-ip/health

# 测试创建激活密钥
curl -X POST http://your-server-ip/admin/create-key \
  -H "Authorization: Bearer your-admin-token" \
  -H "Content-Type: application/json" \
  -d '{"maxVersion":"0.2.999"}'
```

### 6. 配置插件

在 Obsidian 插件设置中：
- `License server base URL`: `http://your-server-ip` 或 `https://your-domain.com`
- `License public key (base64)`: 从 `.env` 文件中获取
- `Activation key`: 使用管理员 API 创建的密钥

## 常用命令

### 应用管理

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs mindmap-license-server

# 重启应用
pm2 restart mindmap-license-server

# 停止应用
pm2 stop mindmap-license-server
```

### 数据库管理

```bash
# 连接数据库
mysql -u license_user -p mindmap_license

# 备份数据库
./scripts/backup.sh

# 建表/同步（Sequelize）
npm run db:init
```

### 日志查看

```bash
# 应用日志
pm2 logs license-server

# Nginx 访问日志
tail -f /var/log/nginx/license-server.access.log

# Nginx 错误日志
tail -f /var/log/nginx/license-server.error.log
```

## 故障排除

### 应用无法启动

```bash
# 查看应用日志
pm2 logs license-server

# 检查环境变量
cat /var/www/mindmap-license-server/.env
```

### 数据库连接失败

```bash
# 检查 MySQL 状态
systemctl status mysql

# 测试数据库连接
mysql -u license_user -p mindmap_license
```

### Nginx 502 错误

```bash
# 检查应用状态
pm2 status

# 检查 Nginx 配置
nginx -t

# 查看 Nginx 错误日志
tail -f /var/log/nginx/error.log
```

## 更新应用

```bash
cd /var/www/mindmap-license-server
git pull
npm install
pm2 restart mindmap-license-server
```

## 下一步

- 阅读 [aliyun_design.md](aliyun_design.md) 了解详细设计
- 阅读 [aliyun_deployment.md](aliyun_deployment.md) 了解详细部署步骤
- 阅读 [aliyun_structure.md](aliyun_structure.md) 了解项目结构
- 阅读 [hk_light_server_runbook.md](hk_light_server_runbook.md)（香港轻量服务器专用）

## 获取帮助

如果遇到问题：
1. 查看日志文件
2. 检查环境变量配置
3. 参考故障排除部分
4. 提交 Issue
