'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DEPARTMENTS } from '@/constants';
import {
  Search,
  ChevronRight,
  Plus,
  Eye,
  Building,
  User,
  Calendar,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface LedgerRequest {
  _id: string;
  title: string;
  department: string;
  status: string;
  requesterName: string;
  priorityTier: 'Critical' | 'High' | 'Medium' | 'Low';
  priorityScore?: number;
  roiConfidence?: string;
  submittedAt?: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const LEDGER_STATUSES: Record<string, string> = {
  submitted:          'Submitted',
  needs_more_info:    'Info Needed',
  engineering_review: 'Eng Review',
  approved:           'Approved',
  rejected:           'Rejected',
  planned:            'Planned',
  in_development:     'In Development',
  testing:            'Testing',
  completed:          'Completed',
  archived:           'Archived',
};

const STATUS_COLORS: Record<string, string> = {
  submitted:          'bg-blue-500/15 text-blue-300 border-blue-500/30',
  needs_more_info:    'bg-orange-500/15 text-orange-300 border-orange-500/30',
  engineering_review: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  approved:           'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  rejected:           'bg-rose-500/15 text-rose-300 border-rose-500/30',
  planned:            'bg-teal-500/15 text-teal-300 border-teal-500/30',
  in_development:     'bg-blue-600/20 text-blue-300 border-blue-500/30',
  testing:            'bg-purple-500/15 text-purple-300 border-purple-500/30',
  completed:          'bg-green-500/15 text-green-300 border-green-500/30',
  archived:           'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

const TIER_COLORS: Record<string, string> = {
  Critical: 'text-rose-300 bg-rose-500/15 border-rose-500/30',
  High:     'text-amber-300 bg-amber-500/15 border-amber-500/30',
  Medium:   'text-yellow-300 bg-yellow-500/15 border-yellow-500/30',
  Low:      'text-slate-400 bg-slate-500/15 border-slate-500/30',
};

const TIER_DOTS: Record<string, string> = {
  Critical: 'bg-rose-500',
  High:     'bg-amber-500',
  Medium:   'bg-yellow-500',
  Low:      'bg-slate-500',
};

const DEPARTMENT_ICONS: Record<string, string> = {
  Recruitment: '🤝', HR: '🧑‍💼', Finance: '💵', Compliance: '⚖️',
  IT: '💻', Operations: '⚙️', Engineering: '🔧', Legal: '📜',
  Sales: '📈', Marketing: '🎯',
};

const selectClass =
  'bg-[#1a1a2e] border border-[#2a2a4e] text-[#d1d5db] text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#6366f1] appearance-none cursor-pointer';

// ─── Pagination ────────────────────────────────────────────────────────────────

function PaginationBar({ pagination, onPage }: { pagination: Pagination; onPage: (p: number) => void }) {
  const { page, totalPages, totalCount, hasPrevPage, hasNextPage } = pagination;
  if (totalPages <= 1) return null;

  const pages: (number | '…')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  const btn = (active: boolean, disabled?: boolean) =>
    `px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
      active
        ? 'bg-[#6366f1] text-white shadow-sm'
        : disabled
        ? 'bg-[#1a1a2e] text-[#4b5563] cursor-not-allowed border border-[#2a2a4e]'
        : 'bg-[#1a1a2e] text-[#d1d5db] hover:bg-[#1e1e3a] border border-[#2a2a4e]'
    }`;

  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#1e1e3a]">
      <p className="text-xs text-[#6b7280] font-medium">
        {totalCount.toLocaleString()} request{totalCount !== 1 ? 's' : ''} total
      </p>
      <div className="flex items-center gap-1.5">
        <button onClick={() => onPage(page - 1)} disabled={!hasPrevPage} className={btn(false, !hasPrevPage)}>← Prev</button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e-${i}`} className="px-1 text-[#4b5563] text-xs font-bold">…</span>
          ) : (
            <button key={p} onClick={() => onPage(p as number)} className={btn(p === page)}>{p}</button>
          )
        )}
        <button onClick={() => onPage(page + 1)} disabled={!hasNextPage} className={btn(false, !hasNextPage)}>Next →</button>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function LedgerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [department, setDepartment] = useState(searchParams.get('department') ?? '');
  const [status, setStatus]         = useState(searchParams.get('status') ?? '');
  const [priorityTier, setPriorityTier] = useState(searchParams.get('priorityTier') ?? '');
  const [dateFrom, setDateFrom]     = useState(searchParams.get('dateFrom') ?? '');
  const [dateTo, setDateTo]         = useState(searchParams.get('dateTo') ?? '');
  const [sortBy, setSortBy]         = useState(searchParams.get('sortBy') ?? 'newest');
  const [page, setPage]             = useState(parseInt(searchParams.get('page') ?? '1', 10));

  const [requests, setRequests]     = useState<LedgerRequest[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState('');

  const fetchLedger = useCallback(async () => {
    setIsLoading(true);
    setError('');

    const params = new URLSearchParams();
    if (department) params.set('department', department);
    if (status)     params.set('status', status);
    if (priorityTier) params.set('priorityTier', priorityTier);
    if (dateFrom)   params.set('dateFrom', dateFrom);
    if (dateTo)     params.set('dateTo', dateTo);
    params.set('sortBy', sortBy);
    params.set('page', String(page));

    router.replace(`/ledger?${params.toString()}`, { scroll: false });

    try {
      const res = await fetch(`/api/ledger?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to load ledger');
      }
      const data = await res.json();
      setRequests(data.requests ?? []);
      setPagination(data.pagination ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ledger');
    } finally {
      setIsLoading(false);
    }
  }, [department, status, priorityTier, dateFrom, dateTo, sortBy, page, router]);

  useEffect(() => {
    queueMicrotask(() => { void fetchLedger(); });
  }, [fetchLedger]);

  const handleFilterChange = (key: string, value: string) => {
    setPage(1);
    if (key === 'department')  setDepartment(value);
    if (key === 'status')      setStatus(value);
    if (key === 'priorityTier') setPriorityTier(value);
    if (key === 'dateFrom')    setDateFrom(value);
    if (key === 'dateTo')      setDateTo(value);
    if (key === 'sortBy')      setSortBy(value);
  };

  const handleClear = () => {
    setPage(1); setDepartment(''); setStatus(''); setPriorityTier('');
    setDateFrom(''); setDateTo(''); setSortBy('newest');
  };

  const hasFilters = department || status || priorityTier || dateFrom || dateTo;

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-[#e0e0e0] font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Organization Automation Ledger</h1>
            <p className="text-sm text-[#9ca3af] mt-1">
              Cross-departmental view of all submitted AI automation proposals and their current status.
            </p>
          </div>
          <Link
            href="/intake/new"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5558e0] hover:to-[#7c4fdb] text-white font-bold text-xs transition-all shadow-md shadow-[#6366f1]/20 flex items-center gap-2 w-fit"
          >
            <Plus className="h-4 w-4" /> Submit Request
          </Link>
        </div>

        {/* Filters Bar */}
        <div className="bg-[#0f0f1e] border border-[#1e1e3a] rounded-2xl p-5 flex flex-wrap items-end gap-3">
          {/* Department */}
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-[#6b7280] text-[10px] font-bold uppercase tracking-wider">Department</label>
            <select value={department} onChange={(e) => handleFilterChange('department', e.target.value)} className={selectClass}>
              <option value="">All Departments</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-[#6b7280] text-[10px] font-bold uppercase tracking-wider">Status</label>
            <select value={status} onChange={(e) => handleFilterChange('status', e.target.value)} className={selectClass}>
              <option value="">All Statuses</option>
              {Object.entries(LEDGER_STATUSES).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {/* Priority Tier */}
          <div className="flex flex-col gap-1 min-w-[130px]">
            <label className="text-[#6b7280] text-[10px] font-bold uppercase tracking-wider">Priority Tier</label>
            <select value={priorityTier} onChange={(e) => handleFilterChange('priorityTier', e.target.value)} className={selectClass}>
              <option value="">All Tiers</option>
              {['Critical', 'High', 'Medium', 'Low'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-[#6b7280] text-[10px] font-bold uppercase tracking-wider">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="bg-[#1a1a2e] border border-[#2a2a4e] text-[#d1d5db] text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#6366f1] [color-scheme:dark]"
            />
          </div>

          {/* Date To */}
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-[#6b7280] text-[10px] font-bold uppercase tracking-wider">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="bg-[#1a1a2e] border border-[#2a2a4e] text-[#d1d5db] text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#6366f1] [color-scheme:dark]"
            />
          </div>

          {/* Sort */}
          <div className="flex flex-col gap-1 min-w-[150px]">
            <label className="text-[#6b7280] text-[10px] font-bold uppercase tracking-wider">Sort By</label>
            <select value={sortBy} onChange={(e) => handleFilterChange('sortBy', e.target.value)} className={selectClass}>
              <option value="newest">Newest First</option>
              <option value="priority">Priority Score ↓</option>
            </select>
          </div>

          {hasFilters && (
            <button onClick={handleClear} className="text-xs text-[#818cf8] font-bold hover:text-[#a78bfa] transition-colors pb-2 cursor-pointer">
              Clear filters
            </button>
          )}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[#6b7280] text-sm font-medium">Loading organization ledger…</p>
          </div>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && requests.length === 0 && (
          <div className="py-16 text-center bg-[#0f0f1e] rounded-2xl border border-[#1e1e3a] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1a1a2e] border border-[#2a2a4e] flex items-center justify-center text-2xl mx-auto">📋</div>
            <h2 className="text-base font-bold text-white">No requests found</h2>
            <p className="text-xs text-[#6b7280] max-w-sm mx-auto">
              {hasFilters ? 'No proposals match your current filter parameters.' : 'No submitted proposals found in the organization ledger.'}
            </p>
            {hasFilters && (
              <button
                onClick={handleClear}
                className="px-4 py-2 rounded-xl bg-[#1a1a2e] hover:bg-[#1e1e3a] text-[#d1d5db] text-xs font-bold transition-all cursor-pointer border border-[#2a2a4e]"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Requests Table — Desktop */}
        {!isLoading && !error && requests.length > 0 && (
          <>
            <div className="hidden md:block bg-[#0f0f1e] border border-[#1e1e3a] rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1e1e3a] text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">
                    {['Request Title', 'Department', 'Requester', 'Status', 'Priority Tier', 'Submitted', ''].map((h, i) => (
                      <th key={i} className={`py-3.5 px-5 font-bold ${i === 6 ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a2e]">
                  {requests.map((req) => {
                    const statusLabel = LEDGER_STATUSES[req.status] ?? req.status;
                    const statusColor = STATUS_COLORS[req.status] ?? 'bg-slate-500/15 text-slate-400 border-slate-500/30';
                    const tierColor   = TIER_COLORS[req.priorityTier] ?? TIER_COLORS.Low;
                    const tierDot     = TIER_DOTS[req.priorityTier]   ?? 'bg-slate-500';
                    const icon        = DEPARTMENT_ICONS[req.department] ?? '💼';

                    return (
                      <tr key={req._id} className="hover:bg-[#1a1a2e]/50 transition-colors group">
                        <td className="py-4 px-5 max-w-xs">
                          <p className="font-bold text-white group-hover:text-[#818cf8] transition-colors truncate">{req.title}</p>
                          {req.priorityScore !== undefined && (
                            <p className="text-[11px] text-[#4b5563] font-semibold mt-0.5">Score: {req.priorityScore.toFixed(1)}</p>
                          )}
                        </td>
                        <td className="py-4 px-5 whitespace-nowrap">
                          <span className="flex items-center gap-1.5 text-[#d1d5db] font-semibold">{icon} {req.department}</span>
                        </td>
                        <td className="py-4 px-5 text-[#9ca3af] font-medium whitespace-nowrap">{req.requesterName}</td>
                        <td className="py-4 px-5">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${tierColor}`}>
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${tierDot}`} />
                            {req.priorityTier}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-[#6b7280] font-medium whitespace-nowrap">{formatDate(req.submittedAt)}</td>
                        <td className="py-4 px-5 text-right">
                          <Link
                            href={`/requests/${req._id}`}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#1a1a2e] hover:bg-[#6366f1] hover:text-white border border-[#2a2a4e] text-[#d1d5db] transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <span>View</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden space-y-3">
              {requests.map((req) => {
                const statusLabel = LEDGER_STATUSES[req.status] ?? req.status;
                const statusColor = STATUS_COLORS[req.status] ?? 'bg-slate-500/15 text-slate-400 border-slate-500/30';
                const tierColor   = TIER_COLORS[req.priorityTier] ?? TIER_COLORS.Low;
                const tierDot     = TIER_DOTS[req.priorityTier]   ?? 'bg-slate-500';
                const icon        = DEPARTMENT_ICONS[req.department] ?? '💼';

                return (
                  <div key={req._id} className="p-5 rounded-2xl bg-[#0f0f1e] border border-[#1e1e3a] space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-white text-sm leading-snug">{req.title}</p>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex-shrink-0 ${statusColor}`}>{statusLabel}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#6b7280] font-medium">
                      <span>{icon} {req.department}</span>
                      <span>•</span>
                      <span>{req.requesterName}</span>
                      <span>•</span>
                      <span>{formatDate(req.submittedAt)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${tierColor}`}>
                        <span className={`w-2 h-2 rounded-full ${tierDot}`} />
                        {req.priorityTier}
                      </span>
                      <Link href={`/requests/${req._id}`} className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#1a1a2e] hover:bg-[#6366f1] hover:text-white border border-[#2a2a4e] text-[#d1d5db] transition-all cursor-pointer">
                        View →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {pagination && <PaginationBar pagination={pagination} onPage={(p) => setPage(p)} />}
          </>
        )}
      </main>
    </div>
  );
}
