import { useState, useEffect, useCallback } from 'react';
import { Save, AlertTriangle, Check, X, Pencil, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { servicePricesApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import GroupTabs from '@/components/shared/GroupTabs';
import PriceChip from '@/components/shared/PriceChip';
import VerificationBanner from '@/components/shared/VerificationBanner';

interface MatrixService {
  id: number;
  name: string;
  slug: string;
  category: string | null;
}

interface MatrixVariant {
  id: number;
  key: string;
  label: string;
}

interface MatrixPrice {
  id: number;
  audience: string;
  staff_tier: string;
  gender_scope: string | null;
  amount: number;
  variant_id: number | null;
  needs_verification: boolean;
  source_ref: string | null;
}

interface MatrixItem {
  service: MatrixService;
  variants: MatrixVariant[];
  prices: MatrixPrice[];
}

const AUDIENCE_LABELS: Record<string, string> = {
  vip: 'VIP',
  non_member: 'Non-Member',
};

const STAFF_TIER_LABELS: Record<string, string> = {
  standard: 'Standard',
  technician: 'Technician',
  senior: 'Senior',
  gender_scope: 'Gender Scope',
};

const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function PricingMatrix() {
  const [matrixData, setMatrixData] = useState<MatrixItem[]>([]);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingAmount, setEditingAmount] = useState('');
  const [pendingChanges, setPendingChanges] = useState<Map<number, { amount?: number }>>(new Map());

  const fetchMatrix = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (activeGroup) params.group_slug = activeGroup;
      const { data } = await servicePricesApi.getMatrix(params);
      const result = data.data;
      setMatrixData(Array.isArray(result) ? result : result?.data || []);
    } catch {
      toast.error('Failed to load pricing matrix');
    } finally {
      setLoading(false);
    }
  }, [activeGroup]);

  useEffect(() => { fetchMatrix(); }, [fetchMatrix]);

  const groups = (() => {
    const seen = new Map<string, number>();
    matrixData.forEach((item) => {
      const category = item.service.category || 'uncategorized';
      seen.set(category, (seen.get(category) || 0) + item.prices.length);
    });
    return Array.from(seen.entries()).map(([label, count]) => ({
      slug: slugify(label),
      label: label.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      count,
    }));
  })();

  const verificationCount = matrixData.reduce(
    (sum, item) => sum + item.prices.filter((p) => p.needs_verification).length,
    0
  );

  const getDisplayAmount = (price: MatrixPrice) => {
    const pending = pendingChanges.get(price.id);
    return pending?.amount !== undefined ? pending.amount : price.amount;
  };

  const startEdit = (price: MatrixPrice) => {
    setEditingId(price.id);
    setEditingAmount(String(getDisplayAmount(price)));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingAmount('');
  };

  const confirmEdit = (price: MatrixPrice) => {
    const parsed = parseFloat(editingAmount);
    if (isNaN(parsed) || parsed < 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (parsed === price.amount) {
      setPendingChanges((prev) => {
        const next = new Map(prev);
        next.delete(price.id);
        return next;
      });
    } else {
      setPendingChanges((prev) => {
        const next = new Map(prev);
        next.set(price.id, { ...next.get(price.id), amount: parsed });
        return next;
      });
    }
    cancelEdit();
  };

  const discardChanges = () => {
    setPendingChanges(new Map());
    cancelEdit();
  };

  const handleBulkSave = async () => {
    if (pendingChanges.size === 0) return;
    setSaving(true);
    try {
      const updates = Array.from(pendingChanges.entries()).map(([id, change]) => ({ id, ...change }));
      await servicePricesApi.bulkUpdate(updates);
      toast.success(`Saved ${updates.length} price update${updates.length !== 1 ? 's' : ''}`);
      setPendingChanges(new Map());
      fetchMatrix();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const renderPriceCell = (price: MatrixPrice) => {
    const isEditing = editingId === price.id;
    const isChanged = pendingChanges.has(price.id);

    if (isEditing) {
      return (
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min="0"
            step="0.01"
            autoFocus
            className="w-24 px-2 py-1 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
            value={editingAmount}
            onChange={(e) => setEditingAmount(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmEdit(price);
              if (e.key === 'Escape') cancelEdit();
            }}
          />
          <button
            onClick={() => confirmEdit(price)}
            className="p-1 rounded-md bg-neutral-900 text-white hover:bg-neutral-700 transition-colors"
            title="Save"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={cancelEdit}
            className="p-1 rounded-md border border-neutral-200 text-neutral-500 hover:border-neutral-400 transition-colors"
            title="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={() => startEdit(price)}
        className={`group inline-flex items-center gap-1.5 rounded-full px-1 py-0.5 -mx-1 transition-colors ${
          isChanged ? 'bg-amber-50' : 'hover:bg-neutral-100'
        }`}
        title="Click to edit price"
      >
        <PriceChip amount={getDisplayAmount(price)} variant={price.audience === 'vip' ? 'vip' : 'default'} />
        <Pencil
          className={`w-3 h-3 ${isChanged ? 'text-amber-600' : 'text-neutral-300 group-hover:text-neutral-500'}`}
        />
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Pricing Matrix</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Multi-dimensional pricing grid across audiences, staff tiers, and service variants
        </p>
      </div>

      <VerificationBanner count={verificationCount} />

      {pendingChanges.size > 0 && (
        <div className="bg-neutral-900 text-white rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <p className="text-sm font-medium">
              {pendingChanges.size} unsaved price change{pendingChanges.size !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={discardChanges}
              disabled={saving}
              className="px-3 py-1.5 text-sm font-medium border border-neutral-600 text-neutral-300 rounded-lg hover:border-neutral-400 hover:text-white disabled:opacity-50 transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleBulkSave}
              disabled={saving}
              className="px-3 py-1.5 text-sm font-medium bg-white text-neutral-900 rounded-lg hover:bg-neutral-200 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {!loading && groups.length > 0 && (
        <GroupTabs groups={groups} activeSlug={activeGroup} onSelect={setActiveGroup} />
      )}

      <div className="card overflow-hidden !p-0">
        {loading ? (
          <LoadingSpinner fullScreen={false} />
        ) : matrixData.length === 0 ? (
          <EmptyState
            title="No prices found"
            description="No pricing entries exist for this selection."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 bg-neutral-50/80 border-b border-neutral-200">
                  <th className="px-6 py-3 font-medium">Service</th>
                  <th className="px-6 py-3 font-medium">Variant</th>
                  <th className="px-6 py-3 font-medium">Audience</th>
                  <th className="px-6 py-3 font-medium">Staff Tier</th>
                  <th className="px-6 py-3 font-medium">Gender Scope</th>
                  <th className="px-6 py-3 font-medium">Price</th>
                  <th className="px-6 py-3 font-medium">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {matrixData.map((item) =>
                  item.prices.map((price, idx) => {
                    const variant = item.variants.find((v) => v.id === price.variant_id);
                    const showServiceCell = idx === 0;
                    return (
                      <tr key={price.id} className="hover:bg-neutral-50/50">
                        {showServiceCell ? (
                          <td
                            rowSpan={item.prices.length}
                            className="px-6 py-4 align-top border-r border-neutral-100 bg-neutral-50/40"
                          >
                            <p className="font-medium text-neutral-900">{item.service.name}</p>
                            {item.service.category && (
                              <p className="text-xs text-neutral-400 uppercase tracking-wider mt-0.5">
                                {item.service.category.replace(/_/g, ' ')}
                              </p>
                            )}
                            <p className="text-xs text-neutral-400 mt-1">
                              {item.prices.length} price entr{item.prices.length !== 1 ? 'ies' : 'y'}
                            </p>
                          </td>
                        ) : null}
                        <td className="px-6 py-4 text-neutral-600">
                          {variant ? variant.label : <span className="text-neutral-300">—</span>}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${
                              price.audience === 'vip'
                                ? 'bg-neutral-900 border-neutral-900 text-white'
                                : 'bg-white border-neutral-200 text-neutral-600'
                            }`}
                          >
                            {AUDIENCE_LABELS[price.audience] || price.audience}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-neutral-600">
                          {STAFF_TIER_LABELS[price.staff_tier] || price.staff_tier}
                        </td>
                        <td className="px-6 py-4 text-neutral-600 capitalize">
                          {price.staff_tier === 'gender_scope' && price.gender_scope
                            ? price.gender_scope
                            : <span className="text-neutral-300">—</span>}
                        </td>
                        <td className="px-6 py-4">{renderPriceCell(price)}</td>
                        <td className="px-6 py-4">
                          {price.needs_verification ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                              <AlertTriangle className="w-3 h-3" />
                              Needs review
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 bg-white border border-neutral-200 rounded-full px-2 py-0.5">
                              <Check className="w-3 h-3" />
                              Verified
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && matrixData.length > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-neutral-400">
          <RotateCcw className="w-3 h-3" />
          Click any price to edit. Changes are staged locally until you save.
        </p>
      )}
    </div>
  );
}
