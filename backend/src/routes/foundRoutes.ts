import { Router } from 'express';
import { getFoundItem, notifyOwner } from '../controllers/foundController';
import { validate } from '../middleware/validate';
import { notifyLimiter } from '../middleware/rateLimiter';
import { notifyOwnerSchema } from '../schemas/foundSchemas';

const router = Router();

// Public routes accessed by finders who scan the QR code
router.get('/:qrId', getFoundItem);
router.post('/:qrId/notify', notifyLimiter, validate(notifyOwnerSchema), notifyOwner);

export default router;
