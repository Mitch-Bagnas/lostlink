import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { ItemWithStats } from '../types';
import { StatCard } from '../components/dashboard/StatCard';
import { ItemCard } from '../components/dashboard/ItemCard';
import { UpsellBanner } from '../components/dashboard/UpsellBanner';
import { Button } from '../components/common/Button';
import { Spinner } from '../components/common/Spinner';
import { 
  Package, 
  ShieldCheck, 
  AlertTriangle, 
  Bell, 
  PlusCircle, 
  Sparkles,
  QrCode,
  Shield
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ItemWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient<{ items: ItemWithStats[] }>('/items');
      setItems(data.items || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load your belongings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Compute summary stats
  const totalItems = items.length;
  const safeItems = items.filter((i) => i.status === 'safe').length;
  const lostItems = items.filter((i) => i.status === 'lost').length;
  const totalNotifications = items.reduce(
    (sum, i) => sum + (i.total_notifications_count || 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
              Welcome, {user?.name || 'Friend'}!
            </h1>
            {user?.is_premium ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> PRO
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-paper border border-line text-muted">
                Free Plan ({totalItems}/3 items)
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted">
            Manage your registered belongings, download QR tags, and track scanner alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/items/new">
            <Button variant="primary" size="md" className="font-bold shadow-sm">
              <PlusCircle className="w-4 h-4 mr-2 text-sky" />
              Register Item
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Upsell Banner for Free Users approaching limit */}
      {!user?.is_premium && (
        <UpsellBanner currentCount={totalItems} maxFreeCount={3} />
      )}

      {/* 3. Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          label="Registered Items"
          value={totalItems}
          sublabel={!user?.is_premium ? `${3 - totalItems} remaining slots` : 'Unlimited'}
          icon={<Package className="w-5 h-5" />}
          variant="default"
        />
        <StatCard
          label="Safe & Secure"
          value={safeItems}
          sublabel="Items with you"
          icon={<ShieldCheck className="w-5 h-5" />}
          variant="safe"
        />
        <StatCard
          label="Marked Lost"
          value={lostItems}
          sublabel={lostItems > 0 ? 'Awaiting scanner return' : 'None reported'}
          icon={<AlertTriangle className="w-5 h-5" />}
          variant="lost"
        />
        <StatCard
          label="Scanner Alerts"
          value={totalNotifications}
          sublabel="Finder pings received"
          icon={<Bell className="w-5 h-5" />}
          variant="sky"
        />
      </div>

      {/* 4. Items Grid / Empty State */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">My Belongings ({totalItems})</h2>
          {totalItems > 0 && (
            <span className="text-xs text-muted">
              Click any item to view large QR, print tags, or change status.
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="min-h-[250px] flex flex-col items-center justify-center bg-white rounded-3xl border border-line p-12">
            <Spinner size="lg" />
            <p className="text-sm font-medium text-muted mt-3">Loading your items...</p>
          </div>
        ) : error ? (
          <div className="p-8 bg-white rounded-3xl border border-lost/30 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-lost mx-auto" />
            <p className="text-sm font-semibold text-ink">{error}</p>
            <Button variant="secondary" size="sm" onClick={fetchItems}>
              Retry Loading
            </Button>
          </div>
        ) : items.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl border border-line p-12 text-center space-y-5 max-w-lg mx-auto shadow-soft">
            <div className="w-16 h-16 rounded-3xl bg-sky-light text-sky flex items-center justify-center mx-auto shadow-sm">
              <QrCode className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-ink">No items registered yet</h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                Start by registering your wallet, laptop, backpack, or keys. You'll get an instant printable QR code for each item.
              </p>
            </div>
            <Link to="/items/new">
              <Button variant="sky" size="lg" className="font-bold shadow-md">
                <PlusCircle className="w-4 h-4 mr-2" />
                Register Your First Item
              </Button>
            </Link>
          </div>
        ) : (
          /* Grid of Items */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
