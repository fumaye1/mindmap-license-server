# 阿里云轻量服务器部署指南

本指南将帮助你将 mindmap-license-server 部署到阿里云轻量服务器。

> 文档定位：本文件是“完整部署主文档”。
> - 最短步骤请看：`aliyun_quickstart.md`
> - 常见故障请看：`debug_fix_runbook.md`

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
cd /opt
git clone https://github.com/fumaye1/mindmap-license-server.git
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
DB_HOST=127.0.0.1
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

先准备管理员令牌（`ADMIN_TOKEN`）：

- 服务器端建议先导出环境变量，避免反复手输：`export ADMIN_TOKEN='<YOUR_ADMIN_TOKEN>'`
- 本机 PowerShell 建议：`$token = '<YOUR_ADMIN_TOKEN>'`

#### 8.2.1 服务器端创建（curl）

创建永久激活码（默认不设置有效期）：

```bash
curl -X POST https://your-domain.com/admin/create-key \
    -H "Authorization: Bearer <YOUR_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
    -d '{"maxVersion":"0.2.999","seats":3}'
```

创建带有效期激活码（例如 7 天）：

```bash
curl -X POST https://your-domain.com/admin/create-key \
    -H "Authorization: Bearer <YOUR_ADMIN_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"maxVersion":"0.2.999","seats":3,"validDays":7}'
```

创建“永不过期”激活码（与 `validDays` 二选一，不能同时传）：

```bash
curl -X POST https://your-domain.com/admin/create-key \
    -H "Authorization: Bearer <YOUR_ADMIN_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"maxVersion":"0.2.999","seats":3,"neverExpires":true}'
```

#### 8.2.2 本机创建（Windows PowerShell）

```powershell
$token = "<YOUR_ADMIN_TOKEN>"
$baseUrl = "https://your-domain.com"

$body = @{
    maxVersion = "0.2.999"
    seats      = 3
    validDays  = 7
} | ConvertTo-Json

Invoke-RestMethod `
    -Method Post `
    -Uri "$baseUrl/admin/create-key" `
    -Headers @{ Authorization = "Bearer $token" } `
    -ContentType "application/json" `
    -Body $body
```

#### 8.2.3 批量创建（服务器端 Bash）

```bash
ADMIN_TOKEN='<YOUR_ADMIN_TOKEN>'
BASE_URL='https://your-domain.com'

for i in $(seq 1 20); do
    curl -s -X POST "$BASE_URL/admin/create-key" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"maxVersion":"0.2.999","seats":3,"validDays":7}'
    echo
done
```

#### 8.2.4 批量创建（本机 PowerShell）

```powershell
$token = "<YOUR_ADMIN_TOKEN>"
$baseUrl = "https://your-domain.com"
$count = 20

