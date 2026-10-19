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

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  is_premium: boolean;
  role: UserRole;
  status: UserStatus;
  suspended_reason?: string | null;
  must_change_password?: boolean;
  last_login_at?: string | null;
  created_at: string;
}

export interface Item {
  id: string;
  qr_id: string;
  owner_id: string;
  name: string;
  category: ItemCategory;
  description: string | null;
  contact_method: ContactMethod;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
}

export interface ItemWithStats extends Item {
  total_notifications_count: number;
  unread_notifications_count: number;
}

export interface Notification {
  id: string;
  item_id: string;
  finder_message: string | null;
  finder_contact: string | null;
  created_at: string;
  read: boolean;
}

export interface PublicFoundItem {
  qr_id: string;
  name: string;
  category: ItemCategory;
  status: ItemStatus;
}

export interface ApiErrorResponse {
  error: string;
  message?: string;
  details?: Array<{ field: string; message: string }>;
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

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  is_premium: boolean;
  role: UserRole;
  status: UserStatus;
  suspended_reason: string | null;
  must_change_password: boolean;
  last_login_at: string | null;
  created_at: string;
  items_count: number;
}

export interface AdminUserDetail {
  user: AdminUserListItem;
  items: Array<{
    id: string;
    qr_id: string;
    name: string;
    category: string;
    status: ItemStatus;
    contact_method: string;
    created_at: string;
  }>;
  notifications: Array<{
    id: string;
    item_name: string;
    qr_id: string;
    finder_message: string | null;
    finder_contact: string | null;
    read: boolean;
    created_at: string;
  }>;
}

export interface AdminItemListItem {
  id: string;
  qr_id: string;
  owner_id: string;
  name: string;
  category: string;
  description: string | null;
  contact_method: string;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
  owner_email: string;
  owner_name: string;
  notifications_count: number;
}

export interface AdminNotificationListItem {
  id: string;
  item_id: string;
  finder_message: string | null;
  finder_contact: string | null;
  read: boolean;
  created_at: string;
  item_name: string;
  item_qr_id: string;
  owner_email: string;
  owner_name: string;
}

export interface AuditLogListItem {
  id: string;
  admin_id: string | null;
  admin_email: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, any>;
  created_at: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
