import { z } from 'zod';

export const updateUserStatusSchema = z.object({
  status: z.enum(['active', 'suspended'], {
    required_error: 'Status is required and must be either active or suspended',
  }),
  reason: z.string().trim().max(500, 'Suspension reason cannot exceed 500 characters').optional(),
});

export const updateUserPremiumSchema = z.object({
  isPremium: z.boolean({
    required_error: 'isPremium boolean is required',
  }),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['user', 'admin'], {
    required_error: 'Role is required and must be either user or admin',
  }),
});

export const adminUserQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(['active', 'suspended']).optional(),
  role: z.enum(['user', 'admin']).optional(),
  premium: z.enum(['true', 'false']).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

export const adminItemQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(['safe', 'lost']).optional(),
  category: z.string().optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

export const adminNotificationQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

export const adminAuditLogQuerySchema = z.object({
  action: z.string().trim().optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});
