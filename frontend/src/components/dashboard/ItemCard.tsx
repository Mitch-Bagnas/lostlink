import React from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ItemWithStats } from '../../types';
import { formatCategoryName, formatRelativeTime } from '../../utils/formatters';
import { 
  Wallet, 
  Briefcase, 
  CreditCard, 
  Smartphone, 
  BookOpen, 
  Box, 
  Bell, 
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Mail,
  PhoneCall
} from 'lucide-react';

interface ItemCardProps {
  item: ItemWithStats;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  const isLost = item.status === 'lost';
  const qrUrl = `${window.location.origin}/found/${item.qr_id}`;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Wallet':
        return <Wallet className="w-5 h-5" />;
      case 'Bag':
        return <Briefcase className="w-5 h-5" />;
      case 'ID':
        return <CreditCard className="w-5 h-5" />;
      case 'Gadget':
        return <Smartphone className="w-5 h-5" />;
      case 'School Supplies':
        return <BookOpen className="w-5 h-5" />;
      default:
        return <Box className="w-5 h-5" />;
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-line p-5 shadow-soft hover:shadow-lift hover:border-sky/40 transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Header: Category + Status Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-muted">
            <span className="p-2 rounded-xl bg-paper text-ink group-hover:bg-sky-light group-hover:text-sky transition-colors">
              {getCategoryIcon(item.category)}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider">
              {formatCategoryName(item.category)}
            </span>
          </div>

          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
              isLost
                ? 'bg-lost-light text-lost border border-lost/20'
                : 'bg-safe-light text-safe border border-safe/20'
            }`}
          >
            {isLost ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                LOST
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                SAFE
              </>
            )}
          </span>
        </div>

        {/* Item Info & QR Preview */}
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-ink truncate group-hover:text-sky transition-colors">
              {item.name}
            </h3>
            {item.description ? (
              <p className="text-xs text-muted line-clamp-2 mt-1 leading-relaxed">
                {item.description}
              </p>
            ) : (
              <p className="text-xs text-muted/60 italic mt-1">No description provided</p>
            )}

            {/* Notification alert chip if any */}
            {item.total_notifications_count > 0 && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-light text-sky text-xs font-semibold">
                <Bell className="w-3.5 h-3.5 fill-sky" />
                <span>
                  {item.unread_notifications_count > 0
                    ? `${item.unread_notifications_count} new alert${item.unread_notifications_count > 1 ? 's' : ''}`
                    : `${item.total_notifications_count} scan notice${item.total_notifications_count > 1 ? 's' : ''}`}
                </span>
              </div>
            )}
          </div>

          {/* QR Code Miniature */}
          <div className="shrink-0 p-2 bg-paper rounded-xl border border-line/60 group-hover:border-sky/30 transition-colors">
            <QRCodeSVG
              value={qrUrl}
              size={56}
              level="M"
              fgColor="#0A2540"
              bgColor="transparent"
            />
          </div>
        </div>
      </div>

      {/* Footer: Contact preference + View Detail button */}
      <div className="mt-5 pt-3.5 border-t border-line/70 flex items-center justify-between text-xs text-muted">
        <div className="flex items-center gap-1">
          {item.contact_method === 'email+phone' ? (
            <span className="flex items-center gap-1 text-[11px] font-medium text-ink bg-paper px-2 py-0.5 rounded-full">
              <PhoneCall className="w-3 h-3 text-sky" /> Email + SMS
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-medium text-muted bg-paper px-2 py-0.5 rounded-full">
              <Mail className="w-3 h-3" /> Email Only
            </span>
          )}
        </div>

        <Link
          to={`/items/${item.id}`}
          className="inline-flex items-center gap-1 font-semibold text-ink group-hover:text-sky transition-colors hover:underline"
        >
          <span>Manage & QR</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
