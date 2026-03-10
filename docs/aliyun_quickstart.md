# 阿里云快速开始（最短路径）

本文档只保留“能跑起来”的最小步骤。完整说明请看 `aliyun_deployment.md`。

## 1) 连接服务器并拉取代码

```bash
ssh root@<SERVER_IP>
cd /opt
git clone https://github.com/fumaye1/mindmap-license-server.git
cd mindmap-license-server
```

## 2) 安装依赖

```bash
npm install
```

## 3) 准备 MySQL（建库建用户）

```bash
mysql -u root -p
```

```sql
CREATE DATABASE mindmap_license CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'license_user'@'localhost' IDENTIFIED BY '<DB_PASSWORD>';
GRANT ALL PRIVILEGES ON mindmap_license.* TO 'license_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 4) 配置环境变量

```bash
cp .env.example .env
nano .env
```

至少确认：

- `HOST=127.0.0.1`
- `PORT=3000`
- `DB_HOST=127.0.0.1`
- `DB_NAME=mindmap_license`
- `DB_USER=license_user`
- `DB_PASSWORD=<DB_PASSWORD>`
- `REDIS_ENABLED=false`
- `ADMIN_TOKEN=<ADMIN_TOKEN>`
- `CORS_ORIGINS=app://obsidian.md`

## 5) 生成签名密钥并建表

```bash
npm run gen:keys
npm run db:init
```

若历史库缺字段（`expires_at`），执行：

```sql
ALTER TABLE activation_keys
  ADD COLUMN expires_at DATETIME NULL,
  ADD INDEX idx_activation_keys_expires_at (expires_at);
```

## 6) 启动服务（低内存优先方案）

低内存机器建议先用 `tsx` 直接运行：

```bash
npx pm2 delete all
npx pm2 start "npx tsx src/app.ts" --name mindmap-license-server
npx pm2 save
```

## 7) 验证

```bash
curl -s http://127.0.0.1:3000/health
```

创建带有效期激活码（预期 `expiresAt` 非空）：

```bash
curl -X POST "http://127.0.0.1:3000/admin/create-key" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"maxVersion":"3.999.999","seats":3,"validDays":7}'
```

## 8) 下一步

- 完整部署与 HTTPS：`aliyun_deployment.md`
- 故障排查与低内存卡顿：`debug_fix_runbook.md`
- 架构与模块说明：`aliyun_design.md`、`aliyun_structure.md`
