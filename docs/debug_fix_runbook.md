# mindmap-license-server 修复调试复盘（实战版）

## 1. 目标与背景
本次复盘用于沉淀服务器部署后出现的“服务卡住、构建卡住、接口报错、有效期字段异常”等问题的处理经验，形成可复用 runbook。

适用场景：
- 阿里云轻量服务器（低内存规格）
- Node.js + PM2 + MySQL 部署
- `mindmap-license-server` 在线激活服务

---

## 2. 本次关键问题总览

### 2.1 Git/目录相关
- **现象**：`git clone` 报 `destination path ... already exists`。
- **原因**：目标目录已存在且非空。
- **处理**：改为在已有目录 `git pull` 或删除后重拉。
- **经验**：生产环境优先“原地更新”而非重复 clone。

### 2.2 目录删除失败（Windows 本地）
- **现象**：删除嵌套目录报“被其他进程占用”。
- **原因**：`Code.exe` / 终端进程占用目录句柄。
- **处理**：关闭 VS Code 窗口或结束占用进程后删除。
- **经验**：Windows 下目录删除失败优先排查占用进程，而不是反复 `Remove-Item`。

### 2.3 推送被 GitHub 阻断
- **现象**：`push protection` 拦截，提示包含 secret。
- **原因**：日志文件中含明文 PAT。
- **处理**：脱敏后 `amend` 并重新 push。
- **经验**：日志、脚本、示例命令都要避免写入明文凭证。

### 2.4 服务“卡住”与“无响应”
- **现象**：`npm run build` 长时间无输出；`curl` 偶发无响应。
- **原因**：
  - 低内存机器（约 890MB）构建阶段容易慢/卡；
  - PM2 启动了重复实例；
  - MySQL 连接偶发超时（`ETIMEDOUT`）导致服务不稳定。
- **处理**：
  - 增加 swap；
  - 清理 PM2 重复进程；
  - 校验 `.env` 与数据库连接；
  - 使用 `--update-env` 重启。
- **经验**：小内存机器应优先关注内存/IO 与 DB 可达性，而非盲目重启应用。

### 2.5 创建带有效期激活码失败
- **现象 A**：`"validDays" is not allowed`。
- **原因 A**：服务未运行到最新版本或环境未刷新。
- **处理 A**：更新代码、重启进程并刷新环境。

- **现象 B**：`Unknown column 'expires_at' in 'field list'`。
- **原因 B**：数据库表结构未同步（缺少 `expires_at` 列）。
- **处理 B**：执行 `ALTER TABLE activation_keys ADD COLUMN expires_at ...`。

- **现象 C**：请求成功但 `expiresAt: null`。
- **原因 C**：响应组装取实例字段，受 Sequelize class field shadowing 影响。
- **处理 C**：代码修复为直接返回计算出的 `expiresAtDate`。

---

## 3. 卡点与误区清单（最重要）

1. **在 `mysql>` 提示符里执行了 `curl`**
   - 结果：进入多行字符串输入（`">`）无法退出。
   - 正确做法：
     - `Ctrl + C` 先中断当前输入；
     - `\c` 清空输入；
     - `EXIT;` 退出 MySQL；
     - 回到 shell 再执行 `curl`。

2. **PM2 日志误判**
   - `pm2 logs --lines` 可能显示历史错误，不代表当前仍失败。
   - 正确做法：先 `pm2 flush`，再重启，再看短日志。

3. **更新 `.env` 后未生效**
   - 只 `restart` 不带环境刷新会沿用旧变量。
   - 正确做法：`npx pm2 restart <name> --update-env`。

4. **命令里仍用占位符密码**
   - 导致 `Access denied`，误以为数据库挂了。
   - 正确做法：先单独验证账号：
     - `mysql -h 127.0.0.1 -u license_user -p -e "SELECT 1;"`

5. **将敏感信息写入日志/聊天**
   - 会触发安全风险与仓库拦截。
   - 正确做法：立即轮换 token/password，文档统一用占位符。

---

## 4. 已验证可用的稳定恢复流程

> 以下流程用于“服务健康检查失败/接口不稳定/更新后不生效”。

### Step 1：确认代码与进程
```bash
cd /opt/mindmap-license-server
git fetch origin
git reset --hard origin/main
```

