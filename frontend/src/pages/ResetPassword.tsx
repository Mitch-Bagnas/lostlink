import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Shield, Lock, ArrowRight, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Read initial token from URL
  const initialToken = searchParams.get('token') || '';
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // 1. Immediately remove the token from browser history / URL bar to prevent leaks
  // 2. Set Referrer-Policy: no-referrer dynamically
  useEffect(() => {
    if (initialToken) {
      setToken(initialToken);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Set meta referrer tag to no-referrer
    let metaTag = document.querySelector('meta[name="referrer"]') as HTMLMetaElement | null;
    let created = false;
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.name = 'referrer';
      metaTag.content = 'no-referrer';
      document.head.appendChild(metaTag);
      created = true;
    } else {
      metaTag.content = 'no-referrer';
    }

    return () => {
      if (created && metaTag) {
        document.head.removeChild(metaTag);
      }
    };
  }, [initialToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!token) {
      setErrorMsg('Reset token is missing or has already been used. Please request a new link.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your typing.');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
        skipAuthRedirect: true,
      });

      setIsSuccess(true);
      showToast('success', 'Password reset successfully! You can now log in.');

      setTimeout(() => {
        navigate('/auth', { replace: true });
      }, 3000);
    } catch (err: any) {
      const msg = err.data?.message || err.message || 'The password reset link is invalid or has expired.';
      setErrorMsg(msg);
      showToast('error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: '', color: '' };
    if (pwd.length < 8) return { label: 'Too short (min 8 chars)', color: 'text-lost' };
    const hasNum = /\d/.test(pwd);
    const hasLetter = /[a-zA-Z]/.test(pwd);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);
    const score = (hasNum ? 1 : 0) + (hasLetter ? 1 : 0) + (hasSpecial ? 1 : 0) + (pwd.length >= 12 ? 1 : 0);

    if (score <= 2) return { label: 'Fair', color: 'text-amber-600' };
    if (score === 3) return { label: 'Good', color: 'text-sky' };
    return { label: 'Strong', color: 'text-safe' };
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-line shadow-soft">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-ink text-white shadow-soft">
            <Shield className="w-6 h-6 text-sky" />
          </div>
          <h1 className="text-2xl font-black text-ink tracking-tight">
            Create new password
          </h1>
          <p className="text-xs text-muted">
            Choose a strong password to safeguard your account and belongings.
          </p>
        </div>

        {isSuccess ? (
          <div className="p-6 rounded-2xl bg-safe-light/60 border border-safe/20 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-safe text-white shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-base font-bold text-ink">Password Reset Complete!</h2>
            <p className="text-xs text-muted leading-relaxed">
              Your password has been securely updated and all previous sessions have been logged out. Redirecting you to sign in...
            </p>
            <Link to="/auth" className="block pt-2">
              <Button variant="primary" className="w-full justify-center text-xs font-bold py-2.5">
                Go to Sign In Now
              </Button>
            </Link>
          </div>
        ) : !token ? (
          <div className="p-6 rounded-2xl bg-lost-light border border-lost/20 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-lost text-white">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-ink">Missing or Expired Token</h2>
            <p className="text-xs text-muted leading-relaxed">
              This password reset link is invalid, incomplete, or has already been consumed.
            </p>
            <Link to="/forgot-password" className="block pt-2">
              <Button variant="primary" className="w-full justify-center text-xs font-bold py-2.5">
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Request a New Reset Link
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-lost-light border border-lost/20 space-y-2">
                <p className="text-lost text-xs font-semibold">{errorMsg}</p>
                {(errorMsg.toLowerCase().includes('expired') || errorMsg.toLowerCase().includes('invalid')) && (
                  <Link
                    to="/forgot-password"
                    className="inline-block text-[11px] font-bold text-lost underline hover:text-ink"
                  >
                    Click here to request a new reset link →
                  </Link>
                )}
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-ink">New Password</label>
                {strength.label && (
                  <span className={`text-[11px] font-bold ${strength.color}`}>
                    {strength.label}
                  </span>
                )}
              </div>
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-line bg-paper text-sm text-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky"
                />
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[11px] font-semibold text-lost mt-1">
                  Passwords do not match.
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full justify-center py-3 text-sm font-bold shadow-soft"
            >
              Reset Password
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
