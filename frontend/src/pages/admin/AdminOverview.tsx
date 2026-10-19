import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { AdminStats } from '../../types';
import { Spinner } from '../../components/common/Spinner';
import { 
  Users, 
  Crown, 
  ShieldAlert, 
  Package, 
  AlertTriangle, 
  BellRing, 
  TrendingUp, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await apiClient<AdminStats>('/admin/stats');
        setStats(data);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load admin statistics.');
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-muted">Aggregating platform metrics...</p>
      </div>
    );
  }

  if (errorMsg || !stats) {
    return (
      <div className="p-6 rounded-3xl bg-lost-light border border-lost/20 text-lost text-sm">
        {errorMsg || 'Unable to retrieve statistics.'}
      </div>
    );
  }

  // Calculate SVG Chart dimensions
  const chartHeight = 160;
  const chartWidth = 720;
  const paddingX = 20;
  const paddingY = 25;
  const maxSignups = Math.max(1, ...stats.signupsPerDay.map((d) => d.count));
  const dataPoints = stats.signupsPerDay;
  const stepX = (chartWidth - paddingX * 2) / Math.max(1, dataPoints.length - 1);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-line shadow-soft space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Total Users</span>
            <div className="w-8 h-8 rounded-xl bg-ink/5 text-ink flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-ink">{stats.totalUsers}</p>
          <p className="text-xs text-muted flex items-center gap-1">
            Registered accounts
          </p>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-line shadow-soft space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Premium Users</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600">{stats.premiumUsers}</p>
          <p className="text-xs text-muted">
            {stats.totalUsers > 0 ? Math.round((stats.premiumUsers / stats.totalUsers) * 100) : 0}% conversion rate
          </p>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-line shadow-soft space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Suspended</span>
            <div className="w-8 h-8 rounded-xl bg-lost-light text-lost flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-lost">{stats.suspendedUsers}</p>
          <p className="text-xs text-muted">Locked from signing in</p>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-line shadow-soft space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Belongings</span>
            <div className="w-8 h-8 rounded-xl bg-sky/10 text-sky flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-ink">{stats.totalItems}</p>
          <p className="text-xs text-muted">
            <span className="font-bold text-lost">{stats.lostItems}</span> marked lost
          </p>
        </div>
      </div>

      {/* 2. Secondary Analytics & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Signups Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-line shadow-soft space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-sky" />
                <h2 className="text-lg font-black text-ink tracking-tight">30-Day Registration Velocity</h2>
              </div>
              <p className="text-xs text-muted">New user signups per day across the last month</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-muted">Peak Daily: </span>
              <span className="text-sm font-black text-ink">{maxSignups} signups</span>
            </div>
          </div>

          {/* Inline SVG Chart */}
          <div className="w-full overflow-x-auto pb-2">
            <div className="min-w-[500px]">
              <svg 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                className="w-full h-44 overflow-visible"
                aria-label="Daily signups chart"
              >
                {/* Horizontal gridlines */}
                {[0, 0.5, 1].map((ratio) => {
                  const y = chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
                  return (
                    <g key={ratio}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={chartWidth - paddingX}
                        y2={y}
                        stroke="#E2E8F0"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={chartWidth - paddingX + 5}
                        y={y + 3}
                        fontSize="10"
                        fill="#94A3B8"
                        textAnchor="start"
                      >
                        {Math.round(ratio * maxSignups)}
                      </text>
                    </g>
                  );
                })}

                {/* Bars & Hover tooltips */}
                {dataPoints.map((dp, i) => {
                  const barWidth = Math.max(8, stepX - 6);
                  const barHeight = ((dp.count / maxSignups) * (chartHeight - paddingY * 2));
                  const x = paddingX + i * stepX - barWidth / 2;
                  const y = chartHeight - paddingY - barHeight;

                  return (
                    <g key={dp.date} className="group cursor-pointer">
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={Math.max(3, barHeight)}
                        rx="4"
                        className="fill-sky group-hover:fill-ink transition-colors"
                      />
                      {/* Tooltip on hover */}
                      <title>{`${dp.date}: ${dp.count} signup${dp.count !== 1 ? 's' : ''}`}</title>
                    </g>
                  );
                })}

                {/* X-axis labels (first, middle, last dates) */}
                {dataPoints.length > 0 && (
                  <>
                    <text
                      x={paddingX}
                      y={chartHeight - 4}
                      fontSize="10"
                      fill="#94A3B8"
                      textAnchor="start"
                    >
                      {dataPoints[0].date}
                    </text>
                    <text
                      x={chartWidth / 2}
                      y={chartHeight - 4}
                      fontSize="10"
                      fill="#94A3B8"
                      textAnchor="middle"
                    >
                      {dataPoints[Math.floor(dataPoints.length / 2)].date}
                    </text>
                    <text
                      x={chartWidth - paddingX}
                      y={chartHeight - 4}
                      fontSize="10"
                      fill="#94A3B8"
                      textAnchor="end"
                    >
                      {dataPoints[dataPoints.length - 1].date}
                    </text>
                  </>
                )}
              </svg>
            </div>
          </div>
        </div>

        {/* Finder Message Stats & Quick Links (1 col) */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-line shadow-soft space-y-4">
            <div className="flex items-center gap-2">
              <BellRing className="w-5 h-5 text-sky" />
              <h3 className="text-base font-black text-ink tracking-tight">Scanner Alert Volume</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-paper">
                <span className="text-xs font-bold text-muted">Past 7 Days</span>
                <span className="text-lg font-black text-ink">{stats.notifications7d} alerts</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-paper">
                <span className="text-xs font-bold text-muted">Past 30 Days</span>
                <span className="text-lg font-black text-ink">{stats.notifications30d} alerts</span>
              </div>
            </div>

            <Link
              to="/admin/notifications"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-sky hover:text-ink transition-colors"
            >
              <span>Review finder messages for abuse</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-line shadow-soft space-y-3">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-2">
              <Link
                to="/admin/users"
                className="flex items-center justify-between p-3 rounded-2xl bg-paper hover:bg-sky-light/40 transition-colors text-xs font-bold text-ink"
              >
                <span>Manage Users & Statuses</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted" />
              </Link>
              <Link
                to="/admin/items"
                className="flex items-center justify-between p-3 rounded-2xl bg-paper hover:bg-sky-light/40 transition-colors text-xs font-bold text-ink"
              >
                <span>Moderate Flagged Items</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted" />
              </Link>
              <Link
                to="/admin/audit"
                className="flex items-center justify-between p-3 rounded-2xl bg-paper hover:bg-sky-light/40 transition-colors text-xs font-bold text-ink"
              >
                <span>Inspect Audit Log</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
