import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Tag,
  Coins,
  Sparkles,
  Layers,
  ArrowUpDown,
  History,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Percent,
  Plus,
  Minus,
  Check,
  X,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchStoreItems,
  updateSingleItemPricing,
  previewBulkPriceChanges,
  executeBulkPriceChanges,
  fetchPriceHistory,
  seedStoreItemsIfEmpty,
  type StoreItemDoc,
  type StoreCategory,
  type StoreItemType,
  type BulkAdjustmentMode,
  type BulkFilterParams,
  type BulkPreviewResult,
  type PriceHistoryRecord,
} from '@/services/storePricingService';

interface StorePricingManagerProps {
  onBack?: () => void;
  isModal?: boolean;
}

export function StorePricingManager({ onBack, isModal = false }: StorePricingManagerProps) {
  const { user } = useAuth();
  const superAdminEmail = user?.email || 'shsvirtualadmin@gmail.com';

  const [activeTab, setActiveTab] = useState<'items' | 'bulk' | 'history'>('items');
  const [items, setItems] = useState<StoreItemDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filter & Search states for Item tab
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | StoreCategory>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | StoreItemType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Single Item Edit states
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editPriceInput, setEditPriceInput] = useState<number>(0);
  const [isSavingSingle, setIsSavingSingle] = useState(false);

  // Bulk Price Manager states
  const [bulkCategory, setBulkCategory] = useState<'all' | StoreCategory>('nameplate');
  const [bulkType, setBulkType] = useState<'both' | 'static' | 'animated'>('static');
  const [bulkMode, setBulkMode] = useState<BulkAdjustmentMode>('exact');
  const [bulkValue, setBulkValue] = useState<number>(300);
  const [bulkPreview, setBulkPreview] = useState<BulkPreviewResult | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isExecutingBulk, setIsExecutingBulk] = useState(false);

  // History states
  const [historyRecords, setHistoryRecords] = useState<PriceHistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const showNotice = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  }, []);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchStoreItems();
      setItems(data);
    } catch (err) {
      console.error('[StorePricingManager] Load items error:', err);
      showNotice('error', 'Failed to load store items');
    } finally {
      setLoading(false);
    }
  }, [showNotice]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const data = await fetchPriceHistory(50);
      setHistoryRecords(data);
    } catch (err) {
      console.error('[StorePricingManager] Load history error:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab, loadHistory]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const count = await seedStoreItemsIfEmpty(superAdminEmail);
      showNotice('success', `Initialized ${count} cosmetics catalog items in Firestore store_items!`);
      await loadItems();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to seed store items';
      showNotice('error', msg);
    } finally {
      setSeeding(false);
    }
  };

  // Filtered items list for the items tab
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (statusFilter === 'active' && !item.active) return false;
      if (statusFilter === 'inactive' && item.active) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesId = item.id.toLowerCase().includes(q);
        if (!matchesName && !matchesId) return false;
      }
      return true;
    });
  }, [items, categoryFilter, typeFilter, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((i) => i.active).length;
    const inactive = total - active;
    const avgPrice = total > 0 ? Math.round(items.reduce((acc, i) => acc + i.priceKobans, 0) / total) : 0;
    return { total, active, inactive, avgPrice };
  }, [items]);

  // Handle single item price update
  const handleSaveSinglePrice = async (item: StoreItemDoc) => {
    setIsSavingSingle(true);
    try {
      await updateSingleItemPricing(
        superAdminEmail,
        item.id,
        { priceKobans: editPriceInput },
        item
      );
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, priceKobans: editPriceInput } : it))
      );
      setEditingItemId(null);
      showNotice('success', `Updated ${item.name} price to ${editPriceInput.toLocaleString()} Kobans`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update price';
      showNotice('error', msg);
    } finally {
      setIsSavingSingle(false);
    }
  };

  // Handle toggling active state of an item
  const handleToggleActive = async (item: StoreItemDoc) => {
    const nextState = !item.active;
    try {
      await updateSingleItemPricing(
        superAdminEmail,
        item.id,
        { active: nextState },
        item
      );
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, active: nextState } : it))
      );
      showNotice('success', `${item.name} is now ${nextState ? 'Active' : 'Inactive'}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to toggle status';
      showNotice('error', msg);
    }
  };

  // Preview Bulk Price Change
  const handleCalculateBulkPreview = () => {
    const params: BulkFilterParams = {
      category: bulkCategory,
      type: bulkType,
      mode: bulkMode,
      value: Number(bulkValue),
    };
    const result = previewBulkPriceChanges(items, params);
    setBulkPreview(result);
    setShowPreviewModal(true);
  };

  // Execute Bulk Price Change
  const handleExecuteBulkUpdate = async () => {
    if (!bulkPreview || bulkPreview.affectedItems.length === 0) return;
    setIsExecutingBulk(true);

    const categoryLabel =
      bulkCategory === 'all'
        ? 'ALL categories'
        : bulkCategory === 'avatar_frame'
        ? 'avatar frames'
        : bulkCategory === 'profile_effect'
        ? 'profile effects'
        : `${bulkCategory}s`;

    const typeLabel = bulkType === 'both' ? 'both static & animated' : `${bulkType} only`;
    const modeDesc =
      bulkMode === 'exact'
        ? `set to ${bulkValue} Kobans`
        : bulkMode === 'percentage_increase'
        ? `increased by ${bulkValue}%`
        : bulkMode === 'percentage_decrease'
        ? `decreased by ${bulkValue}%`
        : bulkMode === 'fixed_increase'
        ? `increased by +${bulkValue} Kobans`
        : `decreased by -${bulkValue} Kobans`;

    const summary = `Bulk Update: ${categoryLabel} (${typeLabel}) ${modeDesc}`;

    try {
      const { updatedCount } = await executeBulkPriceChanges(
        superAdminEmail,
        bulkPreview,
        summary,
        bulkMode
      );

      showNotice('success', `Successfully updated prices for ${updatedCount} items!`);
      setShowPreviewModal(false);
      setBulkPreview(null);
      await loadItems();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bulk update failed';
      showNotice('error', msg);
    } finally {
      setIsExecutingBulk(false);
    }
  };

  return (
    <div className={`w-full max-w-6xl mx-auto ${isModal ? 'p-4 sm:p-6' : 'p-3 sm:p-6'} space-y-6 text-[var(--text)]`}>
      {/* ─── HEADER BAR ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
              <Coins size={20} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-heading font-bold text-[var(--text)] flex items-center gap-2">
                <span>Store Pricing Control</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                  Super Admin
                </span>
              </h1>
              <p className="text-xs text-[var(--muted)]">
                Manage Koban prices, execute atomic bulk price shifts, and toggle active store items
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <button
            type="button"
            onClick={handleSeed}
            disabled={seeding}
            className="px-3 py-2 rounded-xl text-xs font-heading font-semibold border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Seed any missing catalog items into Firestore"
          >
            {seeding ? <Loader2 size={14} className="animate-spin text-red-500" /> : <RefreshCw size={14} />}
            <span>Sync Catalog</span>
          </button>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-3.5 py-2 rounded-xl text-xs font-heading font-semibold bg-[var(--card-2)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* ─── NOTIFICATION TOAST ──────────────────────────────────────────────── */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs animate-in fade-in duration-150 ${
            notification.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/40 border-red-500/40 text-red-300'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-red-400 shrink-0" />
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* ─── KOBAN MINIMUM RULE & GUARDRAILS NOTICE ─────────────────────────── */}
      <div className="p-4 rounded-2xl bg-[var(--card-2)] border border-[var(--border)] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
            <ShieldCheck size={18} />
          </div>
          <div className="space-y-0.5 text-xs">
            <div className="font-heading font-semibold text-[var(--text)] flex items-center gap-2">
              <span>Pricing Rules &amp; Student Guardrails</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                1 PKR = 10 Kobans
              </span>
            </div>
            <p className="text-[var(--muted)] leading-relaxed">
              <strong>Minimum Purchase:</strong> Students can buy any amount of Kobans with a strict minimum of{' '}
              <span className="text-amber-400 font-bold">500 Kobans for PKR 50</span> (multiples of 10). Items priced at{' '}
              <span className="text-emerald-400 font-bold">0 Kobans</span> are free drops. Inactive items are hidden from
              regular students.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-center">
            <span className="block text-[10px] text-[var(--muted)]">TOTAL ITEMS</span>
            <span className="font-bold text-[var(--text)]">{stats.total}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-center">
            <span className="block text-[10px] text-emerald-400">ACTIVE</span>
            <span className="font-bold text-emerald-400">{stats.active}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-center">
            <span className="block text-[10px] text-amber-400">AVG PRICE</span>
            <span className="font-bold text-amber-400">{stats.avgPrice} 🪙</span>
          </div>
        </div>
      </div>

      {/* ─── TAB NAVIGATION ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('items')}
          className={`px-4 py-2 rounded-xl text-xs font-heading font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'items'
              ? 'bg-[var(--card-2)] text-[var(--text)] border border-[var(--border)] shadow-xs'
              : 'text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          <Tag size={15} />
          <span>Single Item Pricing</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[var(--card)] text-[var(--muted)] font-bold">
            {stats.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bulk')}
          className={`px-4 py-2 rounded-xl text-xs font-heading font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'bulk'
              ? 'bg-[var(--card-2)] text-[var(--text)] border border-[var(--border)] shadow-xs'
              : 'text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          <Layers size={15} className="text-red-500" />
          <span>Bulk Price Manager</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-400 font-bold">
            Batched Writes
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-heading font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'history'
              ? 'bg-[var(--card-2)] text-[var(--text)] border border-[var(--border)] shadow-xs'
              : 'text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          <History size={15} />
          <span>Price Change History</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 1: SINGLE ITEM PRICING & QUICK EDIT
         ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-3.5 rounded-2xl bg-[var(--card-2)] border border-[var(--border)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <div className="relative w-full">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search item name or ID..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--text)] placeholder-[var(--muted)] outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Category */}
              <div className="flex items-center gap-1 bg-[var(--card)] border border-[var(--border)] rounded-xl px-2.5 py-1">
                <Filter size={12} className="text-[var(--muted)]" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as any)}
                  className="bg-transparent text-xs text-[var(--text)] font-heading outline-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="banner">Banners</option>
                  <option value="avatar_frame">Avatar Frames</option>
                  <option value="profile_effect">Profile Effects</option>
                  <option value="nameplate">Nameplates</option>
                  <option value="avatar">Profile Avatars</option>
                </select>
              </div>

              {/* Type */}
              <div className="flex items-center gap-1 bg-[var(--card)] border border-[var(--border)] rounded-xl px-2.5 py-1">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="bg-transparent text-xs text-[var(--text)] font-heading outline-none cursor-pointer"
                >
                  <option value="all">All Types (Static &amp; Animated)</option>
                  <option value="static">Static Only</option>
                  <option value="animated">Animated Only</option>
                </select>
              </div>

              {/* Status */}
              <div className="flex items-center gap-1 bg-[var(--card)] border border-[var(--border)] rounded-xl px-2.5 py-1">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-transparent text-xs text-[var(--text)] font-heading outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Items Table / Cards */}
          {loading ? (
            <div className="p-12 text-center text-[var(--muted)] flex flex-col items-center justify-center gap-2">
              <Loader2 size={24} className="animate-spin text-red-500" />
              <p className="text-xs">Loading store catalog pricing...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] space-y-2">
              <p className="text-sm font-semibold">No store items match your filter.</p>
              <p className="text-xs">Try clearing filters or search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredItems.map((item) => {
                const isEditing = editingItemId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl bg-[var(--card)] border transition-all flex flex-col justify-between gap-3 shadow-xs ${
                      !item.active
                        ? 'opacity-65 border-dashed border-zinc-700'
                        : 'border-[var(--border)] hover:border-zinc-600'
                    }`}
                  >
                    {/* Item Card Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-[var(--card-2)] border border-[var(--border)] text-[var(--muted)]">
                            {item.category.replace('_', ' ')}
                          </span>
                          <span
                            className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded ${
                              item.type === 'animated'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-[var(--card-2)] text-[var(--muted)]'
                            }`}
                          >
                            {item.type}
                          </span>
                        </div>
                        <h3 className="font-heading font-semibold text-xs text-[var(--text)] truncate">
                          {item.name}
                        </h3>
                        <p className="text-[10px] font-mono text-[var(--muted)] truncate">{item.id}</p>
                      </div>

                      {/* Active/Inactive Toggle Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item)}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                          item.active
                            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400 hover:bg-emerald-950/60'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                        }`}
                        title={item.active ? 'Active in Store (Click to deactivate)' : 'Inactive (Click to activate)'}
                      >
                        {item.active ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                    </div>

                    {/* Price & Edit Controls */}
                    <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-2">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 w-full">
                          <div className="relative flex-1">
                            <input
                              type="number"
                              min={0}
                              value={editPriceInput}
                              onChange={(e) => setEditPriceInput(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-full px-2.5 py-1 rounded-lg bg-[var(--card-2)] border border-red-500 text-xs font-mono font-bold text-[var(--text)] outline-none"
                              autoFocus
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted)]">
                              🪙
                            </span>
                          </div>

                          <button
                            type="button"
                            disabled={isSavingSingle}
                            onClick={() => handleSaveSinglePrice(item)}
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer disabled:opacity-50"
                            title="Save new price"
                          >
                            {isSavingSingle ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingItemId(null)}
                            className="p-1.5 rounded-lg bg-[var(--card-2)] border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--muted)] transition-colors cursor-pointer"
                            title="Cancel"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-mono font-bold text-[var(--text)]">
                              {item.priceKobans.toLocaleString()}
                            </span>
                            <span className="text-[10px] font-mono text-[var(--muted)]">Kobans</span>
                            {item.priceKobans === 0 && (
                              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                                FREE
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingItemId(item.id);
                                setEditPriceInput(item.priceKobans);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[var(--card-2)] border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[11px] font-heading font-semibold text-[var(--text)] transition-colors cursor-pointer"
                            >
                              Edit Price
                            </button>
                            {item.priceKobans !== 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  updateSingleItemPricing(superAdminEmail, item.id, { priceKobans: 0 }, item);
                                  setItems((prev) =>
                                    prev.map((it) => (it.id === item.id ? { ...it, priceKobans: 0 } : it))
                                  );
                                  showNotice('success', `Set ${item.name} to FREE (0 Kobans)`);
                                }}
                                className="px-2 py-1 rounded-lg text-[10px] font-mono text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/30 transition-colors cursor-pointer"
                                title="Quick set to 0 Kobans (Free drop)"
                              >
                                Set Free
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 2: BULK PRICE MANAGER (BATCHED WRITES)
         ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'bulk' && (
        <div className="p-4 sm:p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-md space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-heading font-bold text-[var(--text)] flex items-center gap-2">
              <Layers size={18} className="text-red-500" />
              <span>Bulk Price Update Engine</span>
            </h2>
            <p className="text-xs text-[var(--muted)]">
              Update multiple store items in one batched transaction (Firestore writes are auto-chunked into batches of
              up to 450). Previews show exact before and after prices with delta changes.
            </p>
          </div>

          {/* Bulk Selectors Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-[var(--card-2)] border border-[var(--border)]">
            {/* 1. Category Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-heading font-semibold text-[var(--text)] block">
                1. Category
              </label>
              <select
                value={bulkCategory}
                onChange={(e) => setBulkCategory(e.target.value as any)}
                className="w-full text-xs bg-[var(--card)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] font-heading outline-none focus:border-red-500 cursor-pointer"
              >
                <option value="nameplate">Nameplates</option>
                <option value="avatar_frame">Avatar Frames</option>
                <option value="banner">Banners</option>
                <option value="profile_effect">Profile Effects</option>
                <option value="avatar">Profile Avatars</option>
                <option value="all">★ All Categories (Entire Catalog)</option>
              </select>
            </div>

            {/* 2. Type Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-heading font-semibold text-[var(--text)] block">
                2. Type
              </label>
              <select
                value={bulkType}
                onChange={(e) => setBulkType(e.target.value as any)}
                className="w-full text-xs bg-[var(--card)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] font-heading outline-none focus:border-red-500 cursor-pointer"
              >
                <option value="static">Static Only</option>
                <option value="animated">Animated Only</option>
                <option value="both">Both (Static &amp; Animated)</option>
              </select>
            </div>

            {/* 3. Adjustment Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-heading font-semibold text-[var(--text)] block">
                3. Adjustment Mode
              </label>
              <select
                value={bulkMode}
                onChange={(e) => setBulkMode(e.target.value as any)}
                className="w-full text-xs bg-[var(--card)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] font-heading outline-none focus:border-red-500 cursor-pointer"
              >
                <option value="exact">Set Exact Price (Kobans)</option>
                <option value="percentage_increase">Increase by Percentage (+%)</option>
                <option value="percentage_decrease">Decrease by Percentage (-%)</option>
                <option value="fixed_increase">Increase by Fixed (+ Kobans)</option>
                <option value="fixed_decrease">Decrease by Fixed (- Kobans)</option>
              </select>
            </div>

            {/* 4. Value Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-heading font-semibold text-[var(--text)] block">
                4. Value {bulkMode.includes('percentage') ? '(%)' : '(Kobans)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  value={bulkValue}
                  onChange={(e) => setBulkValue(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="e.g. 300"
                  className="w-full text-xs font-mono font-bold bg-[var(--card)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] outline-none focus:border-red-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)]">
                  {bulkMode.includes('percentage') ? '%' : '🪙'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase text-[var(--muted)]">Common Presets:</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setBulkCategory('nameplate');
                  setBulkType('static');
                  setBulkMode('exact');
                  setBulkValue(300);
                }}
                className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card-2)] hover:border-red-500 text-xs font-heading transition-colors cursor-pointer"
              >
                Set ALL static nameplates to 300 Kobans
              </button>

              <button
                type="button"
                onClick={() => {
                  setBulkCategory('avatar_frame');
                  setBulkType('animated');
                  setBulkMode('exact');
                  setBulkValue(800);
                }}
                className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card-2)] hover:border-red-500 text-xs font-heading transition-colors cursor-pointer"
              >
                Set ALL animated avatar frames to 800 Kobans
              </button>

              <button
                type="button"
                onClick={() => {
                  setBulkCategory('banner');
                  setBulkType('animated');
                  setBulkMode('exact');
                  setBulkValue(1200);
                }}
                className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card-2)] hover:border-red-500 text-xs font-heading transition-colors cursor-pointer"
              >
                Set ALL animated banners to 1,200 Kobans
              </button>

              <button
                type="button"
                onClick={() => {
                  setBulkCategory('all');
                  setBulkType('both');
                  setBulkMode('percentage_decrease');
                  setBulkValue(20);
                }}
                className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card-2)] hover:border-amber-500 text-xs font-heading text-amber-300 transition-colors cursor-pointer"
              >
                -20% Flash Sale across entire store
              </button>
            </div>
          </div>

          {/* Preview Action Trigger */}
          <div className="pt-2 flex items-center justify-end">
            <button
              type="button"
              onClick={handleCalculateBulkPreview}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-heading font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
            >
              <span>Generate Preview</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 3: PRICE CHANGE HISTORY AUDIT LOG
         ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div className="p-4 sm:p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-base font-heading font-bold text-[var(--text)] flex items-center gap-2">
                <History size={18} className="text-red-500" />
                <span>Price Change Audit Log</span>
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Chronological log of Super Admin price adjustments and bulk updates
              </p>
            </div>

            <button
              type="button"
              onClick={loadHistory}
              disabled={loadingHistory}
              className="p-2 rounded-xl bg-[var(--card-2)] border border-[var(--border)] hover:bg-[var(--surface-hover)] text-xs text-[var(--text)] transition-colors cursor-pointer"
              title="Refresh history"
            >
              <RefreshCw size={14} className={loadingHistory ? 'animate-spin text-red-500' : ''} />
            </button>
          </div>

          {loadingHistory ? (
            <div className="p-10 text-center flex flex-col items-center justify-center gap-2 text-[var(--muted)]">
              <Loader2 size={20} className="animate-spin text-red-500" />
              <p className="text-xs">Loading audit records...</p>
            </div>
          ) : historyRecords.length === 0 ? (
            <div className="p-10 text-center rounded-xl bg-[var(--card-2)] border border-[var(--border)] text-[var(--muted)] text-xs">
              No price change records found yet. Any single or bulk price edits will be logged here.
            </div>
          ) : (
            <div className="space-y-3">
              {historyRecords.map((rec) => {
                const dateStr = rec.timestamp
                  ? new Date((rec.timestamp as any)?.seconds ? (rec.timestamp as any).seconds * 1000 : Date.now()).toLocaleString()
                  : 'Just now';

                return (
                  <div
                    key={rec.id}
                    className="p-3.5 rounded-xl bg-[var(--card-2)] border border-[var(--border)] text-xs space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[var(--border)]/60 pb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading font-bold text-[var(--text)]">{rec.filterSummary}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                          {rec.affectedCount} item{rec.affectedCount === 1 ? '' : 's'}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-[var(--muted)] flex items-center gap-2">
                        <span>by {rec.changedBy}</span>
                        <span>·</span>
                        <span>{dateStr}</span>
                      </div>
                    </div>

                    {rec.changesSample && rec.changesSample.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                        {rec.changesSample.map((samp, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[11px] flex items-center justify-between"
                          >
                            <span className="truncate max-w-[130px] font-heading text-[var(--text)]">
                              {samp.itemName}
                            </span>
                            <div className="flex items-center gap-1.5 font-mono">
                              <span className="text-[var(--muted)] line-through">{samp.oldPrice}</span>
                              <span className="text-[var(--muted)]">→</span>
                              <span className="font-bold text-amber-400">{samp.newPrice} 🪙</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          BULK PREVIEW MODAL BEFORE CONFIRMATION
         ══════════════════════════════════════════════════════════════════════════ */}
      {showPreviewModal && bulkPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 space-y-5 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <h3 className="font-heading font-bold text-sm sm:text-base text-[var(--text)]">
                    Confirm Bulk Price Update
                  </h3>
                </div>
                <p className="text-xs text-[var(--muted)]">
                  Previewing price changes for{' '}
                  <strong className="text-red-400">{bulkPreview.totalMatches} items</strong> matching your filters
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1.5 text-[var(--muted)] hover:text-[var(--text)] rounded-lg hover:bg-[var(--card-2)] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Summary details */}
            <div className="p-3.5 rounded-xl bg-[var(--card-2)] border border-[var(--border)] grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div>
                <span className="block text-[10px] text-[var(--muted)] font-mono">TARGET ITEMS</span>
                <span className="font-bold text-[var(--text)] text-sm">{bulkPreview.totalMatches}</span>
              </div>
              <div>
                <span className="block text-[10px] text-[var(--muted)] font-mono">CATEGORY</span>
                <span className="font-bold text-[var(--text)] capitalize">{bulkCategory.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="block text-[10px] text-[var(--muted)] font-mono">TYPE</span>
                <span className="font-bold text-[var(--text)] capitalize">{bulkType}</span>
              </div>
              <div>
                <span className="block text-[10px] text-[var(--muted)] font-mono">ADJUSTMENT</span>
                <span className="font-bold text-amber-400 capitalize">
                  {bulkMode.replace('_', ' ')}: {bulkValue}
                </span>
              </div>
            </div>

            {/* Examples preview list */}
            <div className="space-y-2">
              <span className="text-xs font-heading font-semibold text-[var(--text)] block">
                Sample Items (First {Math.min(8, bulkPreview.affectedItems.length)} of {bulkPreview.totalMatches}):
              </span>

              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {bulkPreview.affectedItems.slice(0, 10).map((it) => (
                  <div
                    key={it.id}
                    className="p-2.5 rounded-xl bg-[var(--card-2)] border border-[var(--border)] flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-heading font-medium text-[var(--text)] truncate">{it.name}</p>
                      <p className="text-[10px] font-mono text-[var(--muted)]">
                        {it.category} · {it.type}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 font-mono shrink-0">
                      <span className="text-[var(--muted)] line-through">{it.oldPrice}</span>
                      <span className="text-[var(--muted)]">→</span>
                      <span className="font-bold text-amber-400">{it.newPrice} 🪙</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                          it.diff > 0
                            ? 'bg-amber-500/20 text-amber-400'
                            : it.diff < 0
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {it.diff > 0 ? `+${it.diff}` : it.diff}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-heading font-semibold bg-[var(--card-2)] border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--muted)] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isExecutingBulk || bulkPreview.totalMatches === 0}
                onClick={handleExecuteBulkUpdate}
                className="px-5 py-2.5 rounded-xl text-xs font-heading font-bold bg-red-600 hover:bg-red-500 text-white shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isExecutingBulk ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Committing Firestore Batches...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Confirm &amp; Apply Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
