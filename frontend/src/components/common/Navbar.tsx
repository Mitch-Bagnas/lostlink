import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from './Button';
import { Shield, QrCode, PlusCircle, Crown, Settings, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3">
          {/* Logo */}
          <Link
            to={user ? '/dashboard' : '/'}
            className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-sky rounded-xl p-1"
            aria-label="LostLink Home"
          >
            <div className="w-10 h-10 rounded-2xl bg-ink flex items-center justify-center text-white shadow-soft group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-sky" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-ink flex items-center gap-1">
                Lost<span className="text-sky">Link</span>
              </span>
              <span className="block text-[10px] font-medium text-muted tracking-wide -mt-1">
                PRIVACY LOST & FOUND
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-ink text-white'
                      : 'text-muted hover:text-ink hover:bg-paper'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/items/new"
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${
                    isActive('/items/new')
                      ? 'bg-ink text-white'
                      : 'text-muted hover:text-ink hover:bg-paper'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Item</span>
                </Link>

                <Link
                  to="/premium"
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${
                    isActive('/premium')
                      ? 'bg-ink text-white'
                      : 'text-muted hover:text-ink hover:bg-paper'
                  }`}
                >
                  <Crown className={`w-4 h-4 ${user.is_premium ? 'text-amber-500' : 'text-sky'}`} />
                  <span>Premium</span>
                  {user.is_premium && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] uppercase font-bold rounded-full bg-amber-100 text-amber-800">
                      PRO
                    </span>
                  )}
                </Link>

                <Link
                  to="/settings"
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${
                    isActive('/settings')
                      ? 'bg-ink text-white'
                      : 'text-muted hover:text-ink hover:bg-paper'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Link>
              </>
            ) : (
              <>
                <a
                  href="/#how-it-works"
                  className="px-3.5 py-2 rounded-full text-sm font-medium text-muted hover:text-ink hover:bg-paper transition-colors"
                >
                  How it Works
                </a>
                <a
                  href="/#pricing"
                  className="px-3.5 py-2 rounded-full text-sm font-medium text-muted hover:text-ink hover:bg-paper transition-colors"
                >
                  Free vs Premium
                </a>
              </>
            )}
          </nav>

          {/* Right Action / Auth Button */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 pl-3 border-l border-line">
                <div className="text-right">
                  <p className="text-xs font-semibold text-ink leading-tight">{user.name}</p>
                  <p className="text-[11px] text-muted leading-tight">{user.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logout()}
                  title="Log out"
                  aria-label="Log out of account"
                  className="p-2"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth">
                  <Button variant="ghost" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link to="/auth?tab=signup">
                  <Button variant="sky" size="sm">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-2xl text-ink hover:bg-paper focus:outline-none focus:ring-2 focus:ring-sky"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-line px-4 pt-2 pb-6 space-y-2 animate-slide-down">
          {user ? (
            <>
              <div className="px-3 py-2 bg-paper rounded-2xl mb-3">
                <p className="text-xs font-bold text-ink">{user.name}</p>
                <p className="text-xs text-muted">{user.email}</p>
                {user.is_premium ? (
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800">
                    ⭐ Premium Member
                  </span>
                ) : (
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-line text-muted">
                    Free Tier (3 Items Max)
                  </span>
                )}
              </div>

              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium text-ink hover:bg-paper"
              >
                <LayoutDashboard className="w-4 h-4 text-sky" />
                Dashboard
              </Link>

              <Link
                to="/items/new"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium text-ink hover:bg-paper"
              >
                <PlusCircle className="w-4 h-4 text-sky" />
                Register Item
              </Link>

              <Link
                to="/premium"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium text-ink hover:bg-paper"
              >
                <Crown className="w-4 h-4 text-amber-500" />
                Premium Subscription
              </Link>

              <Link
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium text-ink hover:bg-paper"
              >
                <Settings className="w-4 h-4 text-muted" />
                Settings
              </Link>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium text-lost hover:bg-lost-light"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </button>
            </>
          ) : (
            <>
              <a
                href="/#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2.5 rounded-2xl text-sm font-medium text-ink hover:bg-paper"
              >
                How it Works
              </a>
              <a
                href="/#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2.5 rounded-2xl text-sm font-medium text-ink hover:bg-paper"
              >
                Free vs Premium
              </a>
              <div className="pt-2 flex flex-col gap-2">
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="secondary" className="w-full">
                    Log In
                  </Button>
                </Link>
                <Link to="/auth?tab=signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="sky" className="w-full">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
};
