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
  'bg-[#1f1f27] border border-[#464554]/40 text-[#e4e1ed] text-sm font-semibold rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#6366f1] appearance-none cursor-pointer';

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
    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-[#1e1e3a] gap-3">
      <p className="text-sm text-[#908fa0] font-medium">
        {totalCount.toLocaleString()} request{totalCount !== 1 ? 's' : ''} total
      </p>
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
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
    <div className="min-h-screen bg-[#13131b] text-[#e4e1ed] font-inter">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Page header */}
        <div className="flex flex-col gap-4 border-b border-[#464554]/30 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold font-outfit text-[#c0c1ff] tracking-tight mb-1">Organization Automation Ledger</h1>
            <p className="text-sm text-[#908fa0] max-w-2xl">
              Cross-departmental view of all submitted AI automation proposals and their current status.
            </p>
          </div>
          <Link
            href="/intake/new"
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-[#8083ff] hover:brightness-110 text-white font-semibold text-sm transition-all shadow-md shadow-[#6366f1]/30 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Submit Request
          </Link>
        </div>

        {/* Filters Bar */}
        <div className="glass-panel border border-[#464554]/30 rounded-xl p-4 space-y-3">
          {/* 2x2 grid on mobile → 4-col on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Department */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[#908fa0] text-[10px] font-bold uppercase tracking-wider font-outfit px-1">Department</label>
              <select value={department} onChange={(e) => handleFilterChange('department', e.target.value)} className={selectClass}>
                <option value="">All Depts</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[#908fa0] text-[10px] font-bold uppercase tracking-wider font-outfit px-1">Status</label>
              <select value={status} onChange={(e) => handleFilterChange('status', e.target.value)} className={selectClass}>
                <option value="">All Statuses</option>
                {Object.entries(LEDGER_STATUSES).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            {/* Priority Tier */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[#908fa0] text-[10px] font-bold uppercase tracking-wider font-outfit px-1">Priority</label>
              <select value={priorityTier} onChange={(e) => handleFilterChange('priorityTier', e.target.value)} className={selectClass}>
                <option value="">All Tiers</option>
                {['Critical', 'High', 'Medium', 'Low'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[#908fa0] text-[10px] font-bold uppercase tracking-wider font-outfit px-1">Sort By</label>
              <select value={sortBy} onChange={(e) => handleFilterChange('sortBy', e.target.value)} className={selectClass}>
                <option value="newest">Newest First</option>
                <option value="priority">Priority ↓</option>
              </select>
            </div>
          </div>

          {/* Date Range — full width */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[#908fa0] text-[10px] font-bold uppercase tracking-wider font-outfit px-1">Date Range</label>
            <div className="flex items-center bg-[#0d0d15] border border-[#464554]/30 rounded-lg overflow-hidden">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="bg-transparent border-none text-xs py-2.5 px-3 w-full text-[#c7c4d7] focus:outline-none [color-scheme:dark]"
              />
              <span className="text-[#908fa0] px-1 text-sm">/</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="bg-transparent border-none text-xs py-2.5 px-3 w-full text-[#c7c4d7] focus:outline-none [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Clear filters */}
          {hasFilters && (
            <button onClick={handleClear} className="text-xs text-[#c0c1ff] font-semibold hover:text-white transition-colors cursor-pointer">
              ✕ Clear all filters
            </button>
          )}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[#908fa0] text-sm font-medium">Loading organization ledger…</p>
          </div>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <div className="p-4 rounded-xl bg-[#93000a]/20 border border-[#ffb4ab]/30 text-[#ffb4ab] text-sm text-center">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && requests.length === 0 && (
          <div className="py-16 text-center glass-panel rounded-xl border border-[#464554]/30 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#6366f1]/15 border border-[#6366f1]/30 flex items-center justify-center text-2xl mx-auto">📋</div>
            <h2 className="text-lg font-bold font-outfit text-white">No requests found</h2>
            <p className="text-sm text-[#908fa0] max-w-sm mx-auto">
              {hasFilters ? 'No proposals match your current filter parameters.' : 'No submitted proposals found in the organization ledger.'}
            </p>
            {hasFilters && (
              <button
                onClick={handleClear}
                className="px-4 py-2 rounded-lg bg-[#1f1f27] hover:bg-[#34343d] text-[#e4e1ed] text-sm font-semibold transition-all cursor-pointer border border-[#464554]/40"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Requests Table — Desktop */}
        {!isLoading && !error && requests.length > 0 && (
          <>
            <div className="hidden md:block glass-panel border border-[#464554]/30 rounded-xl overflow-hidden mb-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1f1f27] border-b border-[#464554]/30 text-xs font-bold uppercase tracking-widest text-[#908fa0] font-outfit">
                    <th className="px-6 py-4">Request Title</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Requester</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#464554]/20 font-inter text-sm">
                  {requests.map((req) => {
                    const statusLabel = LEDGER_STATUSES[req.status] ?? req.status;
                    const statusColor = STATUS_COLORS[req.status] ?? 'bg-[#34343d]/40 text-[#908fa0] border-[#464554]/30';
                    const tierColor   = TIER_COLORS[req.priorityTier] ?? TIER_COLORS.Low;
                    const tierDot     = TIER_DOTS[req.priorityTier]   ?? 'bg-slate-500';
                    const icon        = DEPARTMENT_ICONS[req.department] ?? '💼';

                    return (
                      <tr key={req._id} className="hover:bg-[#34343d]/30 transition-colors group">
                        <td className="px-6 py-4 max-w-xs">
                          <div className="flex flex-col">
                            <span className="font-semibold text-white group-hover:text-[#c0c1ff] transition-colors truncate text-sm">{req.title}</span>
                            {req.priorityScore !== undefined && (
                              <span className="font-mono-code text-xs text-[#4edea3] mt-0.5">Score: {req.priorityScore.toFixed(0)}/100</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-2 bg-[#0d0d15] border border-[#464554]/30 px-3 py-1 rounded-full text-xs font-medium text-[#c7c4d7]">
                            {icon} {req.department}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#c7c4d7] whitespace-nowrap text-sm">{req.requesterName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${tierDot} ${req.priorityTier === 'Critical' ? 'animate-pulse' : ''}`} />
                            <span className="text-white font-medium text-sm">{req.priorityTier}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono-code text-[#908fa0] text-sm whitespace-nowrap">{formatDate(req.submittedAt)}</td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <Link
                            href={`/requests/${req._id}`}
                            className="text-[#c0c1ff] hover:underline font-semibold text-sm transition-colors"
                          >
                            View Request
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
                const statusColor = STATUS_COLORS[req.status] ?? 'bg-[#34343d]/40 text-[#908fa0] border-[#464554]/30';
                const tierColor   = TIER_COLORS[req.priorityTier] ?? TIER_COLORS.Low;
                const tierDot     = TIER_DOTS[req.priorityTier]   ?? 'bg-slate-500';
                const icon        = DEPARTMENT_ICONS[req.department] ?? '💼';

                return (
                  <div key={req._id} className="p-4.5 rounded-xl glass-panel border border-[#464554]/30 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-white text-sm leading-snug">{req.title}</p>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex-shrink-0 ${statusColor}`}>{statusLabel}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#908fa0]">
                      <span>{icon} {req.department}</span>
                      <span>•</span>
                      <span>{req.requesterName}</span>
                      <span>•</span>
                      <span className="font-mono-code">{formatDate(req.submittedAt)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${tierDot}`} />
                        <span className="text-white font-medium text-sm">{req.priorityTier}</span>
                      </div>
                      <Link href={`/requests/${req._id}`} className="text-[#c0c1ff] hover:underline font-semibold text-sm">
                        View Request →
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


