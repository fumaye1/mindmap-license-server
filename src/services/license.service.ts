import { License, ActivationKey, Device } from '../models';
import { LicensePayload } from '../types';
import { SignatureService } from './signature.service';
import { logger } from '../utils/logger.utils';
import { config } from '../config/app.config';
import { randomKey, formatActivationKey } from '../utils/crypto.utils';
import { majorOf } from '../utils/version.utils';
import { AppError } from '../middleware/error.middleware';

export class LicenseService {
  /**
   * 创建激活密钥
   */
  static async createActivationKey(params: {
    maxVersion: string;
    seats?: number;
    validDays?: number;
    neverExpires?: boolean;
  }): Promise<{
    key: string;
    maxVersion: string;
    seats: number;
    expiresAt: string | null;
  }> {
    try {
      const raw = randomKey(16);
      const key = formatActivationKey(raw);

      const inferredMajor = majorOf(params.maxVersion);
      if (inferredMajor === null) {
        throw new AppError('INVALID_REQUEST', 'Invalid maxVersion', 400, { maxVersion: params.maxVersion });
      }

      const expiresAtDate = (() => {
        if (params.neverExpires === true) return null;
        if (typeof params.validDays === 'number') {
          const daysMs = params.validDays * 24 * 60 * 60 * 1000;
          return new Date(Date.now() + daysMs);
        }
        return null;
      })();

      const activationKey = await ActivationKey.create({
        key,
        maxMajor: inferredMajor,
        maxVersion: params.maxVersion,
        seats: params.seats ?? config.SEATS,
        disabled: false,
        expiresAt: expiresAtDate,
      });

      logger.info(`Created activation key: ${key}`);

      // NOTE: On some deployments/Sequelize configs, instance field access may not be populated
      // even though the insert succeeded. Return the known values to ensure API response is stable.
      const seats = params.seats ?? config.SEATS;

      return {
        key,
        maxVersion: params.maxVersion,
        seats,
        expiresAt: expiresAtDate ? expiresAtDate.toISOString() : null,
      };
    } catch (error) {
      logger.error('Error creating activation key:', error);
      throw error;
    }
  }

  /**
   * 获取激活密钥
   */
  static async getActivationKey(key: string): Promise<ActivationKey | null> {
    try {
      const activationKey = await ActivationKey.findOne({
        where: { key },
      });
      return activationKey;
    } catch (error) {
      logger.error('Error getting activation key:', error);
      throw error;
    }
  }

  /**
   * 创建许可证
   */
  static async createLicense(params: {
    maxMajor: number;
    maxVersion: string;
    seats: number;
  }): Promise<License> {
    try {
      const licenseId = `lic_${randomKey(20)}`;
      const issuedAt = Date.now();

      const license = await License.create({
        licenseId,
        maxMajor: params.maxMajor,
        maxVersion: params.maxVersion,
        seats: params.seats,
        issuedAt: new Date(issuedAt),
      });

      logger.info(`Created license: ${licenseId}`);

      return license;
    } catch (error) {
      logger.error('Error creating license:', error);
      throw error;
    }
  }

  /**
   * 获取许可证
   */
  static async getLicense(licenseId: string): Promise<License | null> {
    try {
      const license = await License.findOne({
        where: { licenseId },
      });
      return license;
    } catch (error) {
      logger.error('Error getting license:', error);
      throw error;
    }
  }

  /**
   * 签名许可证
   */
  static async signLicense(license: License): Promise<{
    payloadB64: string;
    sigB64: string;
  }> {
    try {
      const now = Date.now();
      const nextCheckAt = now + Number(config.OFFLINE_GRACE_DAYS) * 24 * 60 * 60 * 1000;

      const payload: LicensePayload = {
        licenseId: license.licenseId,
        seats: license.seats,
        maxVersion: license.maxVersion,
        nextCheckAt,
        maxMajor: license.maxMajor,
        issuedAt: license.issuedAt.getTime(),
      };

      const signed = SignatureService.signLicense(payload);
      return signed;
    } catch (error) {
      logger.error('Error signing license:', error);
      throw error;
    }
  }

  /**
   * 验证并刷新许可证
   */
  static async refreshLicense(payload: LicensePayload): Promise<{
    payloadB64: string;
    sigB64: string;
  }> {
    try {
      const license = await this.getLicense(payload.licenseId);
      if (!license) {
        throw new AppError('LICENSE_NOT_FOUND', 'License not found', 404, { licenseId: payload.licenseId });
      }

      return await this.signLicense(license);
    } catch (error) {
      logger.error('Error refreshing license:', error);
      throw error;
    }
  }

  /**
   * 停用设备
   */
  static async deactivateDevice(licenseId: string, deviceId: string): Promise<void> {
    try {
      const result = await Device.update(
        { active: false },
        {
          where: {
            licenseId,
            deviceId,
          },
        }
      );

      if (result[0] === 0) {
        throw new AppError('DEVICE_NOT_FOUND', 'Device not found', 404, { licenseId, deviceId });
      }

      logger.info(`Deactivated device ${deviceId} for license ${licenseId}`);
    } catch (error) {
      logger.error('Error deactivating device:', error);
      throw error;
    }
  }

  /**
   * 获取所有激活密钥
   */
  static async getAllActivationKeys(): Promise<ActivationKey[]> {
    try {
      const keys = await ActivationKey.findAll({
        order: [['createdAt', 'DESC']],
      });
      return keys;
    } catch (error) {
      logger.error('Error getting all activation keys:', error);
      throw error;
    }
  }

  /**
   * 获取所有许可证
   */
  static async getAllLicenses(): Promise<License[]> {
    try {
      const licenses = await License.findAll({
        order: [['createdAt', 'DESC']],
      });
      return licenses;
    } catch (error) {
      logger.error('Error getting all licenses:', error);
      throw error;
    }
  }

  /**
   * 获取所有设备
   */
  static async getAllDevices(): Promise<Device[]> {
    try {
      const devices = await Device.findAll({
        order: [['createdAt', 'DESC']],
      });
      return devices;
    } catch (error) {
      logger.error('Error getting all devices:', error);
      throw error;
    }
  }

  /**
   * 获取许可证的设备
   */
  static async getLicenseDevices(licenseId: string): Promise<Device[]> {
    try {
      const devices = await Device.findAll({
        where: { licenseId },
        order: [['createdAt', 'DESC']],
      });
      return devices;
    } catch (error) {
      logger.error('Error getting license devices:', error);
      throw error;
    }
  }
}
