import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Shield, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      await apiClient('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
        skipAuthRedirect: true,
      });
      setIsSubmitted(true);
      showToast('success', 'Reset instructions dispatched if the account exists.');
    } catch (err: any) {
      // Even on error, maintain uniform user experience to prevent enumeration
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-line shadow-soft">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-ink text-white shadow-soft">
            <Shield className="w-6 h-6 text-sky" />
          </div>
          <h1 className="text-2xl font-black text-ink tracking-tight">
            Forgot your password?
          </h1>
          <p className="text-xs text-muted">
            Enter your account email and we'll send you a secure link to reset your password.
          </p>
        </div>

        {isSubmitted ? (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-safe-light/60 border border-safe/20 text-center space-y-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-safe text-white shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-sm font-bold text-ink">Check your inbox</h2>
              <p className="text-xs text-muted leading-relaxed">
                If an account with <strong>{email}</strong> exists in our system, we've dispatched a password reset link. Please check your inbox and spam folder.
              </p>
              <div className="text-[11px] text-muted bg-white/80 p-2.5 rounded-xl border border-safe/20">
                ⏱️ The reset link is single-use and will expire in <strong>30 minutes</strong>.
              </div>
            </div>

            <Link to="/auth" className="block w-full">
              <Button variant="secondary" className="w-full justify-center py-2.5 text-xs font-bold">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Return to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-lost-light border border-lost/20 text-lost text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-bold text-ink">Account Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-line bg-paper text-sm text-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full justify-center py-3 text-sm font-bold shadow-soft"
            >
              Send Reset Link
            </Button>

            <div className="text-center pt-2">
              <Link
                to="/auth"
                className="inline-flex items-center text-xs font-semibold text-muted hover:text-ink transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
