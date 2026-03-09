# 阿里云轻量服务器部署指南

本指南将帮助你将 mindmap-license-server 部署到阿里云轻量服务器。

## 前置要求

- 阿里云账户
- 域名（可选，但推荐）
- SSH 客户端（如 PuTTY 或 OpenSSH）
- 基本的 Linux 命令行知识

## 1. 购买和配置服务器

### 1.1 购买阿里云轻量服务器

1. 登录阿里云控制台
2. 进入"轻量应用服务器"页面
3. 点击"创建服务器"
4. 选择以下配置：
   - 镜像：Ubuntu 22.04 LTS
   - 套餐：2核2GB（可根据实际需求调整）
   - 存储：40GB SSD
   - 带宽：3Mbps（可根据实际需求调整）
5. 设置服务器名称和密码
6. 确认订单并支付

### 1.2 配置安全组

1. 在服务器控制台，点击"安全组"
2. 添加以下入站规则：
   - SSH (22): 允许你的 IP 地址访问
   - HTTP (80): 允许所有 IP 访问
   - HTTPS (443): 允许所有 IP 访问
3. 保存配置

### 1.3 连接到服务器

使用 SSH 连接到服务器：

```bash
ssh root@your-server-ip
```

输入你设置的密码。

## 2. 服务器初始化

### 2.1 更新系统

```bash
apt update && apt upgrade -y
```

### 2.2 安装必要软件

```bash
# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# 安装 MySQL
apt install -y mysql-server

# 安装 Nginx
apt install -y nginx

# 安装 Redis
apt install -y redis-server

# 安装 PM2
npm install -g pm2

# 安装 Git
apt install -y git
```

### 2.3 配置 MySQL

```bash
# 运行安全配置脚本
mysql_secure_installation

# 登录 MySQL
mysql -u root -p
```

创建数据库和用户：

```sql
CREATE DATABASE mindmap_license;
CREATE USER 'license_user'@'localhost' IDENTIFIED BY 'your-secure-password';
GRANT ALL PRIVILEGES ON mindmap_license.* TO 'license_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2.4 配置 Redis

```bash
# 编辑 Redis 配置
nano /etc/redis/redis.conf
```

设置密码（取消注释并修改）：

```
requirepass your-redis-password
```

重启 Redis：

```bash
systemctl restart redis-server
systemctl enable redis-server
```

## 3. 部署应用

### 3.1 克隆代码

```bash
cd /var/www
git clone https://github.com/your-username/mindmap-license-server.git
cd mindmap-license-server
```

### 3.2 安装依赖

```bash
npm install
```

### 3.3 配置环境变量

创建 `.env` 文件：

```bash
nano .env
```

添加以下内容：

```env
# 服务器配置
HOST=127.0.0.1
PORT=3000
NODE_ENV=production
TRUST_PROXY=1

# CORS (逗号分隔). Obsidian 桌面端常见 Origin: app://obsidian.md
CORS_ORIGINS=app://obsidian.md

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=mindmap_license
DB_USER=license_user
DB_PASSWORD=your-secure-password

# Redis 配置
REDIS_ENABLED=false
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# 许可证配置
LICENSE_PRIVATE_KEY_B64=your-private-key-here
LICENSE_PUBLIC_KEY_B64=your-public-key-here
ADMIN_TOKEN=your-secure-admin-token-here
SEATS=3
OFFLINE_GRACE_DAYS=7
```

### 3.4 初始化数据库

你有两种方式建表（二选一）：

1) **推荐（与代码一致）**：Sequelize 同步建表

```bash
npm run db:init
```

2) 使用 SQL 建表（可选）：

```bash
mysql -u license_user -p mindmap_license < schema.mysql.sql
```

### 3.5 生成密钥对

```bash
npm run gen:keys
```

将生成的公钥和私钥添加到 `.env` 文件中。

### 3.6 使用 PM2 启动应用

```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

## 4. 配置 Nginx

### 4.1 安装 SSL 证书

使用 Certbot 安装 Let's Encrypt 证书：

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

按照提示完成证书安装。

### 4.2 配置 Nginx

创建 Nginx 配置文件：

```bash
nano /etc/nginx/sites-available/license-server
```

