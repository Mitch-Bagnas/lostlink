import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
  phone: z.string().trim().max(30).nullable().optional(),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const mockUpgradeSchema = z.object({
  plan: z.string().optional().default('monthly_50php'),
  paymentMethod: z.enum(['gcash', 'maya', 'card']).optional().default('gcash'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type MockUpgradeInput = z.infer<typeof mockUpgradeSchema>;
