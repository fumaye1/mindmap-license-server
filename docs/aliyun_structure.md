# 阿里云/轻量服务器版本项目结构

本文档详细说明了阿里云版本的 mindmap-license-server 项目的结构和各文件的作用。

## 目录结构

```
mindmap-license-server/
├── src/                      # 源代码目录
│   ├── controllers/         # 控制器
│   │   ├── activate.controller.ts
│   │   ├── admin.controller.ts
│   │   └── health.controller.ts
│   ├── middleware/          # 中间件
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── ratelimit.middleware.ts
│   ├── models/              # 数据模型
│   │   ├── activationkey.model.ts
│   │   ├── device.model.ts
│   │   └── license.model.ts
│   ├── routes/              # 路由
│   │   ├── activate.routes.ts
│   │   ├── admin.routes.ts
│   │   └── health.routes.ts
│   ├── services/            # 业务逻辑
│   │   ├── activation.service.ts
│   │   ├── license.service.ts
│   │   └── signature.service.ts
│   ├── utils/               # 工具函数
│   │   ├── crypto.utils.ts
│   │   ├── logger.utils.ts
│   │   ├── version.utils.ts
│   │   └── validation.utils.ts
│   ├── config/              # 配置文件
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   └── app.config.ts
│   ├── types/               # TypeScript 类型定义
│   │   └── index.ts
│   ├── app.ts               # Express 应用入口（轻量服务器部署使用）

├── scripts/                 # 脚本目录
│   ├── setup.sh            # 服务器初始化脚本
│   ├── setup-ssl.sh        # HTTPS/证书辅助脚本
│   ├── deploy.sh           # Linux 部署脚本
│   ├── deploy.bat          # Windows 部署脚本
│   ├── backup.sh           # 备份脚本
│   ├── init-db.ts          # 初始化数据库脚本
│   ├── test-api.sh         # API 冒烟测试（Linux）
│   ├── test-api.bat        # API 冒烟测试（Windows）
│   └── gen-keys.mjs        # 密钥生成脚本
├── config/                  # 配置文件目录
│   └── nginx.conf          # Nginx 配置
├── logs/                    # 日志目录（运行后生成）
├── .env.example            # 环境变量示例
├── .gitignore              # Git 忽略文件
├── package.json            # 项目配置
├── tsconfig.json           # TypeScript 配置
├── ecosystem.config.js     # PM2 配置
├── README.md               # 文档总入口（docs）
├── aliyun_quickstart.md    # 最短部署路径
├── aliyun_deployment.md    # 完整部署指南
├── aliyun_design.md        # 架构设计文档
├── debug_fix_runbook.md    # 故障排查与修复复盘
├── deploylog.md            # 历史过程归档
└── aliyun_structure.md     # 项目结构（本文件）
```

## 核心目录说明

### src/

#### controllers/
包含所有 HTTP 请求的控制器，处理请求和响应。

**activate.controller.ts**
- 处理许可证激活请求
- 处理许可证刷新请求

**admin.controller.ts**
- 处理管理员操作
- 创建激活密钥
- 停用设备

**health.controller.ts**
- 健康检查端点
- 返回服务器状态

#### middleware/
包含所有中间件，处理请求前的逻辑。

**auth.middleware.ts**
- 验证管理员令牌
- 检查请求权限

**error.middleware.ts**
- 统一错误处理
- 错误日志记录

**ratelimit.middleware.ts**
- API 速率限制
- 防止滥用

#### models/
包含所有数据模型，使用 Sequelize ORM。

**activationKey.model.ts**
- 激活密钥数据模型
- 字段验证
- 关联关系

**device.model.ts**
- 设备数据模型
- 字段验证
- 关联关系

**license.model.ts**
- 许可证数据模型
- 字段验证
- 关联关系

#### routes/
包含所有路由定义。

**activate.routes.ts**
- 激活相关路由
- /activate
- /refresh

**admin.routes.ts**
- 管理员相关路由
- /admin/create-key
- /admin/deactivate-device
- /admin/keys
- /admin/licenses
- /admin/devices

**health.routes.ts**
- 健康检查路由
- /health

#### services/
包含所有业务逻辑。

**activation.service.ts**
- 激活密钥验证
- 设备座位管理
- 激活流程处理

