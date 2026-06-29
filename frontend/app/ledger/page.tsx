'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DEPARTMENTS } from '@/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LedgerRequest {
  _id: string;
  title: string;
  department: string;
  status: string;
  requesterName: string;
  priorityTier: 'Critical' | 'High' | 'Medium' | 'Low';
  priorityScore?: number; // only for eng_admins
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

// ─── Constants ────────────────────────────────────────────────────────────────

const LEDGER_STATUSES: Record<string, string> = {
  submitted:         'Submitted',
  needs_more_info:   'Info Needed',
  engineering_review:'Eng Review',
  approved:          'Approved',
  rejected:          'Rejected',
  planned:           'Planned',
  in_development:    'In Development',
  testing:           'Testing',
  completed:         'Completed',
  archived:          'Archived',
};

const STATUS_COLORS: Record<string, string> = {
  submitted:          'bg-blue-500/10 text-blue-400 border-blue-500/30',
  needs_more_info:    'bg-orange-500/10 text-orange-400 border-orange-500/30',
  engineering_review: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  approved:           'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  rejected:           'bg-rose-500/10 text-rose-400 border-rose-500/30',
  planned:            'bg-teal-500/10 text-teal-400 border-teal-500/30',
  in_development:     'bg-blue-600/10 text-blue-300 border-blue-600/30',
  testing:            'bg-violet-500/10 text-violet-400 border-violet-500/30',
  completed:          'bg-green-500/10 text-green-400 border-green-500/30',
  archived:           'bg-gray-500/10 text-gray-400 border-gray-500/30',
};

const TIER_COLORS: Record<string, string> = {
  Critical: 'text-red-400 bg-red-400/10 border-red-400/30',
  High:     'text-orange-400 bg-orange-400/10 border-orange-400/30',
  Medium:   'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  Low:      'text-gray-400 bg-gray-400/10 border-gray-400/30',
};

const TIER_DOTS: Record<string, string> = {
  Critical: 'bg-red-400',
  High:     'bg-orange-400',
  Medium:   'bg-yellow-400',
  Low:      'bg-gray-500',
};

const DEPARTMENT_ICONS: Record<string, string> = {
  Recruitment: '🤝',
  HR: '🧑‍💼',
  Finance: '💵',
  Compliance: '⚖️',
  IT: '💻',
  Operations: '⚙️',
  Engineering: '🔧',
  Legal: '📜',
  Sales: '📈',
  Marketing: '🎯',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilterBar({
  department,
  status,
  priorityTier,
  dateFrom,
  dateTo,
  sortBy,
  onChange,
  onClear,
}: {
  department: string;
  status: string;
  priorityTier: string;
  dateFrom: string;
  dateTo: string;
  sortBy: string;
  onChange: (key: string, value: string) => void;
  onClear: () => void;
}) {
  const hasFilters = department || status || priorityTier || dateFrom || dateTo;
  const selectClass =
    'bg-[#1a1a2e] border border-[#2a2a4e] text-[#d1d5db] text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#6366f1] focus:border-[#6366f1] appearance-none cursor-pointer min-w-0';
  const inputClass =
    'bg-[#1a1a2e] border border-[#2a2a4e] text-[#d1d5db] text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#6366f1] focus:border-[#6366f1]';

  return (
    <div className="flex flex-wrap items-end gap-3 p-4 bg-[#0f0f1e] border border-[#1e1e3a] rounded-2xl mb-6">
      {/* Department */}
      <div className="flex flex-col gap-1 min-w-[130px]">
        <label className="text-[#6b7280] text-xs">Department</label>
        <select
          value={department}
          onChange={(e) => onChange('department', e.target.value)}
          className={selectClass}
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div className="flex flex-col gap-1 min-w-[140px]">
        <label className="text-[#6b7280] text-xs">Status</label>
        <select
          value={status}
          onChange={(e) => onChange('status', e.target.value)}
          className={selectClass}
        >
          <option value="">All Statuses</option>
          {Object.entries(LEDGER_STATUSES).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {/* Priority Tier */}
      <div className="flex flex-col gap-1 min-w-[120px]">
        <label className="text-[#6b7280] text-xs">Priority Tier</label>
        <select
          value={priorityTier}
          onChange={(e) => onChange('priorityTier', e.target.value)}
          className={selectClass}
        >
          <option value="">All Tiers</option>
          {['Critical', 'High', 'Medium', 'Low'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Date From */}
      <div className="flex flex-col gap-1 min-w-[130px]">
        <label className="text-[#6b7280] text-xs">From Date</label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onChange('dateFrom', e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Date To */}
      <div className="flex flex-col gap-1 min-w-[130px]">
        <label className="text-[#6b7280] text-xs">To Date</label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onChange('dateTo', e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Sort */}
      <div className="flex flex-col gap-1 min-w-[150px]">
        <label className="text-[#6b7280] text-xs">Sort By</label>
        <select
          value={sortBy}
          onChange={(e) => onChange('sortBy', e.target.value)}
          className={selectClass}
        >
          <option value="newest">Newest First</option>
          <option value="priority">Priority Score ↓</option>
        </select>
      </div>

      {/* Clear Filters */}
      {hasFilters && (
        <button
          onClick={onClear}
          className="text-xs text-[#6b7280] hover:text-[#e0e0e0] underline underline-offset-2 transition-colors pb-2"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

function PaginationBar({
  pagination,
  onPage,
}: {
  pagination: Pagination;
  onPage: (p: number) => void;
}) {
  const { page, totalPages, totalCount, hasPrevPage, hasNextPage } = pagination;
  if (totalPages <= 1) return null;

  const pages: (number | '…')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  const btnClass = (active: boolean, disabled?: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
      active
        ? 'bg-[#6366f1] text-white'
        : disabled
        ? 'bg-[#1a1a2e] text-[#4b5563] cursor-not-allowed border border-[#2a2a4e]'
        : 'bg-[#1a1a2e] text-[#9ca3af] hover:text-white border border-[#2a2a4e] hover:border-[#6366f1]/40'
    }`;

  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#1e1e3a]">
      <p className="text-xs text-[#6b7280]">
        {totalCount.toLocaleString()} request{totalCount !== 1 ? 's' : ''}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPage(page - 1)}
          disabled={!hasPrevPage}
          className={btnClass(false, !hasPrevPage)}
        >
          ← Prev
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-[#4b5563] text-xs">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              className={btnClass(p === page)}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={!hasNextPage}
          className={btnClass(false, !hasNextPage)}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LedgerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial filter state from URL
  const [department, setDepartment] = useState(searchParams.get('department') ?? '');
  const [status, setStatus] = useState(searchParams.get('status') ?? '');
  const [priorityTier, setPriorityTier] = useState(searchParams.get('priorityTier') ?? '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') ?? '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') ?? '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') ?? 'newest');
  const [page, setPage] = useState(parseInt(searchParams.get('page') ?? '1', 10));

  const [requests, setRequests] = useState<LedgerRequest[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLedger = useCallback(async () => {
    setIsLoading(true);
    setError('');

    const params = new URLSearchParams();
    if (department) params.set('department', department);
    if (status) params.set('status', status);
    if (priorityTier) params.set('priorityTier', priorityTier);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    params.set('sortBy', sortBy);
    params.set('page', String(page));

    // Sync URL without re-mount
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLedger();
  }, [fetchLedger]);

  const handleFilterChange = (key: string, value: string) => {
    setPage(1); // reset to page 1 on filter change
    if (key === 'department') setDepartment(value);
    if (key === 'status') setStatus(value);
    if (key === 'priorityTier') setPriorityTier(value);
    if (key === 'dateFrom') setDateFrom(value);
    if (key === 'dateTo') setDateTo(value);
    if (key === 'sortBy') setSortBy(value);
  };

  const handleClear = () => {
    setPage(1);
    setDepartment('');
    setStatus('');
    setPriorityTier('');
    setDateFrom('');
    setDateTo('');
    setSortBy('newest');
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-[#e0e0e0]">
      {/* ── Sticky Header ── */}
      <div className="border-b border-[#1e1e3a] bg-[#0f0f1e]/80 backdrop-blur-md px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👁️</span>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Company Ledger</h1>
              <p className="text-[#6b7280] text-xs">All submitted automation requests across the organisation</p>
            </div>
          </div>
          <Link
            href="/intake/new"
            className="flex-shrink-0 px-4 py-2 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5558e0] hover:to-[#7c4fdb] text-white shadow-lg shadow-[#6366f1]/20 transition-all duration-200 flex items-center gap-2"
          >
            <span>+</span> New Request
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Filters ── */}
        <FilterBar
          department={department}
          status={status}
          priorityTier={priorityTier}
          dateFrom={dateFrom}
          dateTo={dateTo}
          sortBy={sortBy}
          onChange={handleFilterChange}
          onClear={handleClear}
        />

        {/* ── Loading ── */}
        {isLoading && (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#9ca3af] text-sm">Loading ledger…</p>
          </div>
        )}

        {/* ── Error ── */}
        {!isLoading && error && (
          <div className="p-4 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* ── Empty state ── */}
        {!isLoading && !error && requests.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#1a1a2e] border border-[#2a2a4e] flex items-center justify-center text-3xl mx-auto mb-6">
              📋
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No requests found</h2>
            <p className="text-[#9ca3af] text-sm mb-6">
              {department || status || priorityTier
                ? 'Try adjusting or clearing your filters.'
                : 'No submitted requests yet — be the first!'}
            </p>
            {(department || status || priorityTier) && (
              <button
                onClick={handleClear}
                className="px-4 py-2 rounded-xl bg-[#1a1a2e] border border-[#2a2a4e] text-[#9ca3af] hover:text-white text-sm transition-all"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* ── Requests Table ── */}
        {!isLoading && !error && requests.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-[#0f0f1e] border border-[#1e1e3a] rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e1e3a]">
                    {['Title', 'Department', 'Requester', 'Status', 'Priority Tier', 'Submitted'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6b7280]"
                      >
                        {h}
                      </th>
                    ))}
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req, i) => {
                    const statusLabel = LEDGER_STATUSES[req.status] ?? req.status;
                    const statusColor = STATUS_COLORS[req.status] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/30';
                    const tierColor = TIER_COLORS[req.priorityTier] ?? TIER_COLORS.Low;
                    const tierDot = TIER_DOTS[req.priorityTier] ?? 'bg-gray-500';
                    const icon = DEPARTMENT_ICONS[req.department] ?? '💼';

                    return (
                      <tr
                        key={req._id}
                        className={`border-b border-[#1e1e3a] hover:bg-[#131326] transition-colors group ${
                          i === requests.length - 1 ? 'border-b-0' : ''
                        }`}
                      >
                        {/* Title */}
                        <td className="px-4 py-3.5 max-w-xs">
                          <p className="font-medium text-white group-hover:text-[#818cf8] transition-colors truncate">
                            {req.title}
                          </p>
                          {req.priorityScore !== undefined && (
                            <p className="text-xs text-[#6b7280] mt-0.5">Score: {req.priorityScore.toFixed(1)}</p>
                          )}
                        </td>

                        {/* Department */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="flex items-center gap-1.5 text-[#d1d5db] text-xs">
                            {icon} {req.department}
                          </span>
                        </td>

                        {/* Requester */}
                        <td className="px-4 py-3.5 text-[#9ca3af] text-xs whitespace-nowrap">
                          {req.requesterName}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </td>

                        {/* Priority Tier */}
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${tierColor}`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tierDot}`} />
                            {req.priorityTier}
                          </span>
                        </td>

                        {/* Submitted */}
                        <td className="px-4 py-3.5 text-[#9ca3af] text-xs whitespace-nowrap">
                          {formatDate(req.submittedAt)}
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3.5">
                          <Link
                            href={`/requests/${req._id}`}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1a1a2e] border border-[#2a2a4e] text-[#9ca3af] hover:bg-[#6366f1] hover:border-[#6366f1] hover:text-white transition-all whitespace-nowrap"
                          >
                            View →
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
                const statusColor = STATUS_COLORS[req.status] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/30';
                const tierColor = TIER_COLORS[req.priorityTier] ?? TIER_COLORS.Low;
                const tierDot = TIER_DOTS[req.priorityTier] ?? 'bg-gray-500';
                const icon = DEPARTMENT_ICONS[req.department] ?? '💼';

                return (
                  <div
                    key={req._id}
                    className="p-4 rounded-2xl bg-[#0f0f1e] border border-[#1e1e3a] hover:border-[#6366f1]/40 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <p className="font-semibold text-white text-sm leading-snug">{req.title}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#9ca3af] mb-3">
                      <span>{icon} {req.department}</span>
                      <span>•</span>
                      <span>{req.requesterName}</span>
                      <span>•</span>
                      <span>{formatDate(req.submittedAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${tierColor}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${tierDot}`} />
                        {req.priorityTier}
                        {req.priorityScore !== undefined && ` · ${req.priorityScore.toFixed(1)}`}
                      </span>
                      <Link
                        href={`/requests/${req._id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1a1a2e] border border-[#2a2a4e] text-[#9ca3af] hover:bg-[#6366f1] hover:border-[#6366f1] hover:text-white transition-all"
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination && (
              <PaginationBar pagination={pagination} onPage={(p) => setPage(p)} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
