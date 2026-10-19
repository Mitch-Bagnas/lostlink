import { ItemCategory } from '../types';

export function formatCategoryName(category: ItemCategory): string {
  switch (category) {
    case 'Wallet':
      return 'Wallet / Purse';
    case 'Bag':
      return 'Bag / Luggage';
    case 'ID':
      return 'ID / Cards';
    case 'Gadget':
      return 'Electronics / Gadget';
    case 'School Supplies':
      return 'School / Office Supplies';
    default:
      return 'Other Valuables';
  }
}

export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch (e) {
    return dateString;
  }
}

export function formatFullDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return dateString;
  }
}
