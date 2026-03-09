import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';

const router = Router();

// 健康检查
router.get('/health', HealthController.check);

export default router;
