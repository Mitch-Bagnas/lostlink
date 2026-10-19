import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { AdminUserDetail as UserDetailData } from '../../types';
import { Spinner } from '../../components/common/Spinner';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowLeft, 
  ShieldAlert, 
  ShieldCheck, 
  Crown, 
  KeyRound, 
  Trash2, 
  Copy, 
  Check, 
  Package, 
  BellRing,
  AlertTriangle,
  User as UserIcon,
  Calendar,
  Clock,
  Phone,
  Mail
} from 'lucide-react';

export const AdminUserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user: currentAdmin } = useAuth();

  const [data, setData] = useState<UserDetailData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Modals state
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');

  const [actionLoading, setActionLoading] = useState(false);

  const loadUserDetail = async () => {
    if (!id) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const result = await apiClient<UserDetailData>(`/admin/users/${id}`);
      setData(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load user account details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserDetail();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-muted">Retrieving user profile and belongings...</p>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="space-y-4">
        <Link to="/admin/users" className="inline-flex items-center gap-2 text-xs font-bold text-sky hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to User Directory
        </Link>
        <div className="p-6 rounded-3xl bg-lost-light border border-lost/20 text-lost text-sm">
          {errorMsg || 'User account not found.'}
        </div>
      </div>
    );
  }

  const { user, items, notifications } = data;
  const isSelf = currentAdmin?.id === user.id;

  // 1. Suspend / Reactivate handler
  const handleToggleStatus = async () => {
    setActionLoading(true);
    try {
      const nextStatus = user.status === 'suspended' ? 'active' : 'suspended';
      await apiClient(`/admin/users/${user.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: nextStatus,
          reason: nextStatus === 'suspended' ? suspendReason.trim() : undefined,
        }),
      });
      showToast('success', `Account successfully ${nextStatus === 'suspended' ? 'suspended' : 'reactivated'}.`);
      setSuspendModalOpen(false);
      setSuspendReason('');
      await loadUserDetail();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update user status.');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Premium toggle handler
  const handleTogglePremium = async () => {
    setActionLoading(true);
    try {
      await apiClient(`/admin/users/${user.id}/premium`, {
        method: 'PATCH',
        body: JSON.stringify({ isPremium: !user.is_premium }),
      });
      showToast('success', `Premium status ${!user.is_premium ? 'granted' : 'revoked'}.`);
      await loadUserDetail();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update premium plan.');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Role toggle handler
  const handleToggleRole = async () => {
    setActionLoading(true);
    try {
      const nextRole = user.role === 'admin' ? 'user' : 'admin';
      await apiClient(`/admin/users/${user.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: nextRole }),
      });
      showToast('success', `User role updated to ${nextRole}.`);
      await loadUserDetail();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update role.');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Reset password handler
  const handleResetPassword = async () => {
    setActionLoading(true);
    try {
      const res = await apiClient<{ temporaryPassword: string }>(`/admin/users/${user.id}/reset-password`, {
        method: 'POST',
      });
      setTempPassword(res.temporaryPassword);
      setCopied(false);
      setResetModalOpen(true);
      showToast('info', 'Temporary password generated. Give this to the user.');
      await loadUserDetail();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to reset password.');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Delete user handler
  const handleDeleteUser = async () => {
    if (deleteConfirmEmail.trim() !== user.email) {
      showToast('error', 'Confirmation email does not match.');
      return;
    }

    setActionLoading(true);
    try {
      await apiClient(`/admin/users/${user.id}`, { method: 'DELETE' });
      showToast('success', `User account ${user.email} and all items have been deleted.`);
      navigate('/admin/users');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete user.');
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('info', 'Temporary password copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Navigation breadcrumb */}
      <div>
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to User Directory</span>
        </Link>
      </div>

      {/* User Header & Action Controls */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-line shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-line">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-black text-ink tracking-tight">{user.name}</h2>
              {user.status === 'suspended' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-lost-light text-lost">
                  <ShieldAlert className="w-3.5 h-3.5" /> Suspended
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-safe-light text-safe">
                  Active
                </span>
              )}
              {user.role === 'admin' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-light text-sky">
                  <ShieldCheck className="w-3.5 h-3.5" /> Administrator
                </span>
              )}
              {user.is_premium && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  <Crown className="w-3.5 h-3.5" /> Premium
                </span>
              )}
              {user.must_change_password && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600">
                  Password Change Pending
                </span>
              )}
            </div>
            <p className="text-xs text-muted font-mono">{user.email}</p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Suspend / Reactivate */}
            <Button
              variant={user.status === 'suspended' ? 'secondary' : 'danger'}
              size="sm"
              disabled={isSelf}
              title={isSelf ? 'Cannot modify your own account' : undefined}
              onClick={() => {
                if (user.status === 'suspended') {
                  handleToggleStatus();
                } else {
                  setSuspendModalOpen(true);
                }
              }}
            >
              {user.status === 'suspended' ? 'Reactivate User' : 'Suspend User'}
            </Button>

            {/* Premium Toggle */}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleTogglePremium}
              isLoading={actionLoading}
            >
              {user.is_premium ? 'Revoke Premium' : 'Grant Premium'}
            </Button>

            {/* Promote / Demote */}
            <Button
              variant="secondary"
              size="sm"
              disabled={isSelf}
              title={isSelf ? 'Cannot modify your own role' : undefined}
              onClick={handleToggleRole}
              isLoading={actionLoading}
            >
              {user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
            </Button>

            {/* Reset Password */}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleResetPassword}
              isLoading={actionLoading}
            >
              <KeyRound className="w-3.5 h-3.5 mr-1" />
              Reset Password
            </Button>

            {/* Delete Account */}
            <Button
              variant="ghost"
              size="sm"
              disabled={isSelf || user.role === 'admin'}
              title={
                isSelf 
                  ? 'Cannot delete your own account' 
                  : user.role === 'admin' 
                  ? 'Demote administrator to user first before deleting' 
                  : undefined
              }
              onClick={() => {
                setDeleteConfirmEmail('');
                setDeleteModalOpen(true);
              }}
              className="text-lost hover:bg-lost-light"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Account Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <span className="font-bold text-muted flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Email
            </span>
            <p className="font-semibold text-ink break-all">{user.email}</p>
          </div>

          <div className="space-y-1">
            <span className="font-bold text-muted flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> Phone
            </span>
            <p className="font-semibold text-ink">{user.phone || 'None provided'}</p>
          </div>

          <div className="space-y-1">
            <span className="font-bold text-muted flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Last Login
            </span>
            <p className="font-semibold text-ink">
              {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="font-bold text-muted flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Registered
            </span>
            <p className="font-semibold text-ink">{new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Suspended Reason Banner if suspended */}
        {user.status === 'suspended' && (
          <div className="p-4 rounded-2xl bg-lost-light border border-lost/20 space-y-1">
            <span className="text-xs font-bold text-lost uppercase tracking-wider">Suspension Reason:</span>
            <p className="text-xs text-lost font-medium">{user.suspended_reason || 'No specific reason provided.'}</p>
          </div>
        )}
      </div>

      {/* Belongings Owned by User */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-line shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-sky" />
            <h3 className="text-lg font-black text-ink tracking-tight">Registered Belongings ({items.length})</h3>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="text-xs text-muted py-4">This user has not registered any belongings yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-paper border-b border-line text-[10px] font-black text-muted uppercase">
                  <th className="py-2.5 px-3">Item Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">QR Identifier</th>
                  <th className="py-2.5 px-3">Created</th>
                  <th className="py-2.5 px-3 text-right">Public Scan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-paper/50">
                    <td className="py-3 px-3 font-bold text-ink">{item.name}</td>
                    <td className="py-3 px-3 text-muted">{item.category}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold ${
                        item.status === 'lost' ? 'bg-lost-light text-lost' : 'bg-safe-light text-safe'
                      }`}>
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-muted">{item.qr_id}</td>
                    <td className="py-3 px-3 text-muted">{new Date(item.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-3 text-right">
                      <a
                        href={`/found/${item.qr_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky hover:underline font-bold"
                      >
                        View Finder Page ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Scanner Alerts on this User's Items */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-line shadow-soft space-y-4">
        <div className="flex items-center gap-2">
          <BellRing className="w-5 h-5 text-sky" />
          <h3 className="text-lg font-black text-ink tracking-tight">Recent Scanner Notifications ({notifications.length})</h3>
        </div>

        {notifications.length === 0 ? (
          <p className="text-xs text-muted py-4">No finder notifications logged for this user's belongings.</p>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className="p-4 rounded-2xl bg-paper border border-line space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink">Item: {n.item_name}</span>
                  <span className="text-[11px] text-muted">{new Date(n.created_at).toLocaleString()}</span>
                </div>
                <p className="text-ink bg-white p-3 rounded-xl border border-line/60">
                  "{n.finder_message || 'No message provided by finder.'}"
                </p>
                {n.finder_contact && (
                  <p className="text-[11px] text-muted">
                    Finder Contact: <span className="font-semibold text-ink">{n.finder_contact}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---------------- MODALS ---------------- */}

      {/* Suspend Confirmation Modal */}
      <Modal
        isOpen={suspendModalOpen}
        onClose={() => setSuspendModalOpen(false)}
        title="Suspend User Account"
      >
        <div className="space-y-4 text-xs">
          <p className="text-muted leading-relaxed">
            Suspending <strong>{user.email}</strong> will immediately terminate their active session and block them from logging in until reactivated.
          </p>

          <div className="space-y-1">
            <label className="block font-bold text-ink">Reason for suspension (displayed to user on login):</label>
            <textarea
              required
              rows={3}
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="e.g. Terms of Service violation, suspicious scam activity, or abusive finder reports."
              className="w-full p-3 rounded-2xl border border-line bg-paper text-sm text-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setSuspendModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={actionLoading}
              disabled={!suspendReason.trim()}
              onClick={handleToggleStatus}
            >
              Confirm Suspension
            </Button>
          </div>
        </div>
      </Modal>

      {/* Temporary Password Display Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Temporary Password Generated"
      >
        <div className="space-y-4 text-xs">
          <p className="text-muted leading-relaxed">
            A temporary password has been set for <strong>{user.email}</strong>. Existing sessions have been immediately invalidated. The user will be required to choose a new password upon logging in.
          </p>

          <div className="p-4 rounded-2xl bg-paper border border-line flex items-center justify-between">
            <span className="font-mono text-base font-black text-ink select-all">
              {tempPassword}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => tempPassword && copyToClipboard(tempPassword)}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-safe mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>

          <p className="text-[11px] text-lost font-semibold">
            ⚠️ This password will not be displayed again. Please securely communicate it to the user.
          </p>

          <div className="flex justify-end pt-2">
            <Button variant="primary" size="sm" onClick={() => setResetModalOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal (Type-Email-To-Confirm) */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Permanently Delete User Account"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-2xl bg-lost-light border border-lost/20 text-lost font-medium flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              This action is permanent and irreversible. All {items.length} registered items and {notifications.length} notifications will be permanently removed.
            </span>
          </div>

          <p className="text-muted leading-relaxed">
            To confirm deletion, please type the user's exact email address: <strong className="text-ink">{user.email}</strong>
          </p>

          <input
            type="email"
            value={deleteConfirmEmail}
            onChange={(e) => setDeleteConfirmEmail(e.target.value)}
            placeholder={user.email}
            className="w-full p-2.5 rounded-2xl border border-line bg-paper text-sm text-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-lost font-mono"
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={actionLoading}
              disabled={deleteConfirmEmail.trim() !== user.email}
              onClick={handleDeleteUser}
            >
              Permanently Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
