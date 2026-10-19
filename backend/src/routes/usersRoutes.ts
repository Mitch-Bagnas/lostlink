import { Router } from 'express';
import { updateProfile, updatePassword, upgradeToPremium, downgradeToFree } from '../controllers/usersController';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateProfileSchema, updatePasswordSchema, mockUpgradeSchema } from '../schemas/userSchemas';

const router = Router();

router.use(requireAuth);

router.patch('/me', validate(updateProfileSchema), updateProfile);
router.patch('/me/password', validate(updatePasswordSchema), updatePassword);
router.post('/me/upgrade', validate(mockUpgradeSchema), upgradeToPremium);
router.post('/me/downgrade', downgradeToFree);

export default router;
