import { Request, Response, NextFunction } from 'express';
import { ActivationService } from '../services/activation.service';
import { validateActivationRequest, validateRefreshRequest } from '../utils/validation.utils';
import { logger } from '../utils/logger.utils';
import { AppError } from '../middleware/error.middleware';

export class ActivateController {
  /**
   * 激活许可证
   */
  static async activate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 验证请求数据
      const { error } = validateActivationRequest(req.body);
      if (error) {
        return next(
          new AppError('INVALID_REQUEST', error.details[0].message, 400, {
            field: error.details[0].path?.join('.'),
          })
        );
      }

      // 激活许可证
      const signed = await ActivationService.activate(req.body);

      res.json(signed);
    } catch (error) {
      logger.error('Error in activate controller:', error);
      next(error);
    }
  }

  /**
   * 刷新许可证
   */
  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 验证请求数据
      const { error } = validateRefreshRequest(req.body);
      if (error) {
        return next(
          new AppError('INVALID_REQUEST', error.details[0].message, 400, {
            field: error.details[0].path?.join('.'),
          })
        );
      }

      // 刷新许可证
      const signed = await ActivationService.refresh(req.body);

      res.json(signed);
    } catch (error) {
      logger.error('Error in refresh controller:', error);
      next(error);
    }
  }
}
