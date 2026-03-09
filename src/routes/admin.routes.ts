import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { requireAdmin } from '../middleware/auth.middleware';
import { createKeyRateLimit, strictRateLimit } from '../middleware/ratelimit.middleware';

const router = Router();

// 所有管理员路由都需要认证
router.use(requireAdmin);

// 创建激活密钥
router.post('/create-key', createKeyRateLimit, AdminController.createKey);

// 停用设备
router.post('/deactivate-device', strictRateLimit, AdminController.deactivateDevice);

// 获取所有激活密钥
router.get('/keys', AdminController.getAllKeys);

// 获取所有许可证
router.get('/licenses', AdminController.getAllLicenses);

// 获取所有设备
router.get('/devices', AdminController.getAllDevices);

// 获取许可证的设备
router.get('/licenses/:licenseId/devices', AdminController.getLicenseDevices);

export default router;
