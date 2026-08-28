import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';
import { membershipFamiliesApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import PriceChip from '@/components/shared/PriceChip';

interface FamilyPlan {
  id: number;
  variant_code: string;
  term_months: number;
  max_persons: number;
  regular_price?: number | string | null;
  add_on_price?: number | string | null;
  [key: string]: any;
}

interface MembershipFamily {
  id: number;
  code: string;
  name: string;
  tagline?: string | null;
  description?: string | null;
  eligible_categories?: string[] | null;
  is_active: boolean;
  plans?: FamilyPlan[];
  benefits?: any[];
}

export default function MembershipFamilies() {
  const [families, setFamilies] = useState<MembershipFamily[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  useEffect(() => {
    const fetchFamilies = async () => {
      setLoading(true);
      try {
        const { data } = await membershipFamiliesApi.list({ include_plans: 'true' });
        const result = data.data?.data || data.data || [];
        setFamilies(result);
        setExpandedIds(result.map((f: MembershipFamily) => f.id));
      } catch {
        // handled by empty state
      } finally {
        setLoading(false);
      }
    };
    fetchFamilies();
  }, []);

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const getBenefitLabel = (benefit: any): { title: string; description?: string } => {
    if (typeof benefit === 'string') return { title: benefit };
    return {
      title: benefit?.title || benefit?.name || benefit?.label || 'Benefit',
      description: benefit?.description,
    };
  };

  const formatTerm = (months: number) => (months === 1 ? 'Monthly' : `${months} months`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Membership Families</h1>
        <p className="text-sm text-neutral-500 mt-1">Browse membership families, plans, and benefits</p>
      </div>

      {loading ? (
        <div className="card">
          <LoadingSpinner fullScreen={false} />
        </div>
      ) : families.length === 0 ? (
        <div className="card">
          <EmptyState title="No membership families found" description="Membership families will appear here once configured." />
        </div>
      ) : (
        <div className="space-y-4">
          {families.map((family) => {
            const isExpanded = expandedIds.includes(family.id);
            return (
              <div key={family.id} className="card !p-0 overflow-hidden">
                {/* Card Header */}
                <button
                  onClick={() => toggleExpanded(family.id)}
                  className="w-full flex items-start gap-4 px-6 py-5 text-left hover:bg-neutral-50/50 transition"
                >
                  <span className="mt-0.5 p-2 rounded-lg bg-neutral-100 text-neutral-600 shrink-0">
                    <Users size={20} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-neutral-900">{family.name}</h3>
                      {!family.is_active && (
                        <span className="text-xs font-medium text-neutral-500 border border-neutral-200 px-2 py-0.5 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    {family.tagline && <p className="text-sm font-medium text-neutral-700 mt-1">{family.tagline}</p>}
                    {family.description && <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{family.description}</p>}
                    <p className="text-xs text-neutral-400 mt-2">
                      {family.plans?.length || 0} plan{(family.plans?.length || 0) === 1 ? '' : 's'} · {family.benefits?.length || 0} benefit{(family.benefits?.length || 0) === 1 ? '' : 's'}
                    </p>
                  </div>
                  <span className="text-neutral-400 shrink-0 mt-1">
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </span>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-neutral-100 px-6 py-5 space-y-6 bg-neutral-50/40">
                    {/* Plans Table */}
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-900 mb-3">Plans</h4>
                      {!family.plans || family.plans.length === 0 ? (
                        <p className="text-sm text-neutral-400">No plans configured for this family.</p>
                      ) : (
                        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-neutral-500 bg-neutral-50/80 border-b border-neutral-200">
                                <th className="px-4 py-2.5 font-medium">Variant</th>
                                <th className="px-4 py-2.5 font-medium">Term</th>
                                <th className="px-4 py-2.5 font-medium">Max Persons</th>
                                <th className="px-4 py-2.5 font-medium">Base Price / Month</th>
                                <th className="px-4 py-2.5 font-medium">Add-on Price</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                              {family.plans.map((plan) => (
                                <tr key={plan.id} className="hover:bg-neutral-50/50">
                                  <td className="px-4 py-3 font-medium text-neutral-900 capitalize">{plan.variant_code}</td>
                                  <td className="px-4 py-3 text-neutral-600">{formatTerm(plan.term_months)}</td>
                                  <td className="px-4 py-3 text-neutral-600">{plan.max_persons}</td>
                                  <td className="px-4 py-3">
                                    {plan.regular_price != null && Number(plan.regular_price) > 0 ? (
                                      <PriceChip amount={Number(plan.regular_price)} variant="default" />
                                    ) : (
                                      <span className="text-neutral-400">—</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    {plan.add_on_price != null && Number(plan.add_on_price) > 0 ? (
                                      <PriceChip amount={Number(plan.add_on_price)} variant="regular" />
                                    ) : (
                                      <span className="text-neutral-400">—</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Benefits List */}
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-900 mb-3">Benefits</h4>
                      {!family.benefits || family.benefits.length === 0 ? (
                        <p className="text-sm text-neutral-400">No benefits listed for this family.</p>
                      ) : (
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {family.benefits.map((benefit, idx) => {
                            const { title, description } = getBenefitLabel(benefit);
                            return (
                              <li key={idx} className="flex items-start gap-2 text-sm bg-white border border-neutral-200 rounded-lg px-3 py-2.5">
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-neutral-900 shrink-0" />
                                <div>
                                  <span className="font-medium text-neutral-800">{title}</span>
                                  {description && <p className="text-xs text-neutral-500 mt-0.5">{description}</p>}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    {/* Eligible Categories */}
                    {family.eligible_categories && family.eligible_categories.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-neutral-900 mb-2">Eligible Categories</h4>
                        <div className="flex flex-wrap gap-2">
                          {family.eligible_categories.map((cat) => (
                            <span key={cat} className="text-xs font-medium capitalize text-neutral-600 border border-neutral-200 bg-white px-2.5 py-1 rounded-full">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
