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
  draft:                { label: 'Draft',         color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  ai_reviewing:         { label: 'AI Reviewing',  color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  submitted:            { label: 'Submitted',     color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  needs_more_info:      { label: 'Info Needed',   color: 'bg-orange-500/15 text-orange-300 border-orange-500/30' },
  in_review:            { label: 'In Review',     color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  roi_calculated:       { label: 'ROI Evaluated', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' },
  engineering_review:   { label: 'Eng Review',    color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
  approved:             { label: 'Approved',      color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  rejected:             { label: 'Rejected',      color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  planned:              { label: 'Planned',       color: 'bg-teal-500/15 text-teal-300 border-teal-500/30' },
  in_development:       { label: 'In Dev',        color: 'bg-blue-600/20 text-blue-300 border-blue-500/30' },
  testing:              { label: 'Testing',       color: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
  completed:            { label: 'Completed',     color: 'bg-green-500/15 text-green-300 border-green-500/30' },
  archived:             { label: 'Archived',      color: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
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
    <div className="min-h-screen bg-[#0a0a12] text-[#e0e0e0] font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">My Requests</h1>
            <p className="text-sm text-[#9ca3af] mt-1">
              All your automation proposals — draft, in-review, and approved.
            </p>
          </div>
          <button
            onClick={() => router.push('/intake/new')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5558e0] hover:to-[#7c4fdb] text-white font-bold text-xs transition-all shadow-md shadow-[#6366f1]/20 flex items-center gap-2 cursor-pointer w-fit"
          >
            <Plus className="h-4 w-4" />
            <span>New Automation Request</span>
          </button>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0f0f1e] p-5 rounded-2xl border border-[#1e1e3a] flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-[#6366f1]/15 border border-[#6366f1]/20 flex items-center justify-center text-[#818cf8] shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">Total</p>
              <p className="text-xl font-bold text-white mt-0.5">{totalCount}</p>
            </div>
          </div>

          <div className="bg-[#0f0f1e] p-5 rounded-2xl border border-[#1e1e3a] flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">Active</p>
              <p className="text-xl font-bold text-white mt-0.5">{activeCount}</p>
            </div>
          </div>

          <div className="bg-[#0f0f1e] p-5 rounded-2xl border border-[#1e1e3a] flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">Drafts</p>
              <p className="text-xl font-bold text-white mt-0.5">{draftCount}</p>
            </div>
          </div>

          <div className="bg-[#0f0f1e] p-5 rounded-2xl border border-[#1e1e3a] flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">Avg Score</p>
              <p className="text-xl font-bold text-white mt-0.5">
                {avgScore}
                {avgScore !== '--' && <span className="text-xs text-[#6b7280] font-normal"> /100</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-[#0f0f1e] border border-[#1e1e3a] p-4 rounded-2xl flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#4b5563]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or department…"
              className="w-full bg-[#1a1a2e] border border-[#2a2a4e] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#e0e0e0] placeholder-[#4b5563] focus:outline-none focus:ring-2 focus:ring-[#6366f1] transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Department Dropdown */}
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="bg-[#1a1a2e] border border-[#2a2a4e] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#d1d5db] focus:outline-none focus:ring-2 focus:ring-[#6366f1] cursor-pointer"
            >
              <option value="All">All Departments</option>
              {Object.keys(DEPARTMENT_ICONS).map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1 bg-[#1a1a2e] border border-[#2a2a4e] p-1 rounded-xl">
              {[
                { value: 'All', label: 'All' },
                { value: 'approved', label: 'Approved' },
                { value: 'roi_calculated', label: 'ROI Done' },
                { value: 'draft', label: 'Drafts' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSelectedStatusFilter(value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedStatusFilter === value
                      ? 'bg-[#6366f1] text-white shadow-sm'
                      : 'text-[#9ca3af] hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Sort Toggle */}
            <button
              onClick={() => setSortBy(sortBy === 'newest' ? 'score' : 'newest')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#2a2a4e] bg-[#1a1a2e] text-xs font-semibold text-[#d1d5db] hover:bg-[#1e1e3a] transition-all cursor-pointer"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-[#818cf8]" />
              <span>{sortBy === 'score' ? 'Highest Score' : 'Newest First'}</span>
            </button>
          </div>
        </div>

        {/* Requests List */}
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[#6b7280] text-sm font-medium">Loading your requests…</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm text-center">
            {error}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-[#0f0f1e] border border-[#1e1e3a] rounded-2xl p-12 text-center max-w-lg mx-auto space-y-5">
            <div className="h-16 w-16 rounded-2xl bg-[#1a1a2e] border border-[#2a2a4e] flex items-center justify-center text-3xl mx-auto">
              📋
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">No requests found</h2>
              <p className="text-[#9ca3af] text-xs leading-relaxed">
                {searchQuery || selectedDepartment !== 'All' || selectedStatusFilter !== 'All'
                  ? 'No requests match your current filters.'
                  : 'Submit your first automation request and our AI will guide you through capturing requirements and calculating ROI.'}
              </p>
            </div>
            <button
              onClick={() => router.push('/intake/new')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5558e0] hover:to-[#7c4fdb] text-white shadow-lg shadow-[#6366f1]/20 transition-all cursor-pointer"
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
                color: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
              };
              const icon = DEPARTMENT_ICONS[req.department] || '💼';
              const updatedDate = new Date(req.updatedAt).toLocaleDateString(undefined, {
                month: 'short', day: 'numeric', year: 'numeric',
              });

              return (
                <div
                  key={req._id}
                  className="group bg-[#0f0f1e] p-5 rounded-2xl border border-[#1e1e3a] hover:border-[#6366f1]/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-[#1a1a2e] border border-[#2a2a4e] flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                      {icon}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-base font-bold text-white group-hover:text-[#818cf8] transition-colors">
                          {req.title}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#6b7280] font-medium">
                        <span className="flex items-center gap-1">
                          <Building className="h-3.5 w-3.5 text-[#4b5563]" />
                          {req.department}
                        </span>
                        <span className="text-[#2a2a4e]">•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-[#4b5563]" />
                          Updated {updatedDate}
                        </span>
                        {req.priorityScore > 0 && (
                          <>
                            <span className="text-[#2a2a4e]">•</span>
                            <span className="px-2 py-0.5 rounded bg-[#6366f1]/15 text-[#818cf8] font-bold text-[11px] border border-[#6366f1]/25">
                              Score: {req.priorityScore.toFixed(1)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center">
                    <Link
                      href={req.status === 'draft' ? `/intake/${req._id}` : `/requests/${req._id}`}
                      className="px-4 py-2 rounded-xl text-xs font-bold border border-[#2a2a4e] text-[#818cf8] hover:bg-[#6366f1] hover:text-white hover:border-[#6366f1] transition-all flex items-center gap-1.5 whitespace-nowrap"
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
