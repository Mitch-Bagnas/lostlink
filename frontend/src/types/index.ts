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
  phone: string | null;
  is_premium: boolean;
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
