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

export type UserRole = 'user' | 'admin';

export type UserStatus = 'active' | 'suspended';

export type AuthProvider = 'local' | 'google';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string | null;
  phone: string | null;
  is_premium: boolean;
  role: UserRole;
  status: UserStatus;
  suspended_reason: string | null;
  last_login_at: Date | null;
  password_changed_at: Date;
  must_change_password: boolean;
  google_id: string | null;
  auth_provider: AuthProvider;
  created_at: Date;
}

export type SafeUser = Omit<User, 'password_hash'> & { has_password: boolean };

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

export interface AuditLog {
  id: string;
  admin_id: string | null;
  admin_email: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, any>;
  created_at: Date;
}

export interface AdminStats {
  totalUsers: number;
  premiumUsers: number;
  suspendedUsers: number;
  totalItems: number;
  lostItems: number;
  notifications7d: number;
  notifications30d: number;
  signupsPerDay: Array<{ date: string; count: number }>;
}

export interface AuthUserPayload {
  id: string;
  email: string;
  is_premium: boolean;
  role: UserRole;
  status: UserStatus;
  must_change_password: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}
