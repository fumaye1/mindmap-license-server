import { Router } from 'express';
import healthRoutes from './health.routes';
import activateRoutes from './activate.routes';
import adminRoutes from './admin.routes';

const router = Router();

// 健康检查路由
router.use('/', healthRoutes);

// 激活相关路由
router.use('/', activateRoutes);

// 管理员路由
router.use('/admin', adminRoutes);

export default router;
