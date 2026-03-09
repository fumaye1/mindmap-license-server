// 类型定义

export interface Env {
  // 服务器配置
  PORT: number;
  HOST: string;
  NODE_ENV: 'development' | 'production';
  TRUST_PROXY: number | boolean;

  // CORS
  CORS_ORIGINS: string[];

  // 数据库配置
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;

  // Redis 配置
  REDIS_ENABLED: boolean;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;

  // 许可证配置
  LICENSE_PRIVATE_KEY_B64: string;
  LICENSE_PUBLIC_KEY_B64: string;
  ADMIN_TOKEN: string;
  SEATS: number;
  OFFLINE_GRACE_DAYS: number;
}

export interface SignedLicense {
  payloadB64: string;
  sigB64: string;
}

export interface LicensePayload {
  licenseId: string;
  seats: number;
  maxVersion: string;
  nextCheckAt: number;
  /** @deprecated kept for backward compatibility */
  maxMajor?: number;
  issuedAt: number;
  customerId?: string;
  orderId?: string;
}

export interface ActivationRequest {
  key: string;
  deviceId: string;
  deviceName: string;
  appVersion: string;
}

export interface RefreshRequest {
  payloadB64: string;
  sigB64: string;
  deviceId: string;
  deviceName: string;
  appVersion: string;
}

export interface CreateKeyRequest {
  maxVersion: string;
  seats?: number;
}

export interface DeactivateDeviceRequest {
  licenseId: string;
  deviceId: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
