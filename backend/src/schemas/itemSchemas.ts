import { z } from 'zod';

const categoryEnum = z.enum([
  'Wallet',
  'Bag',
  'ID',
  'Gadget',
  'School Supplies',
  'Other',
]);

const contactMethodEnum = z.enum(['email', 'email+phone']);
const itemStatusEnum = z.enum(['safe', 'lost']);

export const createItemSchema = z.object({
  name: z.string().trim().min(1, 'Item name is required').max(100, 'Name must be under 100 characters'),
  category: categoryEnum,
  description: z.string().trim().max(1000).nullable().optional(),
  contact_method: contactMethodEnum.default('email'),
});

export const updateItemSchema = z.object({
  name: z.string().trim().min(1, 'Item name cannot be empty').max(100).optional(),
  category: categoryEnum.optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  contact_method: contactMethodEnum.optional(),
});

export const updateItemStatusSchema = z.object({
  status: itemStatusEnum,
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type UpdateItemStatusInput = z.infer<typeof updateItemStatusSchema>;
