import rateLimit from 'express-rate-limit';
import { config } from '../config/app.config';

// 通用速率限制
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 每个 IP 在窗口期内最多 100 个请求
  message: {
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 严格速率限制（用于敏感操作）
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 10, // 每个 IP 在窗口期内最多 10 个请求
  message: {
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 激活密钥创建速率限制（管理员操作）
export const createKeyRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 小时
  max: 100, // 每小时最多创建 100 个密钥
  message: {
    error: 'Too many activation keys created, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 激活请求速率限制
export const activationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 小时
  max: 20, // 每小时最多 20 次激活请求
  message: {
    error: 'Too many activation attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
