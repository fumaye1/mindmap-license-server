# 文档中心（docs）

本目录是 `mindmap-license-server` 的**唯一文档入口**，用于降低重复内容并提升可维护性。

## 推荐阅读顺序

1. `aliyun_quickstart.md`：5~10 分钟最短上线路径
2. `aliyun_deployment.md`：完整部署与运维细节
3. `debug_fix_runbook.md`：故障排查与实战修复手册
4. `aliyun_design.md`：架构设计与安全边界
5. `aliyun_structure.md`：代码结构与模块职责

## 文档职责边界（避免重复）

- `aliyun_quickstart.md`
  - 只保留“最短可执行步骤”
  - 不展开原理与大段排障

- `aliyun_deployment.md`
  - 生产部署主文档（环境变量、DB、Nginx、PM2、备份）
  - 允许包含完整命令与回滚流程

- `debug_fix_runbook.md`
  - 仅放“问题 -> 原因 -> 处理 -> 验收”的复盘与排障
  - 不重复部署全流程

- `aliyun_design.md`
  - 仅放架构、设计权衡、安全策略
  - 不放逐步命令

- `aliyun_structure.md`
  - 仅描述目录结构、模块职责、关键文件
  - 不放运维命令

- `deploylog.md`
  - 仅保留关键里程碑与变更摘要（不保留长对话）

## 维护规范

- 所有敏感信息使用占位符：`<ADMIN_TOKEN>`、`<DB_PASSWORD>`、`<PRIVATE_KEY>`。
- 涉及命令的变更，优先改 `aliyun_deployment.md`，其他文档链接引用。
- 如果同一段内容在两个以上文档出现，保留一处主文档，其他文档只放链接。

## 当前状态（2026-03）

- 服务健康检查：`/health` 正常。
- `validDays` 有效期激活码：已打通并返回非空 `expiresAt`。
- 已知重点：低内存机器构建易卡顿，建议优先参考 `debug_fix_runbook.md` 的低内存章节。

