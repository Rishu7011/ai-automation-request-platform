'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Search,
  ArrowRight,
  Edit3,
  Clock,
  Building,
  CheckCircle2,
  FileText,
  Zap,
  Star,
  ArrowUpDown,
} from 'lucide-react';

interface RequestItem {
  _id: string;
  title: string;
  department: string;
  status: string;
  priorityScore: number;
  createdAt: string;
  updatedAt: string;
}

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  draft:                { label: 'Draft',         color: 'border-amber-200 bg-amber-50 text-amber-800' },
  ai_reviewing:         { label: 'AI Reviewing',  color: 'border-violet-200 bg-violet-50 text-violet-700' },
  submitted:            { label: 'Submitted',     color: 'border-blue-200 bg-blue-50 text-blue-700' },
  needs_more_info:      { label: 'Info Needed',   color: 'border-orange-200 bg-orange-50 text-orange-700' },
  in_review:            { label: 'In Review',     color: 'border-indigo-200 bg-indigo-50 text-indigo-700' },
  roi_calculated:       { label: 'ROI Evaluated', color: 'border-cyan-200 bg-cyan-50 text-cyan-800' },
  engineering_review:   { label: 'Eng Review',    color: 'border-blue-200 bg-blue-50 text-blue-800' },
  approved:             { label: 'Approved',      color: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  rejected:             { label: 'Rejected',      color: 'border-rose-200 bg-rose-50 text-rose-800' },
  planned:              { label: 'Planned',       color: 'border-teal-200 bg-teal-50 text-teal-800' },
  in_development:       { label: 'In Development', color: 'border-blue-200 bg-blue-50 text-blue-800' },
  testing:              { label: 'Testing',       color: 'border-violet-200 bg-violet-50 text-violet-800' },
  completed:            { label: 'Completed',     color: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  archived:             { label: 'Archived',      color: 'border-slate-200 bg-slate-50 text-slate-700' },
};

const DEPARTMENT_ICONS: Record<string, string> = {
  Recruitment: '🤝', HR: '🧑‍💼', Finance: '💵', Compliance: '⚖️',
  IT: '💻', Operations: '⚙️', Engineering: '🔧', Legal: '📜',
  Sales: '📈', Marketing: '🎯',
};

export default function MyRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'score'>('newest');

  useEffect(() => {
    async function fetchRequests() {
      try {
        const res = await fetch('/api/requests');
        if (!res.ok) throw new Error('Failed to load requests');
        const data = await res.json();
        setRequests(data.requests || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    }
    fetchRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    return requests
      .filter((req) => {
        const matchesSearch =
          req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          req.department.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDept = selectedDepartment === 'All' || req.department === selectedDepartment;
        const matchesStatus =
          selectedStatusFilter === 'All' ||
          (selectedStatusFilter === 'approved' && ['approved', 'in_development', 'completed'].includes(req.status)) ||
          (selectedStatusFilter === 'draft' && req.status === 'draft') ||
          (selectedStatusFilter === 'roi_calculated' && req.status === 'roi_calculated') ||
          req.status === selectedStatusFilter;
        return matchesSearch && matchesDept && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'score') return (b.priorityScore || 0) - (a.priorityScore || 0);
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [requests, searchQuery, selectedDepartment, selectedStatusFilter, sortBy]);

  const totalCount = requests.length;
  const activeCount = requests.filter((r) =>
    ['approved', 'in_development', 'roi_calculated', 'engineering_review'].includes(r.status)
  ).length;
  const draftCount = requests.filter((r) => r.status === 'draft').length;
  const avgScore = useMemo(() => {
    const scored = requests.filter((r) => r.priorityScore > 0);
    if (scored.length === 0) return '--';
    return (scored.reduce((acc, r) => acc + r.priorityScore, 0) / scored.length).toFixed(1);
  }, [requests]);

  return (
    <div className="min-h-screen bg-[#f7f9fb] font-sans text-[#191c1e]">
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">

        {/* Page header */}
        <div className="flex flex-col gap-5 border-b border-[#dfe3e8] pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-semibold tracking-tight text-[#191c1e]">My Requests</h1>
            <p className="max-w-2xl text-sm leading-6 text-[#5f6470]">
              All your automation proposals — draft, in-review, and approved.
            </p>
          </div>
          <button
            onClick={() => router.push('/intake/new')}
            className="flex h-10 w-fit items-center gap-2 rounded-lg bg-[#2563eb] px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#004ac6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004ac6] focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Automation Request</span>
          </button>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="flex min-h-28 items-center gap-4 rounded-xl border border-[#dfe3e8] bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-[#004ac6]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#737686]">Total requests</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-[#191c1e]">{totalCount}</p>
            </div>
          </div>

          <div className="flex min-h-28 items-center gap-4 rounded-xl border border-[#dfe3e8] bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#737686]">Active</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-[#191c1e]">{activeCount}</p>
            </div>
          </div>

          <div className="flex min-h-28 items-center gap-4 rounded-xl border border-[#dfe3e8] bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-100 bg-amber-50 text-amber-700">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#737686]">Drafts</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-[#191c1e]">{draftCount}</p>
            </div>
          </div>

          <div className="flex min-h-28 items-center gap-4 rounded-xl border border-[#dfe3e8] bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-[#004ac6]">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#737686]">Average AI score</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-[#191c1e]">
                {avgScore}
                {avgScore !== '--' && <span className="text-xs font-normal text-[#737686]"> /100</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col gap-3 rounded-xl border border-[#dfe3e8] bg-white p-3 shadow-sm md:flex-row md:items-center">
          <div className="relative w-full md:flex-1">
            <Search className="absolute top-1/2 left-3 -translate-y-1/2 h-4 w-4 text-[#737686]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or department…"
              aria-label="Search requests"
              className="h-10 w-full rounded-lg border border-[#dfe3e8] bg-white py-2 pr-4 pl-10 text-sm text-[#191c1e] placeholder:text-[#737686] transition-colors focus:border-[#004ac6] focus:outline-none focus:ring-2 focus:ring-[#004ac6]/15"
            />
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:flex-nowrap">
            {/* Department Dropdown */}
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              aria-label="Filter by department"
              className="h-10 cursor-pointer rounded-lg border border-[#dfe3e8] bg-white px-3 text-xs font-medium text-[#434655] outline-none transition-colors focus:border-[#004ac6] focus:ring-2 focus:ring-[#004ac6]/15"
            >
              <option value="All">All Departments</option>
              {Object.keys(DEPARTMENT_ICONS).map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1 rounded-lg border border-[#dfe3e8] bg-[#f7f9fb] p-1" aria-label="Filter by status">
              {[
                { value: 'All', label: 'All' },
                { value: 'approved', label: 'Approved' },
                { value: 'roi_calculated', label: 'ROI Done' },
                { value: 'draft', label: 'Drafts' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSelectedStatusFilter(value)}
                  className={`h-8 rounded-md px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004ac6] ${
                    selectedStatusFilter === value
                      ? 'bg-white text-[#004ac6] shadow-sm ring-1 ring-[#dfe3e8]'
                      : 'text-[#5f6470] hover:text-[#191c1e]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Sort Toggle */}
            <button
              onClick={() => setSortBy(sortBy === 'newest' ? 'score' : 'newest')}
              className="flex h-10 items-center gap-1.5 rounded-lg border border-[#dfe3e8] bg-white px-3 text-xs font-medium text-[#434655] transition-colors hover:bg-[#f7f9fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004ac6]"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-[#004ac6]" />
              <span>{sortBy === 'score' ? 'Highest Score' : 'Newest First'}</span>
            </button>
          </div>
        </div>

        {/* Requests List */}
        {isLoading ? (
          <div className="space-y-3 py-20 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#2563eb] border-t-transparent" />
            <p className="text-sm text-[#5f6470]">Loading your requests…</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center text-sm text-rose-800">
            {error}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="mx-auto max-w-lg space-y-5 rounded-xl border border-[#dfe3e8] bg-white p-10 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-[#004ac6]">
              <FileText className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-[#191c1e]">No requests found</h2>
              <p className="text-sm leading-6 text-[#5f6470]">
                {searchQuery || selectedDepartment !== 'All' || selectedStatusFilter !== 'All'
                  ? 'No requests match your current filters.'
                  : 'Submit your first automation request and our AI will guide you through capturing requirements and calculating ROI.'}
              </p>
            </div>
            <button
              onClick={() => router.push('/intake/new')}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#2563eb] px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#004ac6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004ac6] focus-visible:ring-offset-2"
            >
              <Plus className="h-4 w-4" />
              <span>Submit Automation Request</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((req) => {
              const badge = STATUS_BADGES[req.status] || {
                label: req.status,
                color: 'border-slate-200 bg-slate-50 text-slate-700',
              };
              const icon = DEPARTMENT_ICONS[req.department] || '💼';
              const updatedDate = new Date(req.updatedAt).toLocaleDateString(undefined, {
                month: 'short', day: 'numeric', year: 'numeric',
              });

              return (
                <div
                  key={req._id}
                  className="group flex flex-col justify-between gap-5 rounded-xl border border-[#dfe3e8] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-px hover:border-blue-200 hover:shadow-md md:flex-row md:items-center md:p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#dfe3e8] bg-[#f7f9fb] text-xl transition-transform group-hover:scale-105">
                      {icon}
                    </div>
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="truncate text-base font-semibold text-[#191c1e] transition-colors group-hover:text-[#004ac6]">
                          {req.title}
                        </h3>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5f6470]">
                        <span className="flex items-center gap-1.5">
                          <Building className="h-3.5 w-3.5 text-[#737686]" />
                          {req.department}
                        </span>
                        <span className="hidden text-[#c3c6d7] sm:inline">•</span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-[#737686]" />
                          Updated {updatedDate}
                        </span>
                        {req.priorityScore > 0 && (
                          <>
                            <span className="hidden text-[#c3c6d7] sm:inline">•</span>
                            <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-[#004ac6]">
                              AI score {req.priorityScore.toFixed(1)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center self-end md:self-center">
                    <Link
                      href={req.status === 'draft' ? `/intake/${req._id}` : `/requests/${req._id}`}
                      className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#c3c6d7] bg-white px-3 text-xs font-medium text-[#004ac6] transition-colors hover:border-blue-200 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004ac6]"
                    >
                      {req.status === 'draft' ? (
                        <>
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Resume Interview</span>
                        </>
                      ) : (
                        <>
                          <span>View Request</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