**license.service.ts**
- 许可证创建
- 许可证验证
- 许可证更新

**signature.service.ts**
- Ed25519 签名
- 签名验证
- 密钥管理

#### utils/
包含所有工具函数。

**crypto.utils.ts**
- 加密相关工具
- Base64 编码/解码
- 密钥生成

**logger.utils.ts**
- 日志工具
- 日志格式化
- 日志级别管理

**validation.utils.ts**
- 数据验证
- 输入清理
- 验证规则

**version.utils.ts**
- semver 解析与比较
- 版本授权（maxVersion）校验辅助

#### config/
包含所有配置文件。

**database.config.ts**
- Sequelize 配置
- 数据库连接
- 连接池设置

**redis.config.ts**
- Redis 客户端配置
- 连接设置
- 缓存策略

**app.config.ts**
- 应用配置
- 环境变量
- 常量定义

#### types/
包含所有 TypeScript 类型定义。

**index.ts**
- 所有类型定义
- 接口定义
- 类型导出

#### app.ts
应用入口文件，初始化 Express 应用（VPS/轻量服务器运行使用）。

## 脚本目录说明

### setup.sh
服务器初始化脚本，执行以下操作：
- 更新系统
- 安装必要软件
- 配置防火墙

### deploy.sh
部署脚本，执行以下操作：
- 拉取最新代码
- 安装依赖
- 初始化/更新数据库（小规模使用 Sequelize sync alter）
- 重启应用

### backup.sh
备份脚本，执行以下操作：
- 备份数据库
- 备份配置文件
- 清理旧备份

### gen-keys.mjs
密钥生成脚本，生成 Ed25519 密钥对。

## 配置文件说明

### config/nginx.conf
Nginx 配置文件，包含：
- 反向代理配置
- SSL 配置
- 静态文件服务
- 缓存配置

## 日志目录说明

### logs/
包含所有日志文件：
- access.log：访问日志
- error.log：错误日志
- combined.log：综合日志

## 数据库结构

### 数据库概览

数据库名称：`mindmap_license`

### 表结构

#### activation_keys（激活密钥表）

| 字段名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| id | INT | 主键 | 1 |
| key | VARCHAR(20) | 激活密钥（格式：XXXX-XXXX-XXXX-XXXX） | TCE3-6YFP-ZC4C-QDRH |
| max_major | INT | 允许的最大主版本号 | 0 |
| max_version | VARCHAR(20) | 允许的最大版本号（格式：major.minor.patch） | 0.2.999 |
| seats | INT | 允许的设备数量 | 3 |
| disabled | BOOLEAN | 是否禁用 | 0 |
| expires_at | DATETIME | 密钥过期时间（NULL 表示永不过期） | 2026-03-16 15:07:23 |
| license_id | VARCHAR(36) | 关联的许可证ID | NULL |
| created_at | DATETIME | 创建时间 | 2026-03-09 15:07:23 |
| updated_at | DATETIME | 更新时间 | 2026-03-09 15:07:23 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE KEY (key)
- INDEX idx_activation_keys_expires_at (expires_at)

**说明**：
- `max_version` 使用 semver 格式，版本比较规则为 `current <= max` 允许激活
- `expires_at` 字段用于设置激活密钥的有效期，NULL 表示永不过期
- `license_id` 在首次激活时创建，之后所有使用该密钥激活的设备共享同一个许可证

#### licenses（许可证表）

| 字段名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| license_id | VARCHAR(36) | 许可证ID（UUID） | 550e8400-e29b-41d4-a716-446655440000 |
| max_major | INT | 允许的最大主版本号 | 0 |
| max_version | VARCHAR(20) | 允许的最大版本号 | 0.2.999 |
| seats | INT | 允许的设备数量 | 3 |
| created_at | DATETIME | 创建时间 | 2026-03-09 15:07:23 |
| updated_at | DATETIME | 更新时间 | 2026-03-09 15:07:23 |

**索引**：
- PRIMARY KEY (license_id)

**说明**：
- 许可证在首次激活时创建，由激活密钥的配置决定
- 许可证可以被多个设备共享使用，但受 `seats` 限制

#### devices（设备表）