添加以下内容：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用配置：

```bash
ln -s /etc/nginx/sites-available/license-server /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## 5. 配置防火墙

```bash
# 启用 UFW
ufw enable

# 允许 SSH
ufw allow ssh

# 允许 HTTP 和 HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# 查看状态
ufw status
```

## 6. 配置自动备份

创建备份脚本：

```bash
nano /var/www/backup.sh
```

添加以下内容：

```bash
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/mindmap_license"
mkdir -p $BACKUP_DIR

# 备份数据库
mysqldump -u license_user -p'your-secure-password' mindmap_license > $BACKUP_DIR/db_$DATE.sql

# 压缩备份
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz $BACKUP_DIR/db_$DATE.sql

# 删除7天前的备份
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete
```

设置权限并添加到 crontab：

```bash
chmod +x /var/www/backup.sh
crontab -e
```

添加以下行（每天凌晨2点备份）：

```
0 2 * * * /var/www/backup.sh
```

## 7. 监控和日志

### 7.1 配置 PM2 日志

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 7.2 配置 Nginx 日志轮转

创建日志轮转配置：

```bash
nano /etc/logrotate.d/license-server
```

添加以下内容：

```
/var/log/nginx/license-server*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

## 8. 测试部署

### 8.1 测试健康检查

```bash
curl https://your-domain.com/health
```

应该返回：

```json
{"ok":true}
```

### 8.2 测试创建激活密钥

```bash
curl -X POST https://your-domain.com/admin/create-key \
  -H "Authorization: Bearer your-admin-token" \
  -H "Content-Type: application/json" \
    -d '{"maxVersion":"0.2.999"}'
```

### 8.3 测试激活许可证

```bash
curl -X POST https://your-domain.com/activate \
  -H "Content-Type: application/json" \
  -d '{
    "key": "your-activation-key",
    "deviceId": "test-device-id",
    "deviceName": "Test Device",
    "appVersion": "1.0.0"
  }'
```

## 9. 维护和更新

### 9.1 更新应用

```bash
cd /var/www/mindmap-license-server
git pull
npm install
pm2 restart license-server
```

### 9.2 更新系统

```bash
apt update && apt upgrade -y
```

### 9.3 查看日志

```bash
# PM2 日志
pm2 logs license-server

# Nginx 日志
tail -f /var/log/nginx/license-server.access.log
tail -f /var/log/nginx/license-server.error.log
```

## 10. 故障排除

### 10.1 应用无法启动

检查 PM2 日志：

```bash
pm2 logs license-server
```

检查环境变量是否正确设置。

### 10.2 数据库连接失败

检查 MySQL 是否运行：

```bash
systemctl status mysql
```

检查数据库凭据是否正确。

### 10.3 Nginx 502 错误

检查应用是否运行：

```bash
pm2 status
```

检查 Nginx 配置：

```bash
nginx -t
```

## 11. 性能优化

### 11.1 启用 Nginx 缓存

在 Nginx 配置中添加：

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;

server {
    ...
    location / {
        proxy_cache my_cache;
        proxy_cache_valid 200 60m;
        ...
    }
}
```

### 11.2 优化 MySQL

编辑 MySQL 配置：

```bash
nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

添加或修改以下参数：

```
[mysqld]
innodb_buffer_pool_size = 512M
max_connections = 100
query_cache_size = 32M
```

重启 MySQL：

```bash
systemctl restart mysql
```

## 12. 安全建议

1. 定期更新系统和软件
2. 使用强密码
3. 启用防火墙
4. 限制 SSH 访问（使用密钥认证）
5. 定期备份数据
6. 监控服务器日志
7. 使用 fail2ban 防止暴力破解

## 13. 成本估算

- 阿里云轻量服务器（2核2GB）：约 ¥60-100/月
- 域名：约 ¥50-100/年
- SSL 证书：免费（Let's Encrypt）

首年：约 ¥150-200
后续每年：约 ¥720-1200

## 14. 总结

本指南详细介绍了如何在阿里云轻量服务器上部署 mindmap-license-server。按照本指南操作，你应该能够成功部署并运行许可证服务器。如果遇到问题，请参考故障排除部分或查看日志文件。
