import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { AdminNotificationListItem, PaginationMeta } from '../../types';
import { Spinner } from '../../components/common/Spinner';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { 
  BellRing, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink, 
  MessageSquare, 
  Phone, 
  Mail,
  Trash2,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';

export const AdminNotifications: React.FC = () => {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<AdminNotificationListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedNotifToDelete, setSelectedNotifToDelete] = useState<AdminNotificationListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchNotifications = async () => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const data = await apiClient<{ notifications: AdminNotificationListItem[]; pagination: PaginationMeta }>(
        `/admin/notifications?page=${currentPage}&limit=20`
      );
      setNotifications(data.notifications);
      setPagination(data.pagination);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load notifications stream.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [currentPage]);

  const handleDeleteNotification = async (id: string) => {
    setIsDeleting(true);
    try {
      await apiClient(`/admin/notifications/${id}`, { method: 'DELETE' });
      showToast('success', 'Inappropriate finder message deleted successfully.');
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      setSelectedNotifToDelete(null);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete message.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-3xl border border-line shadow-soft space-y-1">
        <h2 className="text-lg font-black text-ink tracking-tight flex items-center gap-2">
          <BellRing className="w-5 h-5 text-sky" />
          Finder Message Abuse Review
        </h2>
        <p className="text-xs text-muted">
          Review all messages submitted by finders across the platform to detect spam, abusive language, or fraudulent claims. Administrators can remove inappropriate messages immediately.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-lost-light border border-lost/20 text-lost text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {isLoading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm font-medium text-muted">Retrieving scanner messages...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-line shadow-soft space-y-3">
          <MessageSquare className="w-10 h-10 text-muted mx-auto" />
          <h3 className="text-base font-bold text-ink">No scanner messages found</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            When finders scan item QR codes and submit notes, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {notifications.map((n) => (
              <div 
                key={n.id} 
                className="bg-white p-5 sm:p-6 rounded-3xl border border-line shadow-soft space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-line/60">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-ink text-sm">{n.item_name}</span>
                    <span className="font-mono text-xs text-muted">({n.item_qr_id})</span>
                    <a
                      href={`/found/${n.item_qr_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky hover:underline text-xs inline-flex items-center gap-0.5"
                    >
                      <span>Public QR</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedNotifToDelete(n)}
                      className="text-lost hover:bg-lost-light py-1 px-2.5 h-auto text-xs font-semibold rounded-xl"
                      title="Delete inappropriate message"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>

                <div className="bg-paper p-4 rounded-2xl border border-line/60 space-y-1">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Finder Message:</span>
                  <p className="text-sm text-ink font-medium leading-relaxed">
                    {n.finder_message ? `"${n.finder_message}"` : <em className="text-muted">No text message submitted</em>}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted pt-1">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-muted" />
                    <span>Finder Contact: </span>
                    <span className="font-bold text-ink">{n.finder_contact || 'None left'}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-muted" />
                    <span>Item Owner: </span>
                    <span className="font-mono font-semibold text-ink">{n.owner_email}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 px-2">
              <span className="text-xs text-muted">
                Showing {notifications.length} of {pagination.total} messages (Page {pagination.page} of {pagination.totalPages})
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!selectedNotifToDelete}
        onClose={() => setSelectedNotifToDelete(null)}
        title="Delete Inappropriate Message?"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink leading-relaxed">
            Are you sure you want to delete this finder message for <strong>{selectedNotifToDelete?.item_name}</strong>?
          </p>
          
          <div className="p-3 bg-lost-light rounded-2xl border border-lost/20 text-xs text-lost space-y-1.5">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Inappropriate Message:</span>
            </div>
            <p className="font-mono font-bold bg-white/70 p-2 rounded-xl text-ink break-words">
              "{selectedNotifToDelete?.finder_message || '(No text)'}"
            </p>
          </div>

          <p className="text-[11px] text-muted">
            This will permanently remove the message from the platform and the owner's notifications feed. An audit log entry will be saved for this moderation action.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedNotifToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={() => selectedNotifToDelete && handleDeleteNotification(selectedNotifToDelete.id)}
              className="font-bold shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete Message
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