### Step 2：确认数据库与环境
```bash
grep -E '^(DB_HOST|DB_PORT|DB_USER|DB_NAME|REDIS_ENABLED)=' .env
mysql -h 127.0.0.1 -u license_user -p -e "SELECT 1;"
```

### Step 3：清日志 + 刷新环境重启
```bash
npx pm2 flush mindmap-license-server
npx pm2 restart mindmap-license-server --update-env
```

### Step 4：健康检查
```bash
curl -m 3 -v http://127.0.0.1:3000/health
npx pm2 logs mindmap-license-server --lines 40 --nostream
```

### Step 5：验证带有效期激活码
```bash
curl -X POST "http://127.0.0.1:3000/admin/create-key" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"maxVersion":"3.999.999","seats":3,"validDays":7}'
```

预期：返回中 `expiresAt` 为非空时间字符串。

---

## 5. 数据库迁移补丁（本次必须项）

当出现 `Unknown column 'expires_at'` 时执行：

```sql
USE mindmap_license;
ALTER TABLE activation_keys
  ADD COLUMN expires_at DATETIME NULL,
  ADD INDEX idx_activation_keys_expires_at (expires_at);
```

---

## 6. 本次代码修复点（已合入）

### 6.1 有效期字段修复
- 文件：`src/services/license.service.ts`
- 修复：创建激活码响应中的 `expiresAt`，改为基于本次计算值 `expiresAtDate` 返回，避免受实例字段读取异常影响。

### 6.2 版本检查调试增强
- 文件：`src/utils/version.utils.ts`
- 修改：将 `console.log` 替换为 `logger.debug`，添加详细的版本解析和比较日志
- 文件：`src/utils/logger.utils.ts`
- 修改：将日志级别从 `config.NODE_ENV === 'development' ? 'debug' : 'info'` 改为 `'debug'`，确保生产环境也能看到调试信息
- 文件：`src/services/activation.service.ts`
- 修改：在三个版本检查点添加详细的日志信息（激活密钥检查、许可证二次校验、刷新许可证检查）

#### 版本检查问题排查流程

当遇到 `VERSION_NOT_ALLOWED` 错误时：

1. 查看日志中的版本检查信息：
   ```bash
   tail -n 100 logs/combined.log | grep "Version"
   ```

2. 检查数据库中的激活密钥版本配置：
   ```bash
   mysql -u root -p -e "USE mindmap_license; SELECT id, \`key\`, max_major, max_version, seats, disabled FROM activation_keys LIMIT 5;"
   ```

3. 确认版本号格式：
   - 应用版本格式：`major.minor.patch`（如 `0.2.5`）
   - 最大版本格式：`major.minor.patch`（如 `0.2.999`）
   - 版本比较规则：`current <= max` 允许激活

4. 常见问题：
   - 版本号格式不正确（如缺少 patch 版本）
   - maxVersion 设置过小（如 `0.2.0` 而应用版本是 `0.2.5`）
   - 版本解析失败（日志中会显示 `Version parsing failed!`）

5. 解决方案：
   - 更新激活密钥的 maxVersion 值
   - 确保应用版本号格式正确
   - 检查版本比较逻辑是否正确

#### 快速编译命令

```bash
npm run build
```

或使用增量编译：

```bash
npx tsc --build --incremental
```

---

## 7. 后续注意事项（长期）

1. **安全**
   - 禁止在日志、脚本、工单中保留真实 `ADMIN_TOKEN`、DB 密码、PAT。
   - 一旦泄露，立即轮换并重启服务加载新变量。

2. **低配机器策略**
   - 保留 swap；
   - 避免频繁全量构建；
   - 优先用最小命令定位（健康检查 + DB ping + pm2 状态）。

### 7.1 低内存服务器卡顿：原因与方案（重点）

#### 常见原因

- **内存不足**：约 1G 内存机器在 `npm run build` / `tsc` 阶段容易长时间无输出；
- **无 swap 或 swap 太小**：内存顶满后进程容易抖动、超时或假死；
- **并发抢占**：MySQL + Node + PM2 + Nginx 同时运行时，CPU/IO 被抢占；
- **错误重试放大卡顿**：数据库连接偶发超时导致应用反复重连，进一步占资源。

#### 快速诊断（2 分钟）

```bash
free -h
swapon --show
uptime
ps -eo pid,ppid,cmd,%mem,%cpu --sort=-%mem | head -n 10
```

