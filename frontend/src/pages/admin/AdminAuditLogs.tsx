import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { AuditLogListItem, PaginationMeta } from '../../types';
import { Spinner } from '../../components/common/Spinner';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { 
  History, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  Info,
  Clock,
  UserCheck
} from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [actionFilter, setActionFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Detail Modal state
  const [selectedLog, setSelectedLog] = useState<AuditLogListItem | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const params = new URLSearchParams();
      if (actionFilter.trim()) params.append('action', actionFilter.trim());
      params.append('page', currentPage.toString());
      params.append('limit', '20');

      const data = await apiClient<{ logs: AuditLogListItem[]; pagination: PaginationMeta }>(
        `/admin/audit-logs?${params.toString()}`
      );
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load audit logs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, actionFilter]);

  const getActionBadge = (action: string) => {
    if (action.includes('suspend') || action.includes('delete')) {
      return 'bg-lost-light text-lost';
    }
    if (action.includes('promote') || action.includes('grant')) {
      return 'bg-sky-light text-sky';
    }
    if (action.includes('reactivate')) {
      return 'bg-safe-light text-safe';
    }
    return 'bg-line/60 text-ink';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header and Filter */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-line shadow-soft flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-ink tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-sky" />
            Administrative Audit Trail
          </h2>
          <p className="text-xs text-muted">
            Immutable log of all user modifications, role elevations, suspensions, and content deletions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted" />
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-line bg-paper text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-sky"
          >
            <option value="">All Actions</option>
            <option value="user.suspend">User Suspended</option>
            <option value="user.reactivate">User Reactivated</option>
            <option value="user.promote_admin">Promoted to Admin</option>
            <option value="user.demote_user">Demoted to User</option>
            <option value="user.reset_password">Password Reset</option>
            <option value="user.grant_premium">Granted Premium</option>
            <option value="user.revoke_premium">Revoked Premium</option>
            <option value="user.delete">User Deleted</option>
            <option value="item.delete">Item Deleted</option>
          </select>

          {actionFilter && (
            <button
              type="button"
              onClick={() => {
                setActionFilter('');
                setCurrentPage(1);
              }}
              className="text-xs font-semibold text-lost hover:underline ml-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-lost-light border border-lost/20 text-lost text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {isLoading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm font-medium text-muted">Loading audit entries...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-line shadow-soft space-y-3">
          <History className="w-10 h-10 text-muted mx-auto" />
          <h3 className="text-base font-bold text-ink">No audit entries found</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            When administrators perform mutations, they will be preserved here permanently.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-line shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-paper border-b border-line text-[10px] font-black text-muted uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Timestamp</th>
                    <th className="py-3.5 px-4">Administrator</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Target Type</th>
                    <th className="py-3.5 px-4">Target ID</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-paper/50 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 text-muted whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-ink">
                        {log.admin_email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getActionBadge(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-muted uppercase text-[10px]">
                        {log.target_type}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[10px] text-muted">
                        {log.target_id ? log.target_id.slice(0, 8) + '...' : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                          className="p-1 text-sky hover:underline"
                        >
                          <Info className="w-4 h-4 mr-1" />
                          <span>View Payload</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 px-2">
              <span className="text-xs text-muted">
                Showing {logs.length} of {pagination.total} audit logs (Page {pagination.page} of {pagination.totalPages})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-xl border border-line bg-white text-ink disabled:opacity-40 hover:bg-paper transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="p-2 rounded-xl border border-line bg-white text-ink disabled:opacity-40 hover:bg-paper transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Details JSON Modal */}
      <Modal
        isOpen={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Payload Details"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-paper">
              <div>
                <span className="text-muted block text-[10px] font-bold uppercase">Action:</span>
                <span className="font-bold text-ink">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-muted block text-[10px] font-bold uppercase">Admin:</span>
                <span className="font-mono text-ink">{selectedLog.admin_email}</span>
              </div>
              <div>
                <span className="text-muted block text-[10px] font-bold uppercase">Target Type:</span>
                <span className="font-semibold text-ink">{selectedLog.target_type}</span>
              </div>
              <div>
                <span className="text-muted block text-[10px] font-bold uppercase">Timestamp:</span>
                <span className="text-ink">{new Date(selectedLog.created_at).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-muted block text-[10px] font-bold uppercase">Payload Data:</span>
              <pre className="p-3 rounded-2xl bg-ink text-sky-light font-mono text-[11px] overflow-x-auto max-h-60 leading-relaxed">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
