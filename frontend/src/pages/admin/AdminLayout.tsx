import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  BellRing, 
  History, 
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { to: '/admin', end: true, label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/users', end: false, label: 'User Directory', icon: Users },
    { to: '/admin/items', end: false, label: 'Items Moderation', icon: Package },
    { to: '/admin/notifications', end: false, label: 'Abuse Review', icon: BellRing },
    { to: '/admin/audit', end: false, label: 'Audit Trail', icon: History },
  ];

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-ink text-white rounded-3xl p-6 sm:p-8 shadow-soft border border-line/20 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-sky/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky/20 text-sky text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              Platform Administration
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              LostLink Admin Panel
            </h1>
            <p className="text-xs sm:text-sm text-white/70">
              Manage accounts, moderate items, review scanner messages, and inspect audit logs.
            </p>
          </div>
        </div>

        {/* Subnavigation Bar */}
        <nav 
          className="relative z-10 flex items-center gap-1.5 sm:gap-2 mt-6 pt-5 border-t border-white/10 overflow-x-auto pb-1"
          aria-label="Admin Navigation Tabs"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isRootActive = item.end && location.pathname === '/admin';
            const isSubActive = !item.end && location.pathname.startsWith(item.to);
            const isActive = isRootActive || isSubActive;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-sky text-white shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Child Page Content */}
      <Outlet />
    </div>
  );
};
