import { Request, Response } from 'express';
import { logger } from '../utils/logger.utils';

export class HealthController {
  /**
   * 健康检查
   */
  static async check(req: Request, res: Response): Promise<void> {
    try {
      res.json({
        ok: true,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    } catch (error) {
      logger.error('Health check failed:', error);
      res.status(500).json({
        ok: false,
        error: 'Health check failed',
      });
    }
  }
}