| 字段名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| id | INT | 主键 | 1 |
| license_id | VARCHAR(36) | 关联的许可证ID | 550e8400-e29b-41d4-a716-446655440000 |
| device_id | VARCHAR(255) | 设备唯一标识 | device-12345 |
| device_name | VARCHAR(255) | 设备名称 | My Computer |
| active | BOOLEAN | 是否激活 | 1 |
| first_seen_at | DATETIME | 首次激活时间 | 2026-03-09 15:07:23 |
| last_seen_at | DATETIME | 最后激活时间 | 2026-03-09 15:07:23 |
| created_at | DATETIME | 创建时间 | 2026-03-09 15:07:23 |
| updated_at | DATETIME | 更新时间 | 2026-03-09 15:07:23 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE KEY (license_id, device_id)
- INDEX idx_devices_license_id (license_id)

**说明**：
- 每个设备在首次激活时创建记录
- `active` 标志表示设备是否处于激活状态
- 同一许可证下的激活设备数量不能超过 `seats` 限制

### 数据库迁移

#### 添加 expires_at 字段

如果数据库中缺少 `expires_at` 字段，执行以下 SQL：

```sql
USE mindmap_license;
ALTER TABLE activation_keys
  ADD COLUMN expires_at DATETIME NULL,
  ADD INDEX idx_activation_keys_expires_at (expires_at);
```

#### 查看表结构

```sql
USE mindmap_license;
SHOW TABLES;
DESCRIBE activation_keys;
DESCRIBE licenses;
DESCRIBE devices;
```

#### 查询示例

```sql
-- 查看所有激活密钥
SELECT id, \`key\`, max_major, max_version, seats, disabled, expires_at 
FROM activation_keys;

-- 查看所有许可证
SELECT license_id, max_major, max_version, seats, created_at 
FROM licenses;

-- 查看所有设备
SELECT d.id, d.device_id, d.device_name, d.active, d.first_seen_at, d.last_seen_at, l.max_version
FROM devices d
JOIN licenses l ON d.license_id = l.license_id;

-- 查看许可证的设备数量
SELECT l.license_id, l.max_version, l.seats, COUNT(d.id) as device_count
FROM licenses l
LEFT JOIN devices d ON l.license_id = d.license_id AND d.active = 1
GROUP BY l.license_id;
```

## 配置文件说明

### .env.example
环境变量示例文件，包含：
- 服务器配置
- 数据库配置
- Redis 配置
- 许可证配置

## 文档阅读建议

- 快速上手优先看 `README.md` 与 `aliyun_quickstart.md`
- 生产环境以 `aliyun_deployment.md` 为准
- 故障与低内存卡顿优先看 `debug_fix_runbook.md`

### package.json
项目配置文件，包含：
- 项目元数据
- 依赖项
- 脚本命令

### tsconfig.json
TypeScript 配置文件，包含：
- 编译选项
- 路径别名
- 类型检查

### ecosystem.config.js
PM2 配置文件，包含：
- 应用配置
- 实例数量
- 环境变量

## 工作流程

### 激活流程

1. 客户端发送激活请求到 /activate
2. activate.controller.ts 接收请求
3. auth.middleware.ts 验证请求（如果需要）
4. activation.service.ts 处理激活逻辑
5. license.service.ts 创建或更新许可证
6. signature.service.ts 签名许可证
7. 返回签名许可证给客户端

### 刷新流程

1. 客户端发送刷新请求到 /refresh
2. activate.controller.ts 接收请求
3. signature.service.ts 验证签名
4. activation.service.ts 更新设备信息
5. license.service.ts 更新许可证
6. signature.service.ts 重新签名
7. 返回新签名许可证给客户端

### 管理员操作流程

1. 管理员发送请求到 /admin/*
2. admin.controller.ts 接收请求
3. auth.middleware.ts 验证管理员令牌
4. 相应的 service 处理业务逻辑
5. 返回结果给管理员

## 扩展建议

1. 添加用户认证和授权
2. 实现许可证过期机制
3. 添加使用统计和分析
4. 实现许可证转让功能
5. 添加支付集成
6. 实现多租户支持
7. 添加 Webhook 支持
8. 实现批量操作
9. 添加审计日志
10. 实现数据导出功能
