import dotenv from 'dotenv';
import { Env } from '../types';

// 加载环境变量
dotenv.config();

function parseCsv(input: string | undefined): string[] {
  return String(input || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseBool(input: string | undefined, defaultValue: boolean): boolean {
  if (input === undefined) return defaultValue;
  const v = String(input).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(v)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(v)) return false;
  return defaultValue;
}

function parseTrustProxy(input: string | undefined, nodeEnv: 'development' | 'production'): number | boolean {
  if (input === undefined || String(input).trim() === '') {
    return nodeEnv === 'production' ? 1 : 0;
  }
  const v = String(input).trim().toLowerCase();
  if (v === 'true') return true;
  if (v === 'false') return false;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export const config: Env = {
  // 服务器配置
  PORT: parseInt(process.env.PORT || '3000', 10),
  HOST: process.env.HOST || ((process.env.NODE_ENV as any) === 'production' ? '127.0.0.1' : '0.0.0.0'),
  NODE_ENV: (process.env.NODE_ENV as 'development' | 'production') || 'development',
  TRUST_PROXY: parseTrustProxy(process.env.TRUST_PROXY, (process.env.NODE_ENV as any) === 'production' ? 'production' : 'development'),

  // CORS
  CORS_ORIGINS: parseCsv(process.env.CORS_ORIGINS),

  // 数据库配置
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '3306', 10),
  DB_NAME: process.env.DB_NAME || 'mindmap_license',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',

  // Redis 配置
  REDIS_ENABLED: parseBool(process.env.REDIS_ENABLED, true),
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,

  // 许可证配置
  LICENSE_PRIVATE_KEY_B64: process.env.LICENSE_PRIVATE_KEY_B64 || '',
  LICENSE_PUBLIC_KEY_B64: process.env.LICENSE_PUBLIC_KEY_B64 || '',
  ADMIN_TOKEN: process.env.ADMIN_TOKEN || '',
  SEATS: parseInt(process.env.SEATS || '3', 10),
  OFFLINE_GRACE_DAYS: parseInt(process.env.OFFLINE_GRACE_DAYS || '7', 10),
};

// 验证必需的环境变量
export function validateConfig(): void {
  const required: (keyof Env)[] = [
    'LICENSE_PRIVATE_KEY_B64',
    'LICENSE_PUBLIC_KEY_B64',
    'ADMIN_TOKEN',
  ];

  const missing = required.filter(key => !config[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
