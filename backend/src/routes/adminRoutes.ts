import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { adminLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';
import {
  updateUserStatusSchema,
  updateUserPremiumSchema,
  updateUserRoleSchema,
  adminUserQuerySchema,
  adminItemQuerySchema,
  adminNotificationQuerySchema,
  adminAuditLogQuerySchema,
} from '../schemas/adminSchemas';
import {
  getStats,
  getUsers,
  getUserDetail,
  updateUserStatus,
  updateUserPremium,
  updateUserRole,
  resetUserPassword,
  deleteUser,
  getItems,
  deleteItem,
  getNotifications,
  getAuditLogs,
} from '../controllers/adminController';

const router = Router();

// Protect ALL routes in this router with requireAuth, requireAdmin, and admin rate limiter
router.use(requireAuth, requireAdmin, adminLimiter);

// 1. Dashboard statistics & signup trends
router.get('/stats', getStats);

// 2. User management routes
router.get('/users', validate(adminUserQuerySchema, 'query'), getUsers);
router.get('/users/:id', getUserDetail);
router.patch('/users/:id/status', validate(updateUserStatusSchema), updateUserStatus);
router.patch('/users/:id/premium', validate(updateUserPremiumSchema), updateUserPremium);
router.patch('/users/:id/role', validate(updateUserRoleSchema), updateUserRole);
router.post('/users/:id/reset-password', resetUserPassword);
router.delete('/users/:id', deleteUser);

// 3. Item moderation routes
router.get('/items', validate(adminItemQuerySchema, 'query'), getItems);
router.delete('/items/:id', deleteItem);

// 4. Abuse review for scanner notifications
router.get('/notifications', validate(adminNotificationQuerySchema, 'query'), getNotifications);

// 5. Audit trail
router.get('/audit-logs', validate(adminAuditLogQuerySchema, 'query'), getAuditLogs);

export default router;
