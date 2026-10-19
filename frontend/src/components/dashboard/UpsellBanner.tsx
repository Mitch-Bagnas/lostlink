import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../common/Button';

interface UpsellBannerProps {
  currentCount: number;
  maxFreeCount?: number;
}

export const UpsellBanner: React.FC<UpsellBannerProps> = ({ currentCount, maxFreeCount = 3 }) => {
  const isAtLimit = currentCount >= maxFreeCount;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-ink via-[#0d3156] to-ink p-6 sm:p-8 text-white shadow-lift border border-sky/20">
      {/* Background glow effect */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-sky/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-sky text-xs font-bold tracking-wide backdrop-blur-sm">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>LOSTLINK PREMIUM — ₱50 / MONTH</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {isAtLimit ? 'Free tier limit reached (3 of 3 items used)' : 'Need more QR tags for your gear?'}
          </h2>
          <p className="text-sm text-white/80 leading-relaxed">
            {isAtLimit
              ? 'You have registered the maximum of 3 belongings on the Free tier. Upgrade to Premium for unlimited items, instant SMS alerts, and bulk printable sheets.'
              : 'Upgrade to LostLink Premium to unlock unlimited belongings, phone SMS alerts, and high-res printable tag sheets for just ₱50/month.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <Link to="/premium">
            <Button
              variant="sky"
              size="lg"
              className="w-full sm:w-auto font-bold shadow-md hover:scale-105"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade for ₱50/mo
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
