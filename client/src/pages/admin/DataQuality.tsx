import { useState, useEffect, useCallback } from 'react';
import { PlayCircle, CheckCircle, XCircle, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { dataQualityApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';

interface DataQualitySummary {
  total: number;
  by_status: {
    open: number;
    resolved: number;
    waived: number;
  };
  by_severity: {
    info: number;
    warning: number;
    critical: number;
  };
}

interface DataQualityIssue {
  id: number;
  title: string;
  issue_type: string;
  severity: string;
  status: string;
  service_id: number | null;
  created_at: string;
}

const severityColors: Record<string, string> = {
  info: 'badge-info',
  warning: 'badge-warning',
  critical: 'badge-danger',
};

export default function DataQuality() {
  const [summary, setSummary] = useState<DataQualitySummary | null>(null);
  const [issues, setIssues] = useState<DataQualityIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchSummary = useCallback(async () => {
    try {
      const { data } = await dataQualityApi.getSummary();
      setSummary(data.data);
    } catch {
      toast.error('Failed to load summary');
    }
  }, []);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '10' };
      if (statusFilter) params.status = statusFilter;
      if (severityFilter) params.severity = severityFilter;
      if (typeFilter) params.issue_type = typeFilter;
      const { data } = await dataQualityApi.list(params);
      const result = data.data;
      setIssues(result?.data || []);
      setTotalPages(result?.pagination?.totalPages || 1);
      setTotal(result?.pagination?.total || 0);
    } catch {
      toast.error('Failed to load issues');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, severityFilter, typeFilter]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, severityFilter, typeFilter]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handleScan = async () => {
    setScanning(true);
    try {
      await dataQualityApi.scan();
      toast.success('Data quality scan completed');
      await Promise.all([fetchSummary(), fetchIssues()]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handleResolve = async (issue: DataQualityIssue) => {
    try {
      await dataQualityApi.resolve(issue.id, { status: 'resolved' });
      toast.success('Issue resolved');
      await Promise.all([fetchSummary(), fetchIssues()]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to resolve issue');
    }
  };

  const handleWaive = async (issue: DataQualityIssue) => {
    try {
      await dataQualityApi.resolve(issue.id, { status: 'waived' });
      toast.success('Issue waived');
      await Promise.all([fetchSummary(), fetchIssues()]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to waive issue');
    }
  };

  const formatDate = (d: string) => (d ? new Date(d).toLocaleDateString() : '—');

  const statCards = [
    { label: 'Total Issues', value: summary?.total ?? 0 },
    { label: 'Open', value: summary?.by_status?.open ?? 0 },
    { label: 'Resolved', value: summary?.by_status?.resolved ?? 0 },
    { label: 'Waived', value: summary?.by_status?.waived ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Data Quality</h1>
          <p className="text-sm text-neutral-500 mt-1">Monitor and resolve data integrity issues</p>
        </div>
        <button onClick={handleScan} disabled={scanning} className="btn-primary flex items-center gap-2">
          <PlayCircle size={16} />
          {scanning ? 'Scanning...' : 'Run Scan'}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="card">
            <p className="text-xs text-neutral-500 font-medium">{card.label}</p>
            <p className="text-2xl font-bold text-neutral-900 mt-0.5">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="card pb-0">
        <div className="flex flex-wrap items-center gap-3 pb-4">
          <div className="flex items-center gap-2 text-sm text-neutral-500 font-medium">
            <Filter size={16} />
            Filters
          </div>
          <select
            className="select-field w-auto"
            value={statusFilter ?? ''}
            onChange={(e) => setStatusFilter(e.target.value || null)}
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="waived">Waived</option>
          </select>
          <select
            className="select-field w-auto"
            value={severityFilter ?? ''}
            onChange={(e) => setSeverityFilter(e.target.value || null)}
          >
            <option value="">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
          <select
            className="select-field w-auto"
            value={typeFilter ?? ''}
            onChange={(e) => setTypeFilter(e.target.value || null)}
          >
            <option value="">All Types</option>
            <option value="missing_price">Missing Price</option>
            <option value="ambiguous_pricing">Ambiguous Pricing</option>
            <option value="unavailable_option">Unavailable Option</option>
            <option value="precision_anomaly">Precision Anomaly</option>
            <option value="pdf_mismatch">PDF Mismatch</option>
            <option value="duplicate_name">Duplicate Name</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden !p-0">
        {loading ? (
          <LoadingSpinner fullScreen={false} />
        ) : issues.length === 0 ? (
          <EmptyState title="No issues found" description="Run a scan to check for data quality problems." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 bg-neutral-50/80 border-b border-neutral-200">
                  <th className="px-6 py-3 font-medium">Title</th>
                  <th className="px-6 py-3 font-medium">Issue Type</th>
                  <th className="px-6 py-3 font-medium">Severity</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Service ID</th>
                  <th className="px-6 py-3 font-medium">Created At</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-neutral-50/50">
                    <td className="px-6 py-4 font-medium text-neutral-900">{issue.title}</td>
                    <td className="px-6 py-4 text-neutral-600">{issue.issue_type.replace(/_/g, ' ')}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${severityColors[issue.severity] || 'badge-neutral'}`}>
                        {issue.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={issue.status} /></td>
                    <td className="px-6 py-4 text-neutral-600">{issue.service_id ?? '—'}</td>
                    <td className="px-6 py-4 text-neutral-600">{formatDate(issue.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {issue.status === 'open' && (
                          <>
                            <button
                              onClick={() => handleResolve(issue)}
                              className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition"
                            >
                              <CheckCircle size={12} />
                              Resolve
                            </button>
                            <button
                              onClick={() => handleWaive(issue)}
                              className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                            >
                              <XCircle size={12} />
                              Waive
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && issues.length > 0 && (
          <div className="px-6 pb-4">
            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
