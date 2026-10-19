import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiClient, ApiError } from '../api/client';
import { ItemCategory, ContactMethod, Item } from '../types';
import { Button } from '../components/common/Button';
import { PaymentModal } from '../components/premium/PaymentModal';
import { 
  Wallet, 
  Briefcase, 
  CreditCard, 
  Smartphone, 
  BookOpen, 
  Box, 
  Crown, 
  Mail, 
  PhoneCall, 
  ArrowLeft,
  Shield,
  Sparkles
} from 'lucide-react';

export const ItemNew: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ItemCategory>('Wallet');
  const [description, setDescription] = useState('');
  const [contactMethod, setContactMethod] = useState<ContactMethod>('email');

  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingCount, setIsCheckingCount] = useState(true);
  const [itemCount, setItemCount] = useState<number>(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Check current item count to proactively warn if at free limit
  useEffect(() => {
    async function checkLimit() {
      try {
        const data = await apiClient<{ items: Item[] }>('/items');
        setItemCount(data.items.length);
      } catch (err) {
        // silent fail
      } finally {
        setIsCheckingCount(false);
      }
    }
    checkLimit();
  }, []);

  const isAtFreeLimit = !user?.is_premium && itemCount >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isAtFreeLimit) {
      setShowUpgradeModal(true);
      return;
    }

    if (contactMethod === 'email+phone' && !user?.is_premium) {
      setShowUpgradeModal(true);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient<{ item: Item; message: string }>('/items', {
        method: 'POST',
        body: JSON.stringify({
          name,
          category,
          description: description.trim() || undefined,
          contact_method: contactMethod,
        }),
      });

      showToast('success', 'Belonging registered! Your QR code is ready.');
      navigate(`/items/${response.item.id}`);
    } catch (err: any) {
      if (err.status === 403) {
        showToast('error', err.message || 'Free tier item limit reached (3 max). Upgrade to Premium.');
        setShowUpgradeModal(true);
      } else {
        showToast('error', err.message || 'Failed to register item.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const categories: { key: ItemCategory; label: string; icon: React.ReactNode }[] = [
    { key: 'Wallet', label: 'Wallet / Purse', icon: <Wallet className="w-5 h-5" /> },
    { key: 'Bag', label: 'Bag / Backpack', icon: <Briefcase className="w-5 h-5" /> },
    { key: 'ID', label: 'ID / Access Card', icon: <CreditCard className="w-5 h-5" /> },
    { key: 'Gadget', label: 'Electronics / Phone', icon: <Smartphone className="w-5 h-5" /> },
    { key: 'School Supplies', label: 'School Supplies', icon: <BookOpen className="w-5 h-5" /> },
    { key: 'Other', label: 'Other Belonging', icon: <Box className="w-5 h-5" /> },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      {/* Back button */}
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-line shadow-soft space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-ink tracking-tight">Register New Belonging</h1>
          <p className="text-xs sm:text-sm text-muted">
            LostLink creates a unique privacy-shielded QR code for this specific item.
          </p>
        </div>

        {/* Free Tier Limit Alert */}
        {isAtFreeLimit && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
            <Crown className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-bold">Free Tier Item Limit Reached:</span> You have already registered 3 of 3 items. To create a 4th item, please upgrade to LostLink Premium.
              <div className="mt-2">
                <Button
                  variant="sky"
                  size="sm"
                  onClick={() => setShowUpgradeModal(true)}
                  className="font-bold shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  Upgrade for ₱50/mo
                </Button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Item Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-ink">
              Item Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Blue Dell Laptop, Bellroy Slim Wallet, Dorm Keys"
              className="w-full px-4 py-3 rounded-2xl border border-line bg-paper text-sm text-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky"
            />
          </div>

          {/* Category Picker */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-ink">
              Category *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setCategory(cat.key)}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-sky ${
                    category === cat.key
                      ? 'border-sky bg-sky-light text-ink font-bold shadow-sm'
                      : 'border-line bg-paper text-muted hover:border-line/80 hover:bg-white'
                  }`}
                >
                  <span className={category === cat.key ? 'text-sky' : 'text-muted'}>
                    {cat.icon}
                  </span>
                  <span className="text-xs">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-ink">
              Description / Distinguishing Details <span className="text-muted font-normal">(Optional)</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Has a blue sticker on the corner, small scratch on zipper."
              className="w-full px-4 py-3 rounded-2xl border border-line bg-paper text-sm text-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky"
            />
            <p className="text-[11px] text-muted">
              Note: This description is private to you and is not displayed to the public scanner.
            </p>
          </div>

          {/* Contact Method Preference */}
          <div className="space-y-2 pt-2 border-t border-line">
            <label className="block text-xs font-bold uppercase tracking-wider text-ink">
              Finder Alert Channel
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Email */}
              <button
                type="button"
                onClick={() => setContactMethod('email')}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                  contactMethod === 'email'
                    ? 'border-sky bg-sky-light text-ink font-bold shadow-sm'
                    : 'border-line bg-paper text-muted hover:bg-white'
                }`}
              >
                <Mail className={`w-5 h-5 mt-0.5 shrink-0 ${contactMethod === 'email' ? 'text-sky' : 'text-muted'}`} />
                <div>
                  <p className="text-xs font-bold">Email Notification</p>
                  <p className="text-[11px] text-muted font-normal mt-0.5">
                    Instant alert sent to your verified email ({user?.email})
                  </p>
                </div>
              </button>

              {/* Option 2: Email + Phone (Premium Feature) */}
              <button
                type="button"
                onClick={() => {
                  if (!user?.is_premium) {
                    setShowUpgradeModal(true);
                  } else {
                    setContactMethod('email+phone');
                  }
                }}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 relative ${
                  contactMethod === 'email+phone'
                    ? 'border-sky bg-sky-light text-ink font-bold shadow-sm'
                    : 'border-line bg-paper text-muted hover:bg-white'
                }`}
              >
                <div className="absolute top-2.5 right-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    <Crown className="w-3 h-3" /> PRO
                  </span>
                </div>
                <PhoneCall className={`w-5 h-5 mt-0.5 shrink-0 ${contactMethod === 'email+phone' ? 'text-sky' : 'text-muted'}`} />
                <div>
                  <p className="text-xs font-bold">Email + SMS Alert</p>
                  <p className="text-[11px] text-muted font-normal mt-0.5">
                    Sends dual alerts to your email and phone (phone number never exposed to finder)
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Privacy Guarantee Note */}
          <div className="p-3.5 rounded-2xl bg-paper border border-line flex items-center gap-2.5 text-xs text-muted">
            <Shield className="w-4 h-4 text-sky shrink-0" />
            <span>
              Your phone number, email address, and name are <strong>never</strong> shared with finders.
            </span>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full font-bold shadow-md"
          >
            Generate QR Tag for Item
          </Button>
        </form>
      </div>

      {/* Upgrade Modal */}
      <PaymentModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSuccess={() => {
          showToast('success', 'Premium active! You can now register unlimited belongings.');
        }}
      />
    </div>
  );
};
