import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiClient } from '../api/client';
import { Button } from '../components/common/Button';
import { PaymentModal } from '../components/premium/PaymentModal';
import { 
  User, 
  Lock, 
  Crown, 
  LogOut, 
  ShieldCheck, 
  Check, 
  Smartphone, 
  Mail,
  Sparkles
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, refreshUser, logout, downgradeToFree } = useAuth();
  const { showToast } = useToast();

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Upgrade Modal State
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isDowngrading, setIsDowngrading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      await apiClient('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim() || undefined,
          phone: phone.trim() || null,
        }),
      });
      await refreshUser();
      showToast('success', 'Profile updated successfully!');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingPassword(true);
    try {
      await apiClient('/users/me/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      showToast('success', 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDowngrade = async () => {
    if (!window.confirm('Are you sure you want to cancel your Premium subscription? Your existing belongings remain active, but adding new ones will be limited to 3.')) {
      return;
    }

    setIsDowngrading(true);
    try {
      await downgradeToFree();
      showToast('info', 'Subscription downgraded to Free plan.');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to downgrade.');
    } finally {
      setIsDowngrading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      <div className="pb-4 border-b border-line space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">Account Settings</h1>
        <p className="text-xs sm:text-sm text-muted">
          Manage your personal details, security credentials, and subscription plan.
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Profile Information */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-line shadow-soft space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-line">
            <User className="w-5 h-5 text-sky" />
            <h2 className="text-lg font-bold text-ink">Personal Profile</h2>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-line bg-paper text-sm text-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink">
                Email Address <span className="text-muted font-normal">(Read-only)</span>
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-4 py-2.5 rounded-2xl border border-line bg-line/40 text-sm text-muted cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink">
                Mobile Phone <span className="text-muted font-normal">(Used for Premium SMS alerts)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+63 917 123 4567"
                className="w-full px-4 py-2.5 rounded-2xl border border-line bg-paper text-sm text-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky"
              />
              <p className="text-[11px] text-muted">
                🔒 Note: Your phone number is strictly kept private and is never disclosed to finders.
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isUpdatingProfile}
              className="mt-2"
            >
              Save Profile Changes
            </Button>
          </form>
        </div>

        {/* 2. Security & Password Change */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-line shadow-soft space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-line">
            <Lock className="w-5 h-5 text-sky" />
            <h2 className="text-lg font-bold text-ink">Security & Password</h2>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-lg">
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-2xl border border-line bg-paper text-sm text-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink">
                New Password <span className="text-muted font-normal">(Min 8 characters)</span>
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-2xl border border-line bg-paper text-sm text-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky"
              />
            </div>

            <Button
              type="submit"
              variant="secondary"
              size="md"
              isLoading={isUpdatingPassword}
              className="mt-2"
            >
              Update Password
            </Button>
          </form>
        </div>

        {/* 3. Subscription Management */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-line shadow-soft space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-line">
            <Crown className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-ink">Subscription Plan</h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-paper border border-line">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-ink">
                  {user?.is_premium ? 'LostLink Premium' : 'LostLink Free Tier'}
                </span>
                {user?.is_premium && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    ACTIVE PRO
                  </span>
                )}
              </div>
              <p className="text-xs text-muted">
                {user?.is_premium
                  ? 'Unlimited belongings registered + Email & SMS alerts enabled.'
                  : 'Limited to 3 registered belongings. Email alerts only.'}
              </p>
            </div>

            {user?.is_premium ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDowngrade}
                isLoading={isDowngrading}
                className="text-lost hover:bg-lost-light"
              >
                Downgrade to Free
              </Button>
            ) : (
              <Button
                variant="sky"
                size="md"
                onClick={() => setIsUpgradeModalOpen(true)}
                className="font-bold shadow-sm"
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                Upgrade for ₱50/mo
              </Button>
            )}
          </div>
        </div>

        {/* 4. Session & Logout */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-line shadow-soft flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-ink">Active Session</h3>
            <p className="text-xs text-muted">Log out of your LostLink account on this browser.</p>
          </div>
          <Button variant="danger" size="md" onClick={() => logout()}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      <PaymentModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onSuccess={() => {
          showToast('success', 'Upgraded to Premium!');
        }}
      />
    </div>
  );
};
