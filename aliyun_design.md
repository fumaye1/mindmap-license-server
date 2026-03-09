# 阿里云轻量服务器部署方案设计文档

## 1. 项目概述

### 1.1 方案目标

本方案面向阿里云/轻量服务器部署形态，提供稳定可控的许可证/激活服务端，并保持以下能力：

- 在线激活许可证（/activate）
- 离线许可证验证（客户端离线宽限期）
- 设备数量限制（默认 3 台设备）
- 版本授权（maxVersion，semver，包含上限）

同时具备：

- 完全控制服务器和数据
- 更灵活的数据库选择
- 更好的性能和可扩展性
- 更容易集成其他服务

## 2. 技术选型

### 2.1 服务器配置

- **服务器类型**：阿里云轻量应用服务器
- **操作系统**：Ubuntu 22.04 LTS
- **配置建议**：
  - CPU：2核
  - 内存：2GB
  - 存储：40GB SSD
  - 带宽：3Mbps（可根据实际需求调整）

### 2.2 技术栈

#### 后端框架
- **Node.js + Express**：轻量级、高性能的 Web 框架
- **TypeScript**：类型安全，提高代码质量
- **PM2**：进程管理和自动重启

#### 数据库
- **MySQL 8.0**：成熟、稳定的关系型数据库
- **Sequelize**：ORM 框架，简化数据库操作

#### 安全
- **HTTPS**：使用 Let's Encrypt 免费证书
- **Nginx**：反向代理和负载均衡
- **Helmet**：安全头设置
- **Rate Limiting**：API 速率限制

#### 监控和日志
- **Winston**：日志管理
- **PM2 日志**：应用日志
- **Nginx 日志**：访问日志

## 3. 系统架构

### 3.1 架构图

```
客户端 (Obsidian 插件)
    ↓
    ↓ HTTPS
    ↓
Nginx (反向代理 + SSL)
    ↓
    ↓ HTTP
    ↓
Node.js + Express 应用
    ↓
    ↓
    ├─→ MySQL (许可证数据库)
    └─→ Redis (缓存和会话)
```

### 3.2 组件说明

#### Nginx
- 处理 HTTPS 连接
- 反向代理到 Node.js 应用
- 静态文件服务
- 负载均衡（未来扩展）

#### Node.js + Express
- API 端点处理
- 业务逻辑
- 数据验证
- 许可证签名和验证

#### MySQL
- 存储激活密钥
- 存储许可证信息
- 存储设备激活信息

#### Redis
- 缓存频繁访问的数据
- 会话管理
- 速率限制

## 4. 数据库设计

### 4.1 表结构

#### activation_keys（激活密钥表）

