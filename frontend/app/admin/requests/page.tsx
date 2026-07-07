'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  FileText,
  DollarSign,
  Clock,
  BarChart2,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';
import { DEPARTMENTS } from '@/constants';
import DuplicateComparisonModal from '@/components/DuplicateComparisonModal';

interface AdminRequestItem {
  _id: string;
  title: string;
  department: string;
  status: string;
  priorityScore: number;
  roiConfidence?: string;
  isDuplicateFlagged?: boolean;
  createdAt: string;
  updatedAt: string;
  requesterId?: { _id: string; name: string; email: string; department: string };
  assignedTo?: { _id: string; name: string; username: string };
}

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  draft:              { label: 'Draft',        color: 'bg-[#ffb95f]/15 text-[#ffb95f] border-[#ffb95f]/30' },
  ai_reviewing:       { label: 'AI Reviewing', color: 'bg-[#8083ff]/15 text-[#c0c1ff] border-[#8083ff]/30' },
  submitted:          { label: 'Submitted',    color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  needs_more_info:    { label: 'Info Needed',  color: 'bg-[#ffb95f]/15 text-[#ffb95f] border-[#ffb95f]/30' },
  engineering_review: { label: 'Eng Review',  color: 'bg-[#6366f1]/15 text-[#c0c1ff] border-[#6366f1]/30' },
  approved:           { label: 'Approved',     color: 'bg-[#00a572]/15 text-[#4edea3] border-[#00a572]/30' },
  rejected:           { label: 'Rejected',     color: 'bg-[#93000a]/30 text-[#ffb4ab] border-[#ffb4ab]/30' },
  planned:            { label: 'Planned',      color: 'bg-[#00a572]/15 text-[#4edea3] border-[#00a572]/30' },
  in_development:     { label: 'In Dev',       color: 'bg-[#6366f1]/20 text-[#c0c1ff] border-[#6366f1]/30' },
  testing:            { label: 'Testing',      color: 'bg-[#8083ff]/15 text-[#c0c1ff] border-[#8083ff]/30' },
  completed:          { label: 'Completed',    color: 'bg-[#00a572]/20 text-[#4edea3] border-[#00a572]/40' },
  archived:           { label: 'Archived',     color: 'bg-[#34343d]/40 text-[#908fa0] border-[#464554]/30' },
};

const DEPARTMENT_ICONS: Record<string, string> = {
  Recruitment: '🤝', HR: '🧑‍💼', Finance: '💵', Compliance: '⚖️',
  IT: '💻', Operations: '⚙️', Engineering: '🔧', Legal: '📜',
  Sales: '📈', Marketing: '🎯',
};

