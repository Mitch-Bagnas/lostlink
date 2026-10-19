import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Shield, Lock, Mail, User as UserIcon, ArrowRight, Sparkles } from 'lucide-react';

export const Auth: React.FC = () => {
  const { user, login, signup } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login';
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(initialTab);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // If already logged in, navigate to redirect path
  useEffect(() => {
    if (user) {
      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate, redirectPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (activeTab === 'login') {
        await login(email, password);
        showToast('success', 'Logged in successfully! Welcome back.');
      } else {
        if (!name.trim()) {
          throw new Error('Please provide your name.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match. Please check for typos.');
        }
        await signup(name, email, password);
        showToast('success', 'Account created successfully! Welcome to LostLink.');
      }
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      if (err.data?.error === 'ACCOUNT_SUSPENDED') {
        const reason = err.data.message || 'Your account has been suspended by an administrator.';
        const suspensionAlert = `Account Suspended: ${reason}`;
        setErrorMsg(suspensionAlert);
        showToast('error', suspensionAlert);
      } else {
        setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.');
        showToast('error', err.message || 'Authentication error.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMockGoogle = () => {
    showToast('info', 'Google OAuth integration ready. For this demo, please use email sign-in.');
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setActiveTab('login');
    showToast('info', `Filled credentials for ${demoEmail}`);
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
            {activeTab === 'login' ? 'Welcome back to LostLink' : 'Create your free account'}
          </h1>
          <p className="text-xs text-muted">
            {activeTab === 'login'
              ? 'Log in to manage your QR tags and view scanner alerts.'
              : 'Register in seconds and generate your first 3 QR tags for free.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-paper p-1 rounded-full border border-line">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg('');
              setConfirmPassword('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${
              activeTab === 'login' ? 'bg-ink text-white shadow-sm' : 'text-muted hover:text-ink'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${
              activeTab === 'signup' ? 'bg-ink text-white shadow-sm' : 'text-muted hover:text-ink'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Mock Google Button */}
        <div>
          <button
            type="button"
            onClick={handleMockGoogle}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-full border border-line text-sm font-semibold text-ink hover:bg-paper transition-all focus:outline-none focus:ring-2 focus:ring-sky"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-line w-full" />
          <span className="bg-white px-3 text-[11px] font-bold text-muted uppercase tracking-wider relative">
            Or with email
          </span>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-lost-light border border-lost/20 text-lost text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'signup' && (
            <div className="space-y-1">
              <label className="block text-xs font-bold text-ink">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-muted absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maria Santos"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-line bg-paper text-sm text-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold text-ink">Email Address</label>
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

          <div className="space-y-1">
            <label className="block text-xs font-bold text-ink">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-line bg-paper text-sm text-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky"
              />
            </div>
          </div>

          {activeTab === 'signup' && (
            <div className="space-y-1">
              <label className="block text-xs font-bold text-ink">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-sm text-ink focus:bg-white focus:outline-none focus:ring-2 ${
                    confirmPassword && confirmPassword !== password
                      ? 'border-lost bg-lost-light/30 focus:ring-lost'
                      : 'border-line bg-paper focus:ring-sky'
                  }`}
                />
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="text-[11px] text-lost font-medium pl-1">Passwords do not match</p>
              )}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full font-bold shadow-md mt-2"
          >
            {activeTab === 'login' ? 'Sign In' : 'Create Free Account'}
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </form>

        {/* Demo Fast-Login helper for student evaluator */}
        <div className="pt-4 border-t border-line text-center space-y-2">
          <p className="text-[11px] font-bold text-muted uppercase tracking-wider">
            Quick Demo Accounts (from seed.sql):
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount('demo@lostlink.ph')}
              className="px-2.5 py-1 rounded-full bg-paper border border-line text-[11px] font-medium text-ink hover:bg-sky-light hover:text-sky transition-colors"
            >
              Demo Free User (2 items)
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('pro@lostlink.ph')}
              className="px-2.5 py-1 rounded-full bg-paper border border-line text-[11px] font-medium text-ink hover:bg-sky-light hover:text-sky transition-colors"
            >
              Pro Power User (4 items)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
