import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, validateConfig } from './config/app.config';
import { connectDatabase, closeDatabase } from './config/database.config';
import { connectRedis, closeRedis } from './config/redis.config';
import { logger, requestLogger } from './utils/logger.utils';
import { AppError, errorHandler, notFoundHandler } from './middleware/error.middleware';
import { generalRateLimit } from './middleware/ratelimit.middleware';
import routes from './routes';

export class App {
  private app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // 安全头
    this.app.use(helmet());

    // Nginx/反代场景：使 req.ip / rate-limit 使用真实客户端 IP
    this.app.set('trust proxy', config.TRUST_PROXY);

    // CORS
    this.app.use(
      cors({
        origin: (origin, cb) => {
          // 非浏览器/本地请求通常没有 Origin（例如 Obsidian 桌面端部分请求），默认放行
          if (!origin) return cb(null, true);

          // 未配置白名单时，为避免误伤，默认放行（推荐生产配置 CORS_ORIGINS）
          if (!config.CORS_ORIGINS || config.CORS_ORIGINS.length === 0) return cb(null, true);

          const allowed = config.CORS_ORIGINS.includes(origin);
          if (allowed) return cb(null, true);
          return cb(new AppError('CORS_BLOCKED', 'CORS blocked', 403, { origin }));
        },
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        maxAge: 86400,
      })
    );

    // 请求体解析
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // 速率限制
    this.app.use(generalRateLimit);

    // 请求日志
    this.app.use(requestLogger);
  }

  private initializeRoutes(): void {
    this.app.use('/', routes);
  }

  private initializeErrorHandling(): void {
    // 404 处理
    this.app.use(notFoundHandler);

    // 错误处理
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // 验证配置
      validateConfig();

      // 连接数据库
      await connectDatabase();

      // 连接 Redis
      await connectRedis();

      // 启动服务器
      this.app.listen(config.PORT, config.HOST, () => {
        logger.info(`Server is running on ${config.HOST}:${config.PORT}`);
        logger.info(`Environment: ${config.NODE_ENV}`);
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    try {
      await closeDatabase();
      await closeRedis();
      logger.info('Server stopped gracefully');
    } catch (error) {
      logger.error('Error stopping server:', error);
      process.exit(1);
    }
  }

  public getApp(): Application {
    return this.app;
  }
}

// 创建应用实例
const app = new App();

// 启动应用
if (require.main === module) {
  app.start();
}

// 优雅关闭
process.on('SIGTERM', () => app.stop());
process.on('SIGINT', () => app.stop());

export default app;
