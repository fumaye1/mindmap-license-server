import Joi from 'joi';
import { config } from '../config/app.config';

// 激活请求验证
export const validateActivationRequest = (data: any) => {
  const schema = Joi.object({
    key: Joi.string().required().trim(),
    deviceId: Joi.string().required().trim(),
    deviceName: Joi.string().trim().allow(''),
    appVersion: Joi.string()
      .required()
      .trim()
      .pattern(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/),
  });

  return schema.validate(data);
};

// 刷新请求验证
export const validateRefreshRequest = (data: any) => {
  const schema = Joi.object({
    payloadB64: Joi.string().required().trim(),
    sigB64: Joi.string().required().trim(),
    deviceId: Joi.string().required().trim(),
    deviceName: Joi.string().trim().allow(''),
    appVersion: Joi.string()
      .required()
      .trim()
      .pattern(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/),
  });

  return schema.validate(data);
};

// 创建密钥请求验证
export const validateCreateKeyRequest = (data: any) => {
  const schema = Joi.object({
    maxVersion: Joi.string()
      .required()
      .trim()
      .pattern(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/),
    seats: Joi.number().integer().min(1).max(50).optional(),
    validDays: Joi.number().integer().min(1).max(3650).optional(),
    neverExpires: Joi.boolean().optional(),
  }).custom((value, helpers) => {
    if (value.neverExpires === true && value.validDays !== undefined) {
      return helpers.error('any.invalid', {
        message: 'neverExpires=true cannot be used with validDays',
      });
    }
    return value;
  });

  return schema.validate(data);
};

// 停用设备请求验证
export const validateDeactivateDeviceRequest = (data: any) => {
  const schema = Joi.object({
    licenseId: Joi.string().required().trim(),
    deviceId: Joi.string().required().trim(),
  });

  return schema.validate(data);
};

// 验证管理员令牌
export function validateAdminToken(token: string): boolean {
  const adminToken = String(config.ADMIN_TOKEN || '').trim();
  if (!adminToken) return false;
  return token === adminToken;
}

// 清理输入数据
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

// 验证许可证密钥格式
export function validateLicenseKey(key: string): boolean {
  const keyPattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return keyPattern.test(key);
}

// 验证设备 ID 格式
export function validateDeviceId(deviceId: string): boolean {
  // 设备 ID 应该是 1-128 个字符的字母数字或连字符
  const deviceIdPattern = /^[a-zA-Z0-9-]{1,128}$/;
  return deviceIdPattern.test(deviceId);
}
