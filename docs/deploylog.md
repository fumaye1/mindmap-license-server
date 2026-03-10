# 部署与修复里程碑日志（摘要）

> 本文件只保留关键里程碑，不再记录完整聊天过程。
> 详细排障步骤请参考 `debug_fix_runbook.md`。

## 2026-03 关键阶段

### 阶段 1：仓库与部署入口整理
- 目标仓库切换为 `fumaye1/mindmap-license-server`。
- 服务器更新方式统一为：`git fetch origin`、`git reset --hard origin/main`、`git clean -fd`（按需）。

### 阶段 2：服务启动不稳定排查
- 现象：`npm run build` 在低内存机器上长时间无输出，PM2 进程空表或重复实例。
- 处理：增加 swap、清理重复 PM2 实例、低内存优先使用 `npx tsx src/app.ts`、PM2 重启使用 `--update-env`。

### 阶段 3：数据库连接与配置修复
- 现象：`ETIMEDOUT`、`Access denied`、健康检查偶发失败。
- 处理：统一 `DB_HOST=127.0.0.1`，校验 MySQL 用户权限，`pm2 flush` 后再观察短窗口日志。

### 阶段 4：有效期激活码能力打通
- 问题：`validDays` 不被识别、`expires_at` 列缺失、接口返回 `expiresAt: null`。
- 处理：补齐 `activation_keys.expires_at` 列，修复 `create-key` 返回逻辑使用计算值 `expiresAtDate`。
- 结果：`validDays=7` 可以返回非空 `expiresAt`。

## 当前可用基线
- 健康检查：`GET /health` 返回 `200` 与 `{ "ok": true }`。
- 创建激活码：`POST /admin/create-key` 支持 `validDays` 且返回 `expiresAt`。
- 小规模部署建议：`REDIS_ENABLED=false`，低内存优先 `tsx`，PM2 重启统一 `--update-env`。

## 安全提醒
- 禁止在文档与日志中保存真实 `ADMIN_TOKEN`、数据库密码、PAT。
- 若凭据已泄露，必须立刻轮换并重启服务加载新变量。

## 关联文档
- 文档总入口：`README.md`
- 快速上手：`aliyun_quickstart.md`
- 完整部署：`aliyun_deployment.md`
- 故障排查：`debug_fix_runbook.md`
