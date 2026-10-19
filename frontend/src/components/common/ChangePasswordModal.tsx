import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from './Button';
import { ShieldAlert, Lock } from 'lucide-react';

export const ChangePasswordModal: React.FC = () => {
  const { user, changePassword } = useAuth();
  const { showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!user || !user.must_change_password) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match. Please verify for typos.');
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      showToast('success', 'Your password has been securely updated!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password. Please check your current password.');
      showToast('error', err.message || 'Password update failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
    >
      <div className="w-full max-w-md bg-white rounded-3xl border border-line shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 id="change-password-title" className="text-xl font-black text-ink tracking-tight">
            Password Change Required
          </h2>
          <p className="text-xs text-muted leading-relaxed">
            An administrator has reset your password or required an update. Please set a new personal password to continue accessing LostLink.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-lost-light border border-lost/20 text-lost text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-ink">Temporary / Current Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter the password you used to log in"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-line bg-paper text-sm text-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-ink">New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-line bg-paper text-sm text-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-ink">Confirm New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-sm text-ink focus:bg-white focus:outline-none focus:ring-2 ${
                  confirmPassword && confirmPassword !== newPassword
                    ? 'border-lost bg-lost-light/30 focus:ring-lost'
                    : 'border-line bg-paper focus:ring-sky'
                }`}
              />
            </div>
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="text-[11px] text-lost font-medium pl-1">Passwords do not match</p>
            )}
          </div>

          <Button
            type="submit"
            variant="sky"
            size="lg"
            isLoading={isSubmitting}
            className="w-full font-bold shadow-md mt-2"
          >
            Update Password & Continue
          </Button>
        </form>
      </div>
    </div>
  );
};