判断标准：
- `available` 持续很低（例如 < 150MB）且 swap 几乎没有时，基本可判定为资源瓶颈；
- `tsc` / `node` / `mysqld` 持续占高内存时，优先降并发与减少构建。

#### 立即可执行方案

1) **优先保证服务可用（跳过编译）**

```bash
cd /opt/mindmap-license-server
npx pm2 delete all
npx pm2 start "npx tsx src/app.ts" --name mindmap-license-server
npx pm2 save
curl -m 3 -sS http://127.0.0.1:3000/health
```

2) **补足 swap（建议 2G）**

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
free -h
```

3) **后台构建，避免前台“卡住错觉”**

```bash
cd /opt/mindmap-license-server
nohup npm run build > build.log 2>&1 &
tail -f build.log
```

4) **构建超时保护**

```bash
timeout 300 npm run build || echo 'build timeout'
```

#### 长期建议

- 低配机减少“服务器本地全量构建”，尽量在本地/CI 构建后部署产物；
- 每次发版走固定流程：`git reset` → `pm2 restart --update-env` → `curl /health`；
- 遇到卡顿先看资源与 DB 连通，不要先反复重启。

3. **发布流程固定化**
   - 更新代码后统一执行：
     - `git fetch/reset` → `npm run build`（如需）→ `pm2 restart --update-env` → `curl /health`。

4. **日志使用习惯**
   - 排障前 `pm2 flush`，减少历史日志干扰。

5. **SQL 与 Shell 严格区分**
   - `mysql>` 里只跑 SQL；
   - API 调用命令必须在 shell 提示符执行。

---

## 8. 一页 Checklist（值班可直接照抄）

- [ ] `git reset --hard origin/main` 已完成
- [ ] `.env` 中 DB 参数正确（`127.0.0.1` / `license_user` / 正确密码）
- [ ] `mysql ... SELECT 1` 成功
- [ ] `pm2 restart ... --update-env` 已执行
- [ ] `curl http://127.0.0.1:3000/health` 返回 `200` 且 `{"ok":true}`
- [ ] `create-key(validDays)` 返回 `expiresAt` 非空
- [ ] 未在任何地方暴露真实 token/password

---

## 9. 本次最终验收记录（2026-03）

### 9.1 最终健康检查

- `curl -m 3 -v http://127.0.0.1:3000/health` 返回 `HTTP/1.1 200 OK`
- 响应体为 `{"ok":true,...}`，服务可用。

### 9.2 最终功能验收（有效期激活码）

执行：

```bash
curl -X POST "http://127.0.0.1:3000/admin/create-key" \
   -H "Authorization: Bearer <ADMIN_TOKEN>" \
   -H "Content-Type: application/json" \
   -d '{"maxVersion":"3.999.999","seats":3,"validDays":7}'
```

验收标准：

- 返回 `key` 非空；
- 返回 `expiresAt` 非空（如 `2026-03-17T...Z`），表示 `validDays` 已生效。

### 9.3 复盘结论

本次链路最终全部打通，关键在于同时完成以下三项：

1. 应用代码升级到修复提交（`expiresAtDate` 响应修复）；
2. 数据库补齐 `activation_keys.expires_at` 列；
3. PM2 使用 `--update-env` 重启，确保新环境变量生效。

---

## 10. 凭据泄露后的标准处置（必须执行）

若 `ADMIN_TOKEN` 或数据库密码出现在聊天/日志/截图中，按以下顺序处理：

### 10.1 轮换 `ADMIN_TOKEN`

```bash
cd /opt/mindmap-license-server
nano .env
```

将 `ADMIN_TOKEN=` 改为新的强随机值后执行：

```bash
npx pm2 restart mindmap-license-server --update-env
```

### 10.2 轮换数据库密码

```sql
ALTER USER 'license_user'@'localhost' IDENTIFIED BY '<NEW_DB_PASSWORD>';
FLUSH PRIVILEGES;
```

同步更新 `.env` 的 `DB_PASSWORD=`，然后：

```bash
npx pm2 restart mindmap-license-server --update-env
mysql -h 127.0.0.1 -u license_user -p -e "SELECT 1;"
```

### 10.3 清理历史记录（最小化）

- 修改/脱敏本地与仓库中的明文凭据；
- 确认不再将真实凭据粘贴到 `README`、`deploylog`、工单、聊天记录中。