const BULK_STATUSES = [
  { value: 'engineering_review', label: 'Move to Eng Review' },
  { value: 'approved', label: 'Approve' },
  { value: 'rejected', label: 'Reject' },
  { value: 'archived', label: 'Archive' },
];

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<AdminRequestItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
  const [sortBy, setSortBy] = useState('priority');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [duplicateModalData, setDuplicateModalData] = useState<{ requestId: string; title: string; department: string } | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkReason, setBulkReason] = useState('');
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [bulkResult, setBulkResult] = useState('');

  useEffect(() => {
    async function fetchAdminRequests() {
      try {
        const res = await fetch(`/api/admin/requests?sortBy=${sortBy}`);
        if (!res.ok) {
          setError(res.status === 403 ? 'Admin permissions required.' : 'Failed to fetch requests.');
          return;
        }
        const data = await res.json();
        setRequests(data.requests || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching requests');
      } finally {
        setIsLoading(false);
      }
    }
    fetchAdminRequests();
  }, [sortBy]);

  const filteredRequests = useMemo(() => {
    const list = requests.filter((req) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        req.title.toLowerCase().includes(q) ||
        req.requesterId?.name.toLowerCase().includes(q) ||
        req.requesterId?.email.toLowerCase().includes(q);
      const matchesDept = selectedDepartment === 'all' || req.department === selectedDepartment;
      const matchesStatus = selectedStatus === 'all' || req.status === selectedStatus;
      const matchesDuplicates = !showDuplicatesOnly || req.isDuplicateFlagged === true;
      return matchesSearch && matchesDept && matchesStatus && matchesDuplicates;
    });

    list.sort((a, b) => {
      if (sortBy === 'priority') {
        if ((b.priorityScore || 0) !== (a.priorityScore || 0)) {
          return (b.priorityScore || 0) - (a.priorityScore || 0);
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return 0;
    });

    return list;
  }, [requests, searchQuery, selectedDepartment, selectedStatus, showDuplicatesOnly, sortBy]);

  const allSelected = filteredRequests.length > 0 && filteredRequests.every((r) => selected.has(r._id));
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(filteredRequests.map((r) => r._id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const handleBulkAction = async () => {
    if (!bulkStatus || selected.size === 0) return;
    setBulkResult('');
    setIsBulkSubmitting(true);
    try {
      const res = await fetch('/api/admin/requests/bulk-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestIds: Array.from(selected), newStatus: bulkStatus, reasonNote: bulkReason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBulkResult(`❌ ${data.error}`);
      } else {
        setBulkResult(`✅ Updated ${data.updated} request${data.updated !== 1 ? 's' : ''}.`);
        setSelected(new Set()); setBulkStatus(''); setBulkReason('');
        const r2 = await fetch('/api/admin/requests');
        if (r2.ok) { const d2 = await r2.json(); setRequests(d2.requests ?? []); }
      }
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  const needsReason = ['rejected', 'needs_more_info'].includes(bulkStatus);
  const pendingCount  = requests.filter((r) => ['submitted', 'engineering_review', 'needs_more_info'].includes(r.status)).length;
  const approvedCount = requests.filter((r) => ['approved', 'in_development'].includes(r.status)).length;
  const avgScore = useMemo(() => {
    const scored = requests.filter((r) => r.priorityScore > 0);
    if (scored.length === 0) return '--';
    return (scored.reduce((acc, r) => acc + r.priorityScore, 0) / scored.length).toFixed(1);
  }, [requests]);

  const selectClass = 'bg-[#1f1f27] border border-[#464554]/40 text-[#e4e1ed] text-xs font-semibold rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#6366f1] appearance-none cursor-pointer [color-scheme:dark]';

  return (
    <div className="min-h-screen bg-[#13131b] text-[#e4e1ed] font-inter">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Page header */}
        <div className="flex flex-col gap-4 border-b border-[#464554]/30 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold font-outfit text-[#c0c1ff] tracking-tight mb-1">Engineering Prioritization Backlog</h1>
            <p className="text-xs text-[#908fa0] max-w-2xl">
              Precision-ranked automation requests driven by AI ROI &amp; effort modeling.
            </p>
          </div>

          <Link
            href="/intake/new"
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-[#8083ff] hover:brightness-110 text-white font-semibold text-xs transition-all shadow-md shadow-[#6366f1]/30 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Submit Request</span>
          </Link>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-xl border border-[#464554]/30 flex items-center gap-4">
            <div className="h-11 w-11 rounded-lg bg-[#ffb95f]/15 border border-[#ffb95f]/30 flex items-center justify-center text-[#ffb95f] shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#908fa0] font-outfit">Pending Reviews</p>
              <p className="text-2xl font-bold text-white mt-0.5 font-outfit">{pendingCount}</p>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-[#464554]/30 flex items-center gap-4">
            <div className="h-11 w-11 rounded-lg bg-[#00a572]/15 border border-[#00a572]/30 flex items-center justify-center text-[#4edea3] shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#908fa0] font-outfit">Approved Backlog</p>
              <p className="text-2xl font-bold text-white mt-0.5 font-outfit">{approvedCount}</p>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-[#464554]/30 flex items-center gap-4">
            <div className="h-11 w-11 rounded-lg bg-[#6366f1]/15 border border-[#6366f1]/30 flex items-center justify-center text-[#c0c1ff] shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#908fa0] font-outfit">Total Requests</p>
              <p className="text-2xl font-bold text-white mt-0.5 font-outfit">{requests.length}</p>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-[#464554]/30 flex items-center gap-4">
            <div className="h-11 w-11 rounded-lg bg-[#8083ff]/15 border border-[#8083ff]/30 flex items-center justify-center text-[#4edea3] shrink-0">
              <BarChart2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#908fa0] font-outfit">Avg ROI Score</p>
              <p className="text-2xl font-bold text-white mt-0.5 font-outfit">
                {avgScore}{avgScore !== '--' && <span className="text-xs text-[#908fa0] font-normal"> /100</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="glass-panel p-4 rounded-xl border border-[#464554]/30 space-y-3">
          {/* Search */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#908fa0]" />
            <input
              type="text"
              placeholder="Search by title, requester, or email…"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSelected(new Set()); }}
              className="w-full bg-[#1f1f27] border border-[#464554]/40 rounded-lg pl-10 pr-4 py-2 text-xs text-[#e4e1ed] placeholder-[#908fa0] focus:outline-none focus:ring-1 focus:ring-[#6366f1] transition-all [color-scheme:dark]"
            />
          </div>

          {/* Horizontally scrollable filter row */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
            <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className={`${selectClass} shrink-0`}>
              <option value="all">All Departments</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>

            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className={`${selectClass} shrink-0`}>
              <option value="all">All Statuses</option>
              {Object.entries(STATUS_BADGES).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
            </select>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={`${selectClass} shrink-0`}>
              <option value="priority">Priority ↓</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>

            <button
              onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)}
              className={`shrink-0 px-3.5 py-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                showDuplicatesOnly
                  ? 'bg-[#ffb95f]/20 text-[#ffb95f] border-[#ffb95f]/40'
                  : 'bg-[#1f1f27] border-[#464554]/40 text-[#c7c4d7] hover:bg-[#34343d]'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 text-[#ffb95f]" />
              <span>Duplicates</span>
            </button>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {someSelected && (
          <div className="p-4 bg-[#6366f1]/15 border border-[#6366f1]/40 rounded-xl flex flex-wrap items-center gap-3">
            <span className="text-[#c0c1ff] font-bold text-xs">{selected.size} selected</span>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="bg-[#1f1f27] border border-[#464554]/40 text-[#e4e1ed] text-xs rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1] cursor-pointer [color-scheme:dark]"
            >
              <option value="">— Choose bulk action —</option>
              {BULK_STATUSES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>

            {needsReason && (
              <input
                type="text"
                placeholder="Reason (required)…"
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                className="bg-[#1f1f27] border border-[#464554]/40 text-[#e4e1ed] text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366f1] min-w-[200px] [color-scheme:dark]"
              />
            )}

            <button
              onClick={handleBulkAction}
              disabled={isBulkSubmitting || !bulkStatus || (needsReason && !bulkReason.trim())}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#6366f1] hover:bg-[#8083ff] disabled:opacity-50 text-white transition-all cursor-pointer shadow-sm shadow-[#6366f1]/30"
            >
              {isBulkSubmitting ? 'Applying…' : 'Apply Action'}
            </button>

            <button onClick={() => setSelected(new Set())} className="text-xs font-medium text-[#908fa0] hover:text-white cursor-pointer">
              Clear
            </button>

            {bulkResult && (
              <span className={`text-xs font-bold ${bulkResult.startsWith('✅') ? 'text-[#4edea3]' : 'text-[#ffb4ab]'}`}>
                {bulkResult}
              </span>
            )}
          </div>
        )}

        {/* Requests Table */}
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[#908fa0] text-xs font-medium">Loading engineering backlog…</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-[#93000a]/20 border border-[#ffb4ab]/30 text-[#ffb4ab] text-xs text-center">
            {error}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center glass-panel rounded-xl border border-[#464554]/30 text-[#908fa0] text-xs font-medium">
            No requests matched your filter criteria.
          </div>
        ) : (
          <div className="glass-panel border border-[#464554]/30 rounded-xl overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#e4e1ed] border-collapse">
                <thead className="bg-[#1f1f27] border-b border-[#464554]/30 text-[10px] font-bold uppercase tracking-widest text-[#908fa0] font-outfit">
                  <tr>
                    <th className="px-5 py-4 w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="rounded border-[#464554] bg-[#0d0d15] text-[#6366f1] focus:ring-[#6366f1] cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-4">Title & Department</th>
                    <th className="px-6 py-4">Requester</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Priority Score</th>
                    <th className="px-6 py-4">Assigned Engineer</th>
                    <th className="px-6 py-4">Updated</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#464554]/20 font-inter text-xs">
                  {filteredRequests.map((req) => {
                    const badge = STATUS_BADGES[req.status] || { label: req.status, color: 'bg-[#34343d]/40 text-[#908fa0] border-[#464554]/30' };
                    const icon = DEPARTMENT_ICONS[req.department] || '💼';
                    const isChecked = selected.has(req._id);
                    const updatedDate = new Date(req.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

                    return (
                      <tr key={req._id} className={`hover:bg-[#34343d]/30 transition-colors group ${isChecked ? 'bg-[#6366f1]/10' : ''}`}>
                        <td className="px-5 py-4">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleOne(req._id)}
                            className="rounded border-[#464554] bg-[#0d0d15] text-[#6366f1] focus:ring-[#6366f1] cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <div className="flex items-center gap-3">
                            <span className="text-xl shrink-0">{icon}</span>
                            <div className="truncate">
                              <p className="font-semibold text-white text-xs group-hover:text-[#c0c1ff] transition-colors truncate">{req.title}</p>
                              <span className="inline-flex items-center gap-1 bg-[#0d0d15] border border-[#464554]/30 px-2 py-0.5 rounded-full text-[10px] text-[#c7c4d7] mt-0.5">
                                {req.department}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="font-semibold text-white">{req.requesterId?.name ?? '—'}</p>
                          <p className="text-[#908fa0] text-[11px] font-mono-code">{req.requesterId?.email ?? ''}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badge.color}`}>{badge.label}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {req.priorityScore > 0 ? (
                            <span className="font-mono-code text-xs text-[#4edea3] font-bold">
                              {req.priorityScore.toFixed(0)}/100
                            </span>
                          ) : (
                            <span className="text-[#908fa0] font-medium">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-[#908fa0] font-medium whitespace-nowrap">
                          {req.assignedTo ? (
                            <span className="text-white font-semibold">{req.assignedTo.name}</span>
                          ) : (
                            <span className="text-[#908fa0] italic text-[11px]">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-[#908fa0] font-mono-code text-xs whitespace-nowrap">{updatedDate}</td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-3">
                            {req.isDuplicateFlagged && (
                              <button
                                onClick={() => setDuplicateModalData({ requestId: req._id, title: req.title, department: req.department })}
                                className="px-2.5 py-1 rounded-md bg-[#ffb95f]/15 text-[#ffb95f] border border-[#ffb95f]/30 hover:bg-[#ffb95f]/25 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                                title="Compare duplicate candidates"
                              >
                                <AlertTriangle className="h-3.5 w-3.5" />
                                <span>Duplicate</span>
                              </button>
                            )}
                            <Link
                              href={`/admin/requests/${req._id}`}
                              className="text-[#c0c1ff] hover:underline font-semibold text-xs transition-colors"
                            >
                              Review Request
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {duplicateModalData && (
          <DuplicateComparisonModal
            requestId={duplicateModalData.requestId}
            requestTitle={duplicateModalData.title}
            requestDepartment={duplicateModalData.department}
            onClose={() => setDuplicateModalData(null)}
            onResolved={() => {
              setDuplicateModalData(null);
              fetch('/api/admin/requests').then((r) => r.json()).then((d) => setRequests(d.requests || []));
            }}
          />
        )}
      </main>
    </div>
  );
}


