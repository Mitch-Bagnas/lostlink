import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { AdminItemListItem, PaginationMeta } from '../../types';
import { Spinner } from '../../components/common/Spinner';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { 
  Search, 
  Filter, 
  Package, 
  Trash2, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

export const AdminItems: React.FC = () => {
  const { showToast } = useToast();
  const [items, setItems] = useState<AdminItemListItem[]>([]);
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
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<AdminItemListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchItems = async () => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (statusFilter) params.append('status', statusFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      params.append('page', currentPage.toString());
      params.append('limit', '20');

      const data = await apiClient<{ items: AdminItemListItem[]; pagination: PaginationMeta }>(
        `/admin/items?${params.toString()}`
      );
      setItems(data.items);
      setPagination(data.pagination);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load items.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [currentPage, statusFilter, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchItems();
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await apiClient(`/admin/items/${itemToDelete.id}`, { method: 'DELETE' });
      showToast('success', `Item "${itemToDelete.name}" was removed.`);
      setDeleteModalOpen(false);
      setItemToDelete(null);
      await fetchItems();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete item.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search and Filters */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-line shadow-soft space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search items by name, description, or QR identifier..."
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
            <option value="safe">Safe Only</option>
            <option value="lost">Lost Only</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-line bg-paper text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-sky"
          >
            <option value="">All Categories</option>
            <option value="Wallet">Wallet</option>
            <option value="Bag">Bag</option>
            <option value="ID">ID / Cards</option>
            <option value="Gadget">Gadget</option>
            <option value="School Supplies">School Supplies</option>
            <option value="Other">Other</option>
          </select>

          {(searchTerm || statusFilter || categoryFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setCategoryFilter('');
                setCurrentPage(1);
              }}
              className="px-3 py-1 text-xs font-semibold text-lost hover:underline ml-auto"
            >
              Reset Filters
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
          <p className="text-sm font-medium text-muted">Retrieving platform items...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-line shadow-soft space-y-3">
          <Package className="w-10 h-10 text-muted mx-auto" />
          <h3 className="text-base font-bold text-ink">No items match your criteria</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Try adjusting search terms or resetting filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-line shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-paper border-b border-line text-[11px] font-black text-muted uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Item</th>
                    <th className="py-3.5 px-4">Owner</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-center">Alerts</th>
                    <th className="py-3.5 px-4">Created</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-paper/50 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-bold text-ink text-sm">{item.name}</div>
                        <div className="font-mono text-[10px] text-muted">{item.qr_id}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-ink">{item.owner_name}</div>
                        <div className="text-[11px] text-muted font-mono">{item.owner_email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-muted">{item.category}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'lost' ? 'bg-lost-light text-lost' : 'bg-safe-light text-safe'
                        }`}>
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-ink">
                        {item.notifications_count}
                      </td>
                      <td className="py-3.5 px-4 text-muted">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right space-x-2">
                        <a
                          href={`/found/${item.qr_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-sky hover:underline font-bold"
                          title="Open public scan page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setItemToDelete(item);
                            setDeleteModalOpen(true);
                          }}
                          className="text-muted hover:text-lost transition-colors p-1"
                          title="Delete abusive or invalid item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
                Showing {items.length} of {pagination.total} items (Page {pagination.page} of {pagination.totalPages})
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

      {/* Delete Item Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Remove Abusive / Invalid Item"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-2xl bg-lost-light border border-lost/20 text-lost font-medium flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Are you sure you want to permanently delete "{itemToDelete?.name}"? All associated QR data and scan notifications will be purged.
            </span>
          </div>

          <p className="text-muted">
            Owner: <strong className="text-ink">{itemToDelete?.owner_email}</strong>
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={confirmDeleteItem}
            >
              Confirm Removal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
