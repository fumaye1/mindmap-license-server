# Mindmap License Server (阿里云版本)

这是用于 Obsidian 思维导图插件的许可证服务器，专为阿里云轻量服务器设计。

## 特性

- 在线激活许可证 (`/activate`)
- 离线许可证验证（7天宽限期）
- 设备数量限制（可配置，默认3台设备）
- 版本授权（maxVersion，semver，包含上限）
- Ed25519 数字签名
- 完整的管理员 API
- 速率限制和安全防护

## 技术栈

- **后端**: Node.js + Express + TypeScript
- **数据库**: MySQL 8.0
- **缓存**: Redis
- **Web 服务器**: Nginx
- **进程管理**: PM2
- **安全**: HTTPS + Helmet + 速率限制

## 项目结构

```
mindmap-license-server/
├── src/                    # 源代码
│   ├── config/            # 配置文件
│   ├── controllers/       # 控制器
│   ├── middleware/       # 中间件
│   ├── models/          # 数据模型
│   ├── routes/         # 路由
│   ├── services/       # 业务逻辑
│   ├── types/         # 类型定义
│   ├── utils/         # 工具函数
│   └── app.ts        # 应用入口
├── scripts/          # 脚本
│   ├── setup.sh     # 服务器初始化
│   ├── deploy.sh    # 部署脚本
│   ├── backup.sh    # 备份脚本
│   ├── init-db.ts   # 数据库初始化
│   └── test-api.sh # API 测试
├── config/         # 配置文件
│   └── nginx.conf  # Nginx 配置
├── .env.example    # 环境变量示例
├── package.json    # 项目配置
└── README.md      # 项目说明
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入实际配置
```

### 3. 初始化数据库

```bash
npm run db:init
```

### 4. 生成密钥对

```bash
npm run gen:keys
```

将生成的密钥添加到 .env 文件中。

### 5. 本地运行

```bash
npm run dev
```

### 6. 构建

```bash
npm run build
```

### 7. 部署

```bash
# Linux/Mac
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# Windows
scripts\deploy.bat
```

## API 端点

### 公开端点

- `GET /health` - 健康检查
- `POST /activate` - 激活许可证
- `POST /refresh` - 刷新许可证

### 管理员端点（需要认证）

- `POST /admin/create-key` - 创建激活密钥
- `POST /admin/deactivate-device` - 停用设备
- `GET /admin/keys` - 获取所有激活密钥
- `GET /admin/licenses` - 获取所有许可证
- `GET /admin/devices` - 获取所有设备
- `GET /admin/licenses/:licenseId/devices` - 获取许可证的设备

## 部署到阿里云

详细部署指南请参阅 [ALIYUN_DEPLOYMENT.md](ALIYUN_DEPLOYMENT.md)

快速部署步骤：

1. 购买阿里云轻量服务器（Ubuntu 22.04）
2. 运行初始化脚本：
   ```bash
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```
3. 配置数据库和 Redis
4. 运行部署脚本：
   ```bash
   chmod +x scripts/deploy.sh
   ./scripts/deploy.sh
   ```
5. 配置 Nginx 和 SSL：
   ```bash
   chmod +x scripts/setup-ssl.sh
   ./scripts/setup-ssl.sh your-domain.com
   ```

## 测试

使用提供的测试脚本测试 API：

```bash
# Linux/Mac
chmod +x scripts/test-api.sh
./scripts/test-api.sh

# Windows
scripts	est-api.bat
```

## 备份

使用提供的备份脚本定期备份数据：

```bash
chmod +x scripts/backup.sh
./scripts/backup.sh
```

建议设置定时任务自动备份：

```bash
crontab -e
# 添加以下行（每天凌晨2点备份）
0 2 * * * /path/to/scripts/backup.sh
```

## 安全建议

1. 使用强密码和管理员令牌
2. 启用 HTTPS
3. 定期更新系统和依赖
4. 配置防火墙
5. 定期备份数据
6. 监控服务器日志

## 文档

- [ALIYUN_DESIGN.md](ALIYUN_DESIGN.md) - 设计文档
- [ALIYUN_DEPLOYMENT.md](ALIYUN_DEPLOYMENT.md) - 部署指南
- [ALIYUN_STRUCTURE.md](ALIYUN_STRUCTURE.md) - 项目结构
- [ALIYUN_QUICKSTART.md](ALIYUN_QUICKSTART.md) - 快速开始

## 许可证

MIT
