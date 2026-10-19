import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { PaymentModal } from '../components/premium/PaymentModal';
import { 
  Crown, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Smartphone, 
  Printer, 
  Zap, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export const Premium: React.FC = () => {
  const { user, downgradeToFree } = useAuth();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDowngrading, setIsDowngrading] = useState(false);

  const handleDowngrade = async () => {
    if (!window.confirm('Are you sure you want to cancel your Premium subscription? Existing belongings remain active, but adding new items will be limited to 3.')) {
      return;
    }

    setIsDowngrading(true);
    try {
      await downgradeToFree();
      showToast('info', 'Subscription downgraded to Free plan.');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to downgrade subscription.');
    } finally {
      setIsDowngrading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold tracking-wide">
          <Crown className="w-4 h-4 text-amber-600" />
          <span>LOSTLINK PRO TIERS</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-ink tracking-tight">
          Protect Everything You Carry
        </h1>
        <p className="text-sm sm:text-base text-muted max-w-xl mx-auto leading-relaxed">
          Upgrade to LostLink Premium for only ₱50/month to unlock unlimited item protection, instant SMS alerts, and bulk tag sheets.
        </p>
      </div>

      {/* Active Subscription Banner if user is currently Premium */}
      {user?.is_premium && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-safe-light/80 to-white border border-safe/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-soft">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-safe text-white flex items-center justify-center shrink-0">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-ink">You are on LostLink Premium!</p>
              <p className="text-xs text-muted">
                Active monthly subscription (₱50/mo simulated). You have unlimited QR tags enabled.
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDowngrade}
            isLoading={isDowngrading}
            className="text-muted hover:text-lost hover:bg-lost-light shrink-0 text-xs"
          >
            Cancel / Downgrade to Free
          </Button>
        </div>
      )}

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* Free Plan */}
        <div className="rounded-3xl bg-white border border-line p-8 shadow-soft flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-paper text-muted uppercase tracking-wider">
              Free Tier
            </span>
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-ink">₱0</h2>
              <p className="text-xs text-muted">Standard protection for everyday essentials</p>
            </div>

            <ul className="space-y-3.5 pt-4 border-t border-line text-sm text-ink/80">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-safe shrink-0" />
                <span>Max <strong>3 registered belongings</strong></span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-safe shrink-0" />
                <span>Standard email scanner notifications</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-safe shrink-0" />
                <span>Single QR tag PNG downloads</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-safe shrink-0" />
                <span>Complete owner privacy protection</span>
              </li>
            </ul>
          </div>

          <div className="pt-4">
            {user && !user.is_premium ? (
              <div className="w-full py-2.5 rounded-full bg-paper border border-line text-xs font-bold text-center text-muted">
                Your Current Plan
              </div>
            ) : (
              <Button variant="secondary" size="md" className="w-full" disabled>
                Free Forever
              </Button>
            )}
          </div>
        </div>

        {/* Premium Plan */}
        <div className="relative rounded-3xl bg-ink text-white border-2 border-sky p-8 shadow-lift flex flex-col justify-between space-y-6">
          <div className="absolute top-4 right-6">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky text-white uppercase tracking-wider">
              RECOMMENDED
            </span>
          </div>

          <div className="space-y-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-sky uppercase tracking-wider">
              LostLink Premium
            </span>
            <div className="space-y-1">
              <div className="flex items-baseline gap-1">
                <h2 className="text-4xl font-black text-white">₱50</h2>
                <span className="text-xs text-white/60">/ month</span>
              </div>
              <p className="text-xs text-white/70">For laptops, tech accessories, school items, and travel luggage</p>
            </div>

            <ul className="space-y-3.5 pt-4 border-t border-white/10 text-sm text-white/90">
              <li className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-sky shrink-0" />
                <span><strong>Unlimited registered belongings</strong></span>
              </li>
              <li className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-sky shrink-0" />
                <span><strong>Email + Phone SMS Alerts</strong> (Dual Alert)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-sky shrink-0" />
                <span>Bulk printable tag & sticker sheets</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-sky shrink-0" />
                <span>Priority email relay dispatch</span>
              </li>
            </ul>
          </div>

          <div className="pt-4">
            {user?.is_premium ? (
              <div className="w-full py-2.5 rounded-full bg-white/10 text-xs font-bold text-center text-sky">
                ✓ Premium Active
              </div>
            ) : (
              <Button
                variant="sky"
                size="lg"
                onClick={() => setIsModalOpen(true)}
                className="w-full font-bold shadow-md hover:scale-105"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Upgrade Now (₱50/mo)
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
};
