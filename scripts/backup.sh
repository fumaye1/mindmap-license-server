#!/bin/bash

# 备份脚本 - mindmap-license-server

set -e

# 配置
BACKUP_DIR="/var/backups/mindmap_license"
RETENTION_DAYS=7
DATE=$(date +%Y%m%d_%H%M%S)

# 从环境变量读取数据库配置
DB_NAME="${DB_NAME:-mindmap_license}"
DB_USER="${DB_USER:-license_user}"
DB_PASSWORD="${DB_PASSWORD:-}"

# 创建备份目录
mkdir -p $BACKUP_DIR

echo "=== Mindmap License Server 备份 ==="
echo "备份时间: $(date)"
echo ""

# 1. 备份数据库
echo "步骤 1/3: 备份数据库..."
DB_BACKUP_FILE="$BACKUP_DIR/db_$DATE.sql"
mysqldump -u $DB_USER -p"$DB_PASSWORD" $DB_NAME > $DB_BACKUP_FILE
echo "✓ 数据库备份完成: $DB_BACKUP_FILE"
echo ""

# 2. 压缩备份
echo "步骤 2/3: 压缩备份..."
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.tar.gz"
tar -czf $BACKUP_FILE -C $BACKUP_DIR db_$DATE.sql
rm $DB_BACKUP_FILE
echo "✓ 备份压缩完成: $BACKUP_FILE"
echo ""

# 3. 清理旧备份
echo "步骤 3/3: 清理旧备份..."
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete
echo "✓ 旧备份清理完成"
echo ""

echo "=== 备份完成 ==="
echo "备份文件: $BACKUP_FILE"
echo "保留天数: $RETENTION_DAYS"
