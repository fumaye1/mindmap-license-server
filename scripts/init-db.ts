import { sequelize } from '../src/config/database.config';
import { ActivationKey, License, Device } from '../src/models';
import { logger } from '../src/utils/logger.utils';

async function initDatabase() {
  try {
    logger.info('Starting database initialization...');

    // 测试数据库连接
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');

    // 同步所有模型（小规模项目：允许自动新增字段，例如 max_version）
    await sequelize.sync({ force: false, alter: true });
    logger.info('Database models synchronized successfully.');

    logger.info('Database initialization completed.');
    process.exit(0);
  } catch (error) {
    logger.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();