$results = for ($i = 1; $i -le $count; $i++) {
    $body = @{
        maxVersion = "0.2.999"
        seats      = 3
        validDays  = 7
    } | ConvertTo-Json

    try {
        $resp = Invoke-RestMethod `
            -Method Post `
            -Uri "$baseUrl/admin/create-key" `
            -Headers @{ Authorization = "Bearer $token" } `
            -ContentType "application/json" `
            -Body $body

        [PSCustomObject]@{
            index     = $i
            key       = $resp.key
            expiresAt = $resp.expiresAt
            ok        = $true
        }
    } catch {
        [PSCustomObject]@{
            index     = $i
            key       = $null
            expiresAt = $null
            ok        = $false
            error     = $_.Exception.Message
        }
    }
}

$results | Format-Table -AutoSize
# 可选导出
$results | Export-Csv -Path ".\\activation-keys.csv" -NoTypeInformation -Encoding UTF8
```

#### 8.2.5 常见错误与处理

- `401 Unauthorized`：`ADMIN_TOKEN` 错误或请求头缺少 `Authorization: Bearer ...`。
- `"validDays" is not allowed`：服务未更新到最新版本或命中旧进程，执行 `pm2 restart --update-env`。
- `neverExpires=true cannot be used with validDays`：两个字段冲突，只保留一个。
- `INVALID_REQUEST`：`maxVersion` 需满足 semver 格式（如 `0.2.999`）。

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

### 8.4 用户插件端激活（详细步骤）

#### 8.4.1 管理员侧准备

1. 先通过 `8.2` 创建激活码。
2. 确认服务健康：`GET /health` 返回 `200`。
3. 准备好以下三项给用户：
     - 服务器地址：`https://your-domain.com`
     - 插件公钥：`LICENSE_PUBLIC_KEY_B64`
     - 激活码：例如 `ABCD-EFGH-IJKL-MNOP`

#### 8.4.2 用户插件侧配置

在插件设置页填写：

1. `License server base URL`：`https://your-domain.com`
2. `License public key (base64)`：管理员提供的 `LICENSE_PUBLIC_KEY_B64`
3. `Activation key`：管理员提供的激活码

然后点击 `Activate`。

#### 8.4.3 激活请求内容（插件 -> 服务器）

插件会向 `/activate` 发送类似请求：

```json
{
    "key": "ABCD-EFGH-IJKL-MNOP",
    "deviceId": "your-device-id",
    "deviceName": "Your Device",
    "appVersion": "0.2.5"
}
```

服务端成功响应：

```json
{
    "payloadB64": "...",
    "sigB64": "..."
}
```

#### 8.4.4 用户可见成功标准

- 插件界面显示“已激活”或等价状态；
- 无 `INVALID_SIGNATURE` / `VERSION_NOT_ALLOWED` / `SEATS_EXCEEDED` 报错；
- 刷新插件或重启 Obsidian 后仍保持已激活。

#### 8.4.5 激活失败提示、原因与解决（速查表）

> 建议插件端优先展示服务端返回的 `error.code` 与 `error.message`，便于用户和管理员快速定位。

| 用户侧常见提示（示例） | 服务器错误码（`error.code`） | 常见原因 | 解决办法 |
|---|---|---|---|
| 激活码无效 / key 不存在 | `ACTIVATION_KEY_NOT_FOUND` | 激活码输错、多空格、用错环境（测试/生产） | 重新复制粘贴激活码；管理员在 `/admin/keys` 核对该 key 是否存在 |
| 激活码已禁用 | `ACTIVATION_KEY_DISABLED` | 管理员已停用该 key | 管理员重新发新 key，或在后台恢复该 key |
| 激活码已过期 | `ACTIVATION_KEY_EXPIRED` | 创建 key 时设置了 `validDays`，已超过有效期 | 管理员创建新 key，或改为更长有效期策略 |
| 当前版本未被授权 | `VERSION_NOT_ALLOWED` | 插件 `appVersion` 高于 key/license 的 `maxVersion` | 降级插件版本，或让管理员发放更高 `maxVersion` 的 key |
| 设备数已达上限 | `SEATS_EXCEEDED` | 同一 license 已绑定设备数达到 `seats` | 管理员先停用旧设备（`/admin/deactivate-device`）再激活新设备 |
| 签名校验失败 | `INVALID_SIGNATURE` | 本地许可证被篡改、服务端公私钥不匹配、插件公钥配置错 | 检查插件公钥是否与服务端 `LICENSE_PUBLIC_KEY_B64` 一致；必要时重新激活 |
| 许可证内容非法 | `INVALID_PAYLOAD` / `INVALID_SIGNED_LICENSE` | 本地缓存的 license 结构损坏或不完整 | 清理插件本地 license 缓存后重新激活 |
| 请求参数错误 | `INVALID_REQUEST` | 缺字段或格式不合法（如 `appVersion` 非 semver） | 按接口要求补齐字段，确保 `appVersion` 如 `0.2.5` |
| 跨域被拦截 | `CORS_BLOCKED` | 请求来源不在 `CORS_ORIGINS` 白名单 | 在服务端 `.env` 增加对应来源并 `pm2 restart --update-env` |
| 地址不存在 / 路由错误 | `NOT_FOUND` | URL 路径写错、反向代理未转发到正确服务 | 核对 base URL、Nginx 配置和接口路径 |

#### 8.4.6 标准排障流程（用户与管理员协作）

1. **先看客户端错误码**：记录插件侧完整错误（至少含 `error.code`）。
2. **检查连通性**：访问 `https://your-domain.com/health`，确认返回 `200`。
3. **核对三项输入**：`base URL`、`public key`、`activation key` 是否来自同一环境。
4. **管理员查服务日志**：

```bash
pm2 logs license-server --lines 100
```

5. **必要时刷新环境并重启**：

```bash
cd /opt/mindmap-license-server
npx pm2 restart license-server --update-env
```

6. **数据库侧验证（激活码是否存在/可用）**：

```bash
curl -X GET "http://127.0.0.1:3000/admin/keys" \
    -H "Authorization: Bearer <YOUR_ADMIN_TOKEN>"
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
