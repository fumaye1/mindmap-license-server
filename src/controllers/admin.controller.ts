import { Request, Response, NextFunction } from 'express';
import { LicenseService } from '../services/license.service';
import { validateCreateKeyRequest, validateDeactivateDeviceRequest } from '../utils/validation.utils';
import { logger } from '../utils/logger.utils';
import { AppError } from '../middleware/error.middleware';

export class AdminController {
  /**
   * 创建激活密钥
   */
  static async createKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 验证请求数据
      const { error } = validateCreateKeyRequest(req.body);
      if (error) {
        return next(
          new AppError('INVALID_REQUEST', error.details[0].message, 400, {
            field: error.details[0].path?.join('.'),
          })
        );
      }

      // 创建激活密钥
      const result = await LicenseService.createActivationKey({
        maxVersion: req.body.maxVersion,
        seats: req.body.seats,
        validDays: req.body.validDays,
        neverExpires: req.body.neverExpires,
      });

      res.json(result);
    } catch (error) {
      logger.error('Error in createKey controller:', error);
      next(error);
    }
  }

  /**
   * 停用设备
   */
  static async deactivateDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 验证请求数据
      const { error } = validateDeactivateDeviceRequest(req.body);
      if (error) {
        return next(
          new AppError('INVALID_REQUEST', error.details[0].message, 400, {
            field: error.details[0].path?.join('.'),
          })
        );
      }

      // 停用设备
      await LicenseService.deactivateDevice(req.body.licenseId, req.body.deviceId);

      res.json({ ok: true });
    } catch (error) {
      logger.error('Error in deactivateDevice controller:', error);
      next(error);
    }
  }

  /**
   * 获取所有激活密钥
   */
  static async getAllKeys(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const keys = await LicenseService.getAllActivationKeys();
      res.json(keys);
    } catch (error) {
      logger.error('Error in getAllKeys controller:', error);
      next(error);
    }
  }

  /**
   * 获取所有许可证
   */
  static async getAllLicenses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const licenses = await LicenseService.getAllLicenses();
      res.json(licenses);
    } catch (error) {
      logger.error('Error in getAllLicenses controller:', error);
      next(error);
    }
  }

  /**
   * 获取所有设备
   */
  static async getAllDevices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const devices = await LicenseService.getAllDevices();
      res.json(devices);
    } catch (error) {
      logger.error('Error in getAllDevices controller:', error);
      next(error);
    }
  }

  /**
   * 获取许可证的设备
   */
  static async getLicenseDevices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { licenseId } = req.params;

      if (!licenseId) {
        return next(new AppError('INVALID_REQUEST', 'License ID is required', 400));
      }

      const devices = await LicenseService.getLicenseDevices(licenseId);
      res.json(devices);
    } catch (error) {
      logger.error('Error in getLicenseDevices controller:', error);
      next(error);
    }
  }
}
