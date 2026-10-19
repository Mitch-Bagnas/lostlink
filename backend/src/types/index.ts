import { Request } from 'express';

export type ItemCategory = 
  | 'Wallet' 
  | 'Bag' 
  | 'ID' 
  | 'Gadget' 
  | 'School Supplies' 
  | 'Other';

export type ContactMethod = 'email' | 'email+phone';

export type ItemStatus = 'safe' | 'lost';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  phone: string | null;
  is_premium: boolean;
  created_at: Date;
}

export type SafeUser = Omit<User, 'password_hash'>;

export interface Item {
  id: string;
  qr_id: string;
  owner_id: string;
  name: string;
  category: ItemCategory;
  description: string | null;
  contact_method: ContactMethod;
  status: ItemStatus;
  created_at: Date;
  updated_at: Date;
}

export interface ItemWithNotificationStats extends Item {
  unread_notifications_count: number;
  total_notifications_count: number;
}

export interface Notification {
  id: string;
  item_id: string;
  finder_message: string | null;
  finder_contact: string | null;
  created_at: Date;
  read: boolean;
}

export interface AuthUserPayload {
  id: string;
  email: string;
  is_premium: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}
