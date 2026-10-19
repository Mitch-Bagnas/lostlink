import { Router } from 'express';
import { markNotificationRead } from '../controllers/notificationsController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.patch('/:id/read', markNotificationRead);

export default router;
