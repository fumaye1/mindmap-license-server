import { ActivationKey, Device } from '../models';
import { LicenseService } from './license.service';
import { SignatureService } from './signature.service';
import { logger } from '../utils/logger.utils';
import { ActivationRequest, RefreshRequest, SignedLicense } from '../types';
import { AppError } from '../middleware/error.middleware';
import { isVersionAllowed } from '../utils/version.utils';

export class ActivationService {
  /**
   * 激活许可证
   */
  static async activate(request: ActivationRequest): Promise<SignedLicense> {
    try {
      // 1. 验证激活密钥
      const activationKey = await ActivationKey.findOne({
        where: { key: request.key },
      });

      if (!activationKey) {
        throw new AppError('ACTIVATION_KEY_NOT_FOUND', 'Invalid activation key', 404);
      }

      if (activationKey.disabled) {
        throw new AppError('ACTIVATION_KEY_DISABLED', 'Activation key disabled', 403);
      }

      if (activationKey.expiresAt && Date.now() > new Date(activationKey.expiresAt).getTime()) {
        throw new AppError('ACTIVATION_KEY_EXPIRED', 'Activation key expired', 403, {
          expiresAt: new Date(activationKey.expiresAt).toISOString(),
        });
      }

      // 1.1 校验版本是否在授权范围内
      logger.debug(`Checking version: appVersion=${request.appVersion}, maxVersion=${activationKey.maxVersion}, maxMajor=${activationKey.maxMajor}`);
      if (!isVersionAllowed({ current: request.appVersion, max: activationKey.maxVersion })) {
        logger.error(`Version check failed: appVersion=${request.appVersion}, maxVersion=${activationKey.maxVersion}, maxMajor=${activationKey.maxMajor}`);
        throw new AppError('VERSION_NOT_ALLOWED', 'App version not allowed by this activation key', 403, {
          appVersion: request.appVersion,
          maxVersion: activationKey.maxVersion,
        });
      }

      // 2. 获取或创建许可证
      let licenseId = activationKey.licenseId;
      if (!licenseId) {
        const license = await LicenseService.createLicense({
          maxMajor: activationKey.maxMajor,
          maxVersion: activationKey.maxVersion,
          seats: activationKey.seats,
        });
        licenseId = license.licenseId;

        // 更新激活密钥的许可证 ID
        await activationKey.update({ licenseId });
      }

      // 3. 确保设备座位
      await this.ensureDeviceSeat({
        licenseId,
        deviceId: request.deviceId,
        deviceName: request.deviceName,
        seats: activationKey.seats,
      });

      // 4. 获取许可证并签名
      const license = await LicenseService.getLicense(licenseId);
      if (!license) {
        throw new AppError('LICENSE_NOT_FOUND', 'License not found', 404);
      }

      // 4.1 二次校验（按 license 为准）
      logger.debug(`Checking version (license): appVersion=${request.appVersion}, maxVersion=${license.maxVersion}, maxMajor=${license.maxMajor}`);
      if (!isVersionAllowed({ current: request.appVersion, max: license.maxVersion })) {
        logger.error(`Version check failed (license): appVersion=${request.appVersion}, maxVersion=${license.maxVersion}, maxMajor=${license.maxMajor}`);
        throw new AppError('VERSION_NOT_ALLOWED', 'App version not allowed by this license', 403, {
          appVersion: request.appVersion,
          maxVersion: license.maxVersion,
        });
      }

      const signed = await LicenseService.signLicense(license);

      logger.info(`Activated license ${licenseId} for device ${request.deviceId}`);

      return signed;
    } catch (error) {
      logger.error('Error activating license:', error);
      throw error;
    }
  }

  /**
   * 刷新许可证
   */
  static async refresh(request: RefreshRequest): Promise<SignedLicense> {
    try {
      // 1. 验证签名
      let payload;
      try {
        payload = SignatureService.verifySigned({
          payloadB64: request.payloadB64,
          sigB64: request.sigB64,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Invalid license signature';
        if (msg.includes('Invalid signature')) {
          throw new AppError('INVALID_SIGNATURE', 'Invalid license signature', 403);
        }
        if (msg.includes('Invalid payload')) {
          throw new AppError('INVALID_PAYLOAD', 'Invalid license payload', 400);
        }
        throw new AppError('INVALID_SIGNED_LICENSE', 'Invalid signed license', 400);
      }

      // 2. 获取许可证
      const license = await LicenseService.getLicense(payload.licenseId);
      if (!license) {
        throw new AppError('LICENSE_NOT_FOUND', 'License not found', 404);
      }

      // 2.1 校验版本是否在授权范围内
      logger.debug(`Checking version for refresh: appVersion=${request.appVersion}, maxVersion=${license.maxVersion}, maxMajor=${license.maxMajor}`);
      if (!isVersionAllowed({ current: request.appVersion, max: license.maxVersion })) {
        logger.error(`Version check failed for refresh: appVersion=${request.appVersion}, maxVersion=${license.maxVersion}, maxMajor=${license.maxMajor}`);
        throw new AppError('VERSION_NOT_ALLOWED', 'App version not allowed by this license', 403, {
          appVersion: request.appVersion,
          maxVersion: license.maxVersion,
        });
      }

      // 3. 确保设备座位
      await this.ensureDeviceSeat({
        licenseId: license.licenseId,
        deviceId: request.deviceId,
        deviceName: request.deviceName,
        seats: license.seats,
      });

      // 4. 重新签名许可证
      const signed = await LicenseService.signLicense(license);

      logger.info(`Refreshed license ${license.licenseId} for device ${request.deviceId}`);

      return signed;
    } catch (error) {
      logger.error('Error refreshing license:', error);
      throw error;
    }
  }

  /**
   * 确保设备座位
   */
  private static async ensureDeviceSeat(params: {
    licenseId: string;
    deviceId: string;
    deviceName?: string | null;
    seats: number;
  }): Promise<void> {
    try {
      // 检查设备是否已激活
      const existingDevice = await Device.findOne({
        where: {
          licenseId: params.licenseId,
          deviceId: params.deviceId,
        },
      });

      const isAlreadyActive = existingDevice && existingDevice.active;

      // 如果设备未激活，检查座位限制
      if (!isAlreadyActive) {
        const activeCount = await Device.count({
          where: {
            licenseId: params.licenseId,
            active: true,
          },
        });

        if (activeCount >= params.seats) {
          throw new AppError('SEATS_EXCEEDED', 'Device limit reached. Deactivate another device first.', 409, {
            seats: params.seats,
            licenseId: params.licenseId,
          });
        }
      }

      // 创建或更新设备记录
      const now = new Date();
      await Device.upsert({
        licenseId: params.licenseId,
        deviceId: params.deviceId,
        deviceName: params.deviceName ?? null,
        firstSeenAt: existingDevice?.firstSeenAt || now,
        lastSeenAt: now,
        active: true,
      });

      logger.info(`Ensured device seat for ${params.deviceId} on license ${params.licenseId}`);
    } catch (error) {
      logger.error('Error ensuring device seat:', error);
      throw error;
    }
  }
}
