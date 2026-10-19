import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { AdminUserListItem, PaginationMeta } from '../../types';
import { Spinner } from '../../components/common/Spinner';
import { Button } from '../../components/common/Button';
import { 
  Search, 
  Filter, 
  Crown, 
  ShieldCheck, 
  ShieldAlert, 
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  User as UserIcon
} from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [premiumFilter, setPremiumFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const fetchUsers = async () => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (statusFilter) params.append('status', statusFilter);
      if (roleFilter) params.append('role', roleFilter);
      if (premiumFilter) params.append('premium', premiumFilter);
      params.append('page', currentPage.toString());
      params.append('limit', '20');

      const data = await apiClient<{ users: AdminUserListItem[]; pagination: PaginationMeta }>(
        `/admin/users?${params.toString()}`
      );
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load user list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, statusFilter, roleFilter, premiumFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Filter and Search Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-line shadow-soft space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email address..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-line bg-paper text-sm text-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky"
            />
          </div>
          <Button type="submit" variant="primary" size="md">
            Search
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line/60">
          <div className="flex items-center gap-1.5 text-xs font-bold text-muted mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-line bg-paper text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-sky"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-line bg-paper text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-sky"
          >
            <option value="">All Roles</option>
            <option value="user">Users Only</option>
            <option value="admin">Administrators</option>
          </select>

          <select
            value={premiumFilter}
            onChange={(e) => {
              setPremiumFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-line bg-paper text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-sky"
          >
            <option value="">All Plans</option>
            <option value="false">Free Tier</option>
            <option value="true">Premium Members</option>
          </select>

          {(searchTerm || statusFilter || roleFilter || premiumFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setRoleFilter('');
                setPremiumFilter('');
                setCurrentPage(1);
              }}
              className="px-3 py-1 text-xs font-semibold text-lost hover:underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 2. Error message if any */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-lost-light border border-lost/20 text-lost text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {/* 3. Table / Mobile Card View */}
      {isLoading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm font-medium text-muted">Loading user directory...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-line shadow-soft space-y-3">
          <UserIcon className="w-10 h-10 text-muted mx-auto" />
          <h3 className="text-base font-bold text-ink">No users match your filters</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Try adjusting your search query or removing active status/role filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-3xl border border-line shadow-soft overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-paper border-b border-line text-[11px] font-black text-muted uppercase tracking-wider">
                  <th className="py-3.5 px-6">User Account</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Plan</th>
                  <th className="py-3.5 px-4 text-center">Items</th>
                  <th className="py-3.5 px-4">Last Login</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60 text-sm">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-paper/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-ink">{u.name}</div>
                      <div className="text-xs text-muted font-mono">{u.email}</div>
                    </td>
                    <td className="py-4 px-4">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-light text-sky">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Admin
                        </span>
                      ) : (
                        <span className="text-xs text-muted">User</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {u.status === 'suspended' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-lost-light text-lost">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-safe-light text-safe">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {u.is_premium ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          <Crown className="w-3 h-3" />
                          PRO
                        </span>
                      ) : (
                        <span className="text-xs text-muted">Free</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-ink">
                      {u.items_count}
                    </td>
                    <td className="py-4 px-4 text-xs text-muted">
                      {u.last_login_at 
                        ? new Date(u.last_login_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Never'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        to={`/admin/users/${u.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-sky hover:text-ink transition-colors"
                      >
                        <span>Manage</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards View */}
          <div className="md:hidden space-y-3">
            {users.map((u) => (
              <div key={u.id} className="bg-white p-5 rounded-3xl border border-line shadow-soft space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-ink text-sm">{u.name}</h4>
                    <p className="text-xs text-muted font-mono break-all">{u.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {u.status === 'suspended' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-lost-light text-lost">
                        Suspended
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-safe-light text-safe">
                        Active
                      </span>
                    )}
                    {u.role === 'admin' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-light text-sky">
                        Admin
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-line/60">
                  <span>{u.items_count} belongings</span>
                  <span>{u.is_premium ? '⭐ Premium' : 'Free Tier'}</span>
                </div>

                <Link
                  to={`/admin/users/${u.id}`}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-2xl bg-paper text-xs font-bold text-ink hover:bg-sky-light/50 transition-colors"
                >
                  <span>Inspect & Manage Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 px-2">
              <span className="text-xs text-muted">
                Showing {users.length} of {pagination.total} accounts (Page {pagination.page} of {pagination.totalPages})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-xl border border-line bg-white text-ink disabled:opacity-40 hover:bg-paper transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="p-2 rounded-xl border border-line bg-white text-ink disabled:opacity-40 hover:bg-paper transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
