'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Search,
  ArrowRight,
  Edit3,
  CheckCircle2,
  FileText,
  Zap,
  Star,
  ArrowUpDown,
  Building,
  Clock,
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
  draft:                { label: 'Draft',         color: 'bg-[#ffb95f]/15 text-[#ffb95f] border-[#ffb95f]/30' },
  ai_reviewing:         { label: 'AI Reviewing',  color: 'bg-[#8083ff]/15 text-[#c0c1ff] border-[#8083ff]/30' },
  submitted:            { label: 'Submitted',     color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  needs_more_info:      { label: 'Info Needed',   color: 'bg-[#ffb95f]/15 text-[#ffb95f] border-[#ffb95f]/30' },
  in_review:            { label: 'In Review',     color: 'bg-[#6366f1]/15 text-[#c0c1ff] border-[#6366f1]/30' },
  roi_calculated:       { label: 'ROI Evaluated', color: 'bg-[#00a572]/15 text-[#4edea3] border-[#00a572]/30' },
  engineering_review:   { label: 'Eng Review',    color: 'bg-[#6366f1]/15 text-[#c0c1ff] border-[#6366f1]/30' },
  approved:             { label: 'Approved',      color: 'bg-[#00a572]/15 text-[#4edea3] border-[#00a572]/30' },
  rejected:             { label: 'Rejected',      color: 'bg-[#93000a]/20 text-[#ffb4ab] border-[#ffb4ab]/30' },
  planned:              { label: 'Planned',       color: 'bg-[#00a572]/15 text-[#4edea3] border-[#00a572]/30' },
  in_development:       { label: 'In Dev',        color: 'bg-[#6366f1]/20 text-[#c0c1ff] border-[#6366f1]/30' },
  testing:              { label: 'Testing',       color: 'bg-[#8083ff]/15 text-[#c0c1ff] border-[#8083ff]/30' },
  completed:            { label: 'Completed',     color: 'bg-[#00a572]/20 text-[#4edea3] border-[#00a572]/40' },
  archived:             { label: 'Archived',      color: 'bg-[#34343d]/40 text-[#908fa0] border-[#464554]/30' },
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
    <div className="min-h-screen bg-[#13131b] font-inter text-[#e4e1ed]">
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">

        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#464554]/30 pb-6 gap-4">
          <div>
            <h1 className="text-[28px] font-bold font-outfit text-[#c0c1ff] leading-tight">My Requests</h1>
            <p className="text-sm text-[#908fa0] mt-1 font-inter">Manage and track your AI automation initiatives across departments.</p>
          </div>
          <button
            onClick={() => router.push('/intake/new')}
            className="bg-gradient-to-r from-indigo-600 to-[#8083ff] hover:brightness-110 text-white font-semibold text-xs px-6 py-2.5 rounded-full flex items-center gap-2 transition-all shadow-md shadow-[#6366f1]/30 active:scale-95 cursor-pointer w-fit"
          >
            <Plus className="h-4 w-4" />
            <span>New Automation Request</span>
          </button>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-xl border border-[#464554]/30 flex flex-col gap-1">
            <span className="text-[#908fa0] font-outfit font-bold uppercase tracking-wider text-[10px]">Total Requests</span>
            <span className="text-2xl font-black font-outfit text-white">{totalCount}</span>
            <div className="w-full h-1 bg-[#464554]/20 mt-2 rounded-full overflow-hidden">
              <div className="w-full h-full bg-[#c0c1ff]" />
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-[#464554]/30 flex flex-col gap-1">
            <span className="text-[#908fa0] font-outfit font-bold uppercase tracking-wider text-[10px]">Active Proposals</span>
            <span className="text-2xl font-black font-outfit text-[#4edea3]">{activeCount}</span>
            <div className="w-full h-1 bg-[#464554]/20 mt-2 rounded-full overflow-hidden">
              <div className="w-3/4 h-full bg-[#4edea3]" />
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-[#464554]/30 flex flex-col gap-1">
            <span className="text-[#908fa0] font-outfit font-bold uppercase tracking-wider text-[10px]">Drafts</span>
            <span className="text-2xl font-black font-outfit text-[#ffb95f]">{draftCount}</span>
            <div className="w-full h-1 bg-[#464554]/20 mt-2 rounded-full overflow-hidden">
              <div className="w-1/4 h-full bg-[#ffb95f]" />
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-[#464554]/30 flex flex-col gap-1">
            <span className="text-[#908fa0] font-outfit font-bold uppercase tracking-wider text-[10px]">Avg AI Score</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black font-outfit text-white">{avgScore}</span>
              {avgScore !== '--' && <span className="text-xs text-[#908fa0]"> /100</span>}
            </div>
            <div className="w-full h-1 bg-[#464554]/20 mt-2 rounded-full overflow-hidden">
              <div className="w-[78%] h-full bg-[#8083ff]" />
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="glass-panel p-4 rounded-xl border border-[#464554]/30 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative w-full md:flex-1">
            <Search className="absolute top-1/2 left-3.5 -translate-y-1/2 h-4 w-4 text-[#908fa0]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by title..."
              className="w-full bg-[#1f1f27] border border-[#464554]/40 rounded-lg pl-10 pr-4 py-2 text-xs text-[#e4e1ed] placeholder-[#908fa0] focus:outline-none focus:ring-1 focus:ring-[#6366f1]"
            />
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:flex-nowrap">
            {/* Department Dropdown */}
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="bg-[#1f1f27] border border-[#464554]/40 text-[#e4e1ed] text-xs font-semibold rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366f1] cursor-pointer"
            >
              <option value="All">All Departments</option>
              {Object.keys(DEPARTMENT_ICONS).map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1 rounded-lg border border-[#464554]/40 bg-[#1f1f27] p-1">
              {[
                { value: 'All', label: 'All' },
                { value: 'approved', label: 'Approved' },
                { value: 'roi_calculated', label: 'ROI Evaluated' },
                { value: 'draft', label: 'Drafts' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSelectedStatusFilter(value)}
                  className={`h-7 rounded-md px-3 text-xs font-semibold transition-all cursor-pointer ${
                    selectedStatusFilter === value
                      ? 'bg-[#6366f1] text-white shadow-xs'
                      : 'text-[#908fa0] hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Sort Toggle */}
            <button
              onClick={() => setSortBy(sortBy === 'newest' ? 'score' : 'newest')}
              className="flex items-center gap-1.5 rounded-lg border border-[#464554]/40 bg-[#1f1f27] px-3 py-2 text-xs font-semibold text-[#c0c1ff] hover:bg-[#34343d] transition-all cursor-pointer"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-[#c0c1ff]" />
              <span>{sortBy === 'score' ? 'Highest Score' : 'Newest First'}</span>
            </button>
          </div>
        </div>

        {/* Requests List */}
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[#908fa0] text-xs font-medium">Loading your requests…</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-[#93000a]/20 border border-[#ffb4ab]/30 text-[#ffb4ab] text-xs text-center">
            {error}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="glass-panel rounded-xl border border-[#464554]/30 p-12 text-center max-w-lg mx-auto space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#6366f1]/15 border border-[#6366f1]/30 flex items-center justify-center text-[#c0c1ff] mx-auto">
              <FileText className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold font-outfit text-white">No requests found</h2>
              <p className="text-xs text-[#908fa0]">
                {searchQuery || selectedDepartment !== 'All' || selectedStatusFilter !== 'All'
                  ? 'No requests match your current filters.'
                  : 'Submit your first automation request and our AI will guide you through capturing requirements and calculating ROI.'}
              </p>
            </div>
            <button
              onClick={() => router.push('/intake/new')}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-[#8083ff] hover:brightness-110 px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-[#6366f1]/30 transition-all cursor-pointer"
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
                color: 'bg-[#34343d]/40 text-[#908fa0] border-[#464554]/30',
              };
              const icon = DEPARTMENT_ICONS[req.department] || '💼';
              const updatedDate = new Date(req.updatedAt).toLocaleDateString(undefined, {
                month: 'short', day: 'numeric', year: 'numeric',
              });

              return (
                <div
                  key={req._id}
                  className="glass-panel group flex flex-col justify-between gap-4 rounded-xl border border-[#464554]/30 p-5 transition-all duration-200 hover:border-[#6366f1]/50 md:flex-row md:items-center"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#464554]/40 bg-[#0d0d15] text-xl transition-transform group-hover:scale-105">
                      {icon}
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="truncate text-sm font-semibold text-white transition-colors group-hover:text-[#c0c1ff]">
                          {req.title}
                        </h3>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#908fa0]">
                        <span className="flex items-center gap-1.5">
                          <Building className="h-3.5 w-3.5 text-[#908fa0]" />
                          {req.department}
                        </span>
                        <span className="hidden text-[#464554] sm:inline">•</span>
                        <span className="flex items-center gap-1.5 font-mono-code text-[11px]">
                          <Clock className="h-3.5 w-3.5 text-[#908fa0]" />
                          Updated {updatedDate}
                        </span>
                        {req.priorityScore > 0 && (
                          <>
                            <span className="hidden text-[#464554] sm:inline">•</span>
                            <span className="rounded-full border border-[#4edea3]/30 bg-[#00a572]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#4edea3] font-outfit">
                              Score: {req.priorityScore.toFixed(0)}/100
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center self-end md:self-center">
                    <Link
                      href={req.status === 'draft' ? `/intake/${req._id}` : `/requests/${req._id}`}
                      className="text-[#c0c1ff] hover:underline font-semibold text-xs transition-colors flex items-center gap-1"
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


