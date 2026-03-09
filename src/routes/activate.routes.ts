import { Router } from 'express';
import { ActivateController } from '../controllers/activate.controller';
import { activationRateLimit } from '../middleware/ratelimit.middleware';

const router = Router();

// 激活许可证
router.post('/activate', activationRateLimit, ActivateController.activate);

// 刷新许可证
router.post('/refresh', activationRateLimit, ActivateController.refresh);

export default router;
