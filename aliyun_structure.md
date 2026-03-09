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
│   │   ├── activationKey.model.ts
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
├── README.md               # 项目说明
├── aliyun_design.md        # 设计文档
├── aliyun_deployment.md    # 部署指南
├── hk_light_server_runbook.md # 香港轻量服务器 Runbook
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
- 初始化数据库

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

## 配置文件说明

### .env.example
环境变量示例文件，包含：
- 服务器配置
- 数据库配置
- Redis 配置
- 许可证配置

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
