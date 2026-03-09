# 香港轻量服务器部署 Runbook（MySQL + Nginx + PM2）

适用场景：
- 你使用 **轻量应用服务器（香港）** 部署 license/激活服务
- 数据库使用 **MySQL**
- Obsidian 插件在客户端 **直接请求你的域名**（通过 HTTPS）

服务入口：`src/app.ts`，构建产物：`dist/app.js`。

---

## 0. 服务器准备

建议系统：Ubuntu 22.04 LTS

开放端口：
- 入站：`22`(SSH)、`80`(HTTP)、`443`(HTTPS)
- 不对公网开放：后端服务端口（默认 `3000`）

可选：先执行服务器初始化脚本（会安装 Node/MySQL/Nginx/Redis/PM2/防火墙）

```bash
sudo bash ./scripts/setup.sh
```

---

## 1. 安装 Node.js 依赖并构建

在项目目录：

```bash
npm install
npm run build
```

构建后：
- 服务入口：`dist/app.js`

---

## 2. MySQL 初始化（建议最小权限账号）

进入 MySQL：

```bash
sudo mysql
```

创建数据库与账号（把密码替换成强密码）：

```sql
CREATE DATABASE mindmap_license CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'license_user'@'localhost' IDENTIFIED BY 'REPLACE_WITH_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON mindmap_license.* TO 'license_user'@'localhost';
FLUSH PRIVILEGES;
```

你有两种方式建表（二选一）：

1) **推荐（与代码一致）**：使用 Sequelize 同步
- 直接执行 `npm run db:init`

2) 使用 SQL 建表：导入 `schema.mysql.sql`

导入方式示例：

```bash
mysql -u license_user -p mindmap_license < schema.mysql.sql
```

初始化表（Sequelize 方式）：

```bash
npm run db:init
```

补充说明（建议读完）：
- 数据库迁移/补字段（已有旧库时）：见 `README.md` 的 “Database notes (MySQL)”（包含可直接执行的 `ALTER TABLE ...` 示例）
- 签名 payload 字段（`maxVersion` / `nextCheckAt`）：见 `README.md` 的 “Signed license payload”
- 统一错误返回与错误码：见 `README.md` 的 “Error responses”

---

## 3. 生成签名密钥

在本机或服务器执行：

```bash
npm run gen:keys
```

将输出的 key 写入 `.env`：
- `LICENSE_PRIVATE_KEY_B64`
- `LICENSE_PUBLIC_KEY_B64`

---

## 4. 配置环境变量（.env）

基于 `.env.example` 新建 `.env`（生产推荐）：

- `NODE_ENV=production`
- `HOST=127.0.0.1`（只监听本地，避免绕过 Nginx）
- `PORT=3000`
- `TRUST_PROXY=1`（Nginx 反代下获取真实 IP，限流更准确）

CORS（插件直连域名时建议配置）：
- `CORS_ORIGINS=app://obsidian.md`

Redis：
- 初期规模小可以先不依赖 Redis：`REDIS_ENABLED=false`
- 如果启用：确保 `redis-server` 在运行并配置 `REDIS_HOST/REDIS_PORT/REDIS_PASSWORD`

---

## 5. 使用 PM2 启动并设为开机自启

首次启动：

```bash
mkdir -p logs
npx pm2 start ecosystem.config.js --env production
npx pm2 save
npx pm2 startup
```

查看状态：

```bash
npx pm2 status
npx pm2 logs mindmap-license-server
```

---

## 6. Nginx 反向代理与 HTTPS

1) 安装证书工具（Let’s Encrypt）：

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

2) 配置站点：
- 复制并修改 `config/nginx.conf`
- 将 `your-domain.com` 替换为你的域名

建议放到：

```bash
sudo cp ./config/nginx.conf /etc/nginx/sites-available/license-server
sudo ln -sf /etc/nginx/sites-available/license-server /etc/nginx/sites-enabled/license-server
sudo nginx -t
sudo systemctl reload nginx
```

3) 申请证书（会自动改 Nginx 配置或写入证书路径）：

```bash
sudo certbot --nginx -d your-domain.com
```

---

## 7. 自检

- 健康检查：

```bash
curl -s https://your-domain.com/health
```

- 跑一遍 API 测试脚本（需要 jq）：

```bash
sudo apt install -y jq
bash ./scripts/test-api.sh
```

---

## 8. 备份（建议至少每日）

仓库提供了 `scripts/backup.sh`（如需我帮你按 MySQL/目录结构补齐可直接说）。

建议策略：
- 每日全量备份 MySQL
- 保留 7~30 天
- 定期演练恢复到一台临时 MySQL
