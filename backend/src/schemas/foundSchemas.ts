import { z } from 'zod';

export const notifyOwnerSchema = z.object({
  message: z.string().trim().max(500, 'Message cannot exceed 500 characters').nullable().optional(),
  finder_contact: z.string().trim().max(100, 'Contact info cannot exceed 100 characters').nullable().optional(),
});

export type NotifyOwnerInput = z.infer<typeof notifyOwnerSchema>;
