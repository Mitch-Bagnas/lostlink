import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Item, Notification } from '../types';
import { formatCategoryName, formatFullDateTime, formatRelativeTime } from '../utils/formatters';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Spinner } from '../components/common/Spinner';
import { QRModal } from '../components/items/QRModal';
import { PrintableSheet } from '../components/items/PrintableSheet';
import { 
  ArrowLeft, 
  ShieldCheck, 
  AlertTriangle, 
  Download, 
  Printer, 
  Trash2, 
  Copy, 
  ExternalLink,
  Bell,
  CheckCircle2,
  Mail,
  PhoneCall,
  Clock,
  Shield,
  Edit2
} from 'lucide-react';

export const ItemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [item, setItem] = useState<Item | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  const fetchItemDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient<{ item: Item; notifications: Notification[] }>(`/items/${id}`);
      setItem(data.item);
      setNotifications(data.notifications || []);
    } catch (err: any) {
      setError(err.message || 'Item not found.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchItemDetail();
  }, [id]);

  const qrUrl = item ? `${window.location.origin}/found/${item.qr_id}` : '';

  const handleToggleStatus = async () => {
    if (!item) return;
    const newStatus = item.status === 'safe' ? 'lost' : 'safe';
    setIsTogglingStatus(true);
    try {
      const data = await apiClient<{ item: Item }>(`/items/${item.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setItem(data.item);
      showToast(
        'success',
        newStatus === 'lost'
          ? 'Item marked as LOST. Scanners will see it is missing.'
          : 'Item marked as SAFE. Welcome back!'
      );
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update item status.');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleMarkNotifRead = async (notifId: string) => {
    try {
      await apiClient(`/notifications/${notifId}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
      );
      showToast('success', 'Notification marked as read.');
    } catch (err: any) {
      showToast('error', 'Failed to mark notification read.');
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    setIsDeleting(true);
    try {
      await apiClient(`/items/${item.id}`, { method: 'DELETE' });
      showToast('success', `"${item.name}" and history deleted.`);
      navigate('/dashboard');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete item.');
      setIsDeleting(false);
    }
  };

  const handleDownloadPNG = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas || !item) return;
    const pngUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = `lostlink-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('success', 'QR code downloaded!');
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-muted mt-3">Loading item details...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-lost mx-auto" />
        <h2 className="text-xl font-bold text-ink">Item Not Found</h2>
        <p className="text-sm text-muted">{error || 'This belonging does not exist or was deleted.'}</p>
        <Link to="/dashboard">
          <Button variant="secondary">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const isLost = item.status === 'lost';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Public Scan Page Link */}
        <a
          href={`/found/${item.qr_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky hover:underline"
        >
          <span>Preview Public Finder View</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Main Grid: Details + QR Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details & Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-line shadow-soft space-y-6">
            {/* Header: Name, Category, Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  {formatCategoryName(item.category)}
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-ink">{item.name}</h1>
                <p className="text-xs text-muted">
                  Registered on {formatFullDateTime(item.created_at)}
                </p>
              </div>

              {/* Status Toggle Button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleStatus}
                  disabled={isTogglingStatus}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${
                    isLost
                      ? 'bg-lost text-white hover:bg-lost/90'
                      : 'bg-safe text-white hover:bg-safe/90'
                  }`}
                  title="Click to toggle status"
                >
                  {isTogglingStatus ? (
                    <Spinner size="sm" light />
                  ) : isLost ? (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      <span>STATUS: LOST (Click if Found)</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>STATUS: SAFE (Click to Mark Lost)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Description Card */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                Private Description
              </h3>
              <p className="text-sm text-ink/90 leading-relaxed bg-paper p-4 rounded-2xl border border-line">
                {item.description || (
                  <span className="text-muted/60 italic">No description provided for this item.</span>
                )}
              </p>
            </div>

            {/* Notification Channel Preference */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                Finder Alert Relay Channel
              </h3>
              <div className="flex items-center gap-2 p-3 bg-paper rounded-2xl border border-line text-xs">
                {item.contact_method === 'email+phone' ? (
                  <>
                    <PhoneCall className="w-4 h-4 text-sky shrink-0" />
                    <span className="text-ink font-medium">
                      Dual Alerts Enabled: Email ({user?.email}) + SMS
                    </span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 text-sky shrink-0" />
                    <span className="text-ink font-medium">
                      Email Alert Only: Sent to {user?.email}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="pt-4 border-t border-line flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-ink">Delete this item</p>
                <p className="text-[11px] text-muted">Permanently removes QR tag and notification logs.</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
                className="text-lost hover:bg-lost-light"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Delete Belonging
              </Button>
            </div>
          </div>

          {/* Scanner Notifications Log */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-line shadow-soft space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-sky" />
                <h3 className="text-lg font-bold text-ink">
                  Scanner Notifications ({notifications.length})
                </h3>
              </div>
              <span className="text-xs text-muted">Real-time alerts</span>
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <ShieldCheck className="w-8 h-8 text-safe/70 mx-auto" />
                <p className="text-sm font-semibold text-ink">No scanner alerts yet</p>
                <p className="text-xs text-muted max-w-xs mx-auto">
                  When a finder scans your QR tag, their message and timestamp will appear here immediately.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      notif.read
                        ? 'bg-paper border-line text-ink'
                        : 'bg-white border-sky/40 shadow-soft'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-ink">
                            🚨 Finder Scanned Tag
                          </span>
                          {!notif.read && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-light text-sky">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatFullDateTime(notif.created_at)} ({formatRelativeTime(notif.created_at)})
                        </p>
                      </div>

                      {!notif.read && (
                        <button
                          onClick={() => handleMarkNotifRead(notif.id)}
                          className="text-xs font-semibold text-sky hover:underline"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>

                    <div className="mt-3 p-3 bg-white rounded-xl border border-line/70 text-sm text-ink leading-relaxed">
                      <strong>Message:</strong>{' '}
                      {notif.finder_message || <em className="text-muted">No message written.</em>}
                    </div>

                    {notif.finder_contact && (
                      <div className="mt-2 text-xs text-safe bg-safe-light/60 p-2.5 rounded-xl border border-safe/20">
                        <strong>Finder's Contact Info:</strong> {notif.finder_contact}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: QR Code & Print Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-line shadow-soft text-center space-y-6 sticky top-24">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-ink">Item QR Code</h3>
              <p className="text-xs text-muted">Unique ID: {item.qr_id.slice(0, 8)}...</p>
            </div>

            {/* Large QR Display */}
            <div
              ref={canvasRef}
              className="p-5 bg-paper rounded-3xl border-2 border-line flex flex-col items-center justify-center shadow-inner"
            >
              <QRCodeCanvas
                value={qrUrl}
                size={190}
                level="H"
                includeMargin={true}
                imageSettings={{
                  src: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2300A8E8'><path d='M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z'/></svg>",
                  height: 32,
                  width: 32,
                  excavate: true,
                }}
              />
              <span className="mt-3 text-[11px] font-bold text-muted flex items-center gap-1 uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5 text-sky" />
                Scan to Recover
              </span>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2.5">
              <Button variant="sky" size="md" onClick={handleDownloadPNG} className="w-full font-bold shadow-sm">
                <Download className="w-4 h-4 mr-2" />
                Download PNG (High-Res)
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={() => setIsPrintOpen(true)}
                className="w-full"
              >
                <Printer className="w-4 h-4 mr-2 text-sky" />
                Print Sticker Tags
              </Button>
            </div>

            <div className="p-3 bg-paper rounded-2xl border border-line text-[11px] text-muted leading-relaxed">
              💡 <strong>Tip:</strong> Print on sticker paper or slide a wallet tag inside your cardholder so finders can reach you immediately.
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Belonging?"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink leading-relaxed">
            Are you sure you want to delete <strong>{item.name}</strong>?
          </p>
          <p className="text-xs text-lost bg-lost-light p-3 rounded-xl border border-lost/20">
            ⚠️ This will deactivate the QR code and permanently delete all notification history. This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              Yes, Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>

      {/* Printable Sheet Modal */}
      <PrintableSheet
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        itemName={item.name}
        category={item.category}
        qrId={item.qr_id}
      />
    </div>
  );
};