```sql
CREATE TABLE activation_keys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key VARCHAR(64) UNIQUE NOT NULL,
  license_id VARCHAR(64),
  max_major INT NOT NULL,
  seats INT NOT NULL DEFAULT 3,
  disabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_key (key),
  INDEX idx_license_id (license_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### licenses（许可证表）

```sql
CREATE TABLE licenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  license_id VARCHAR(64) UNIQUE NOT NULL,
  max_major INT NOT NULL,
  seats INT NOT NULL DEFAULT 3,
  issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_license_id (license_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### devices（设备表）

```sql
CREATE TABLE devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  license_id VARCHAR(64) NOT NULL,
  device_id VARCHAR(128) NOT NULL,
  device_name VARCHAR(255),
  first_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  INDEX idx_license_device (license_id, device_id),
  INDEX idx_license_active (license_id, active),
  FOREIGN KEY (license_id) REFERENCES licenses(license_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 4.2 数据库优化

- 添加适当的索引以提高查询性能
- 使用 InnoDB 引擎支持事务
- 定期备份数据库
- 监控数据库性能

## 5. API 设计

### 5.1 端点列表

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | /health | 健康检查 | 无 |
| POST | /activate | 激活许可证 | 无 |
| POST | /refresh | 刷新许可证 | 无 |
| POST | /admin/create-key | 创建激活密钥 | 管理员令牌 |
| POST | /admin/deactivate-device | 停用设备 | 管理员令牌 |
| GET | /admin/keys | 查看所有激活密钥 | 管理员令牌 |
| GET | /admin/licenses | 查看所有许可证 | 管理员令牌 |
| GET | /admin/devices | 查看所有设备 | 管理员令牌 |

### 5.2 请求/响应示例

#### POST /activate

请求：
```json
{
  "key": "ABCD-EFGH-IJKL-MNOP",
  "deviceId": "device-unique-id",
  "deviceName": "My Device",
  "appVersion": "0.2.5"
}
```

响应：
```json
{
  "payloadB64": "base64-encoded-payload",
  "sigB64": "base64-encoded-signature"
}
```

#### POST /admin/create-key

请求：
```json
{
  "maxVersion": "0.2.999",
  "seats": 3
}
```

响应：
```json
{
  "key": "ABCD-EFGH-IJKL-MNOP",
  "maxVersion": "0.2.999",
  "seats": 3
}
```

## 6. 安全考虑

### 6.1 传输安全
- 强制使用 HTTPS
- 配置强加密套件
- 启用 HSTS

### 6.2 认证和授权
- 使用强管理员令牌
- 实施 API 速率限制
- 验证所有输入数据

### 6.3 数据安全
- 加密敏感数据
- 定期备份数据库
- 限制数据库访问权限
- 使用环境变量存储密钥

### 6.4 日志和监控
- 记录所有 API 请求
- 监控异常活动
- 设置警报

## 7. 部署流程

### 7.1 服务器准备
1. 购买阿里云轻量服务器
2. 配置安全组（开放必要端口）
3. 更新系统软件
4. 安装必要软件（Node.js、MySQL、Nginx、Redis）

### 7.2 应用部署
1. 克隆代码仓库
2. 安装依赖
3. 配置环境变量
4. 初始化数据库
5. 使用 PM2 启动应用

### 7.3 Nginx 配置
1. 安装 SSL 证书
2. 配置反向代理
3. 配置静态文件服务
4. 启用 gzip 压缩

### 7.4 监控和维护
1. 配置日志轮转
2. 设置监控警报
3. 定期备份数据库
4. 更新软件和依赖

## 8. 成本估算

### 8.1 服务器成本
- 阿里云轻量服务器（2核2GB）：约 ¥60-100/月
- 域名：约 ¥50-100/年
- SSL 证书：免费（Let's Encrypt）

### 8.2 总成本
- 首年：约 ¥150-200
- 后续每年：约 ¥720-1200

## 9. 性能优化

### 9.1 应用层优化
- 使用缓存减少数据库查询
- 优化数据库查询
- 使用连接池
- 异步处理

### 9.2 服务器优化
- 调整 Nginx 配置
- 优化 MySQL 配置
- 启用 Redis 持久化
- 监控资源使用

## 10. 扩展性

### 10.1 水平扩展
- 使用负载均衡
- 部署多个应用实例
- 使用 Redis 共享会话

### 10.2 功能扩展
- 用户认证和授权
- 许可证过期机制
- 使用统计和分析
- 许可证转让功能
- 支付集成

## 11. 维护和监控

### 11.1 日常维护
- 监控服务器性能
- 检查应用日志
- 备份数据库
- 更新软件和依赖

### 11.2 故障处理
- 监控警报
- 自动重启
- 日志分析
- 快速恢复

## 12. 备份策略

### 12.1 数据库备份
- 每日自动备份
- 保留最近7天的备份
- 异地备份

### 12.2 应用备份
- 版本控制
- 配置文件备份
- 定期快照

## 13. 总结

本方案以阿里云/轻量服务器为部署目标，采用 Node.js + Express + MySQL 的后端架构，并通过 Nginx + HTTPS + PM2 提供稳定的运行环境。通过合理的架构设计和运维流程，可以在保持原有功能的同时，获得更好的控制力与可维护性。
