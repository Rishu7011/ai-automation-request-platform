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
  Check,
  X
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
  draft:              { label: 'Draft',        color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  ai_reviewing:       { label: 'AI Reviewing', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  submitted:          { label: 'Submitted',    color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  needs_more_info:    { label: 'Info Needed',  color: 'bg-orange-500/15 text-orange-300 border-orange-500/30' },
  engineering_review: { label: 'Eng Review',  color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
  approved:           { label: 'Approved',     color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  rejected:           { label: 'Rejected',     color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  planned:            { label: 'Planned',      color: 'bg-teal-500/15 text-teal-300 border-teal-500/30' },
  in_development:     { label: 'In Dev',       color: 'bg-blue-600/20 text-blue-300 border-blue-500/30' },
  testing:            { label: 'Testing',      color: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
  completed:          { label: 'Completed',    color: 'bg-green-500/15 text-green-300 border-green-500/30' },
  archived:           { label: 'Archived',     color: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
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
        const res = await fetch('/api/admin/requests');
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
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
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
  }, [requests, searchQuery, selectedDepartment, selectedStatus, showDuplicatesOnly]);

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

  const selectClass = 'bg-[#1a1a2e] border border-[#2a2a4e] text-[#d1d5db] text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#6366f1] cursor-pointer';

  return (
    <div className="min-h-screen bg-[#0a0a12] text-[#e0e0e0] font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Engineering Prioritization Backlog</h1>
          <p className="text-sm text-[#9ca3af] mt-1">
            Precision-ranked requests driven by AI-extracted ROI and effort modeling. Admin-only view.
          </p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0f0f1e] p-5 rounded-2xl border border-[#1e1e3a] flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">Pending Reviews</p>
              <p className="text-xl font-bold text-white mt-0.5">{pendingCount}</p>
            </div>
          </div>

          <div className="bg-[#0f0f1e] p-5 rounded-2xl border border-[#1e1e3a] flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">Approved Backlog</p>
              <p className="text-xl font-bold text-white mt-0.5">{approvedCount}</p>
            </div>
          </div>

          <div className="bg-[#0f0f1e] p-5 rounded-2xl border border-[#1e1e3a] flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">Total Backlog</p>
              <p className="text-xl font-bold text-white mt-0.5">{requests.length}</p>
            </div>
          </div>

          <div className="bg-[#0f0f1e] p-5 rounded-2xl border border-[#1e1e3a] flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-[#6366f1]/10 border border-[#6366f1]/20 flex items-center justify-center text-[#818cf8] shrink-0">
              <BarChart2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">Avg Priority Score</p>
              <p className="text-xl font-bold text-white mt-0.5">
                {avgScore}{avgScore !== '--' && <span className="text-xs text-[#6b7280] font-normal"> /100</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-[#0f0f1e] border border-[#1e1e3a] p-4 rounded-2xl flex flex-col md:flex-row items-center gap-3">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#4b5563]" />
            <input
              type="text"
              placeholder="Search by title, requester name, or email…"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSelected(new Set()); }}
              className="w-full bg-[#1a1a2e] border border-[#2a2a4e] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#e0e0e0] placeholder-[#4b5563] focus:outline-none focus:ring-2 focus:ring-[#6366f1] transition-all"
            />
          </div>

          <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className={selectClass}>
            <option value="all">All Departments</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>

          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className={selectClass}>
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_BADGES).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
          </select>

          <button
            onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showDuplicatesOnly
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : 'bg-[#1a1a2e] border-[#2a2a4e] text-[#d1d5db] hover:bg-[#1e1e3a]'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            <span>Duplicates Only</span>
          </button>
        </div>

        {/* Bulk Action Bar */}
        {someSelected && (
          <div className="p-4 bg-[#6366f1]/10 border border-[#6366f1]/30 rounded-2xl flex flex-wrap items-center gap-3">
            <span className="text-[#818cf8] font-bold text-xs">{selected.size} selected</span>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="bg-[#1a1a2e] border border-[#2a2a4e] text-[#d1d5db] text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1] cursor-pointer"
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
                className="bg-[#1a1a2e] border border-[#2a2a4e] text-[#d1d5db] text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366f1] min-w-[200px]"
              />
            )}

            <button
              onClick={handleBulkAction}
              disabled={isBulkSubmitting || !bulkStatus || (needsReason && !bulkReason.trim())}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#6366f1] hover:bg-[#5558e0] disabled:opacity-50 text-white transition-all shadow-sm cursor-pointer"
            >
              {isBulkSubmitting ? 'Applying…' : 'Apply Action'}
            </button>

            <button onClick={() => setSelected(new Set())} className="text-xs font-semibold text-[#6b7280] hover:text-[#d1d5db] cursor-pointer">
              Clear
            </button>

            {bulkResult && (
              <span className={`text-xs font-bold ${bulkResult.startsWith('✅') ? 'text-emerald-400' : 'text-rose-400'}`}>
                {bulkResult}
              </span>
            )}
          </div>
        )}

        {/* Requests Table */}
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[#6b7280] text-sm font-medium">Loading engineering pipeline…</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm text-center">
            {error}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center bg-[#0f0f1e] rounded-2xl border border-[#1e1e3a] text-[#6b7280] text-sm font-medium">
            No requests matched your filter criteria.
          </div>
        ) : (
          <div className="bg-[#0f0f1e] border border-[#1e1e3a] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#e0e0e0]">
                <thead className="border-b border-[#1e1e3a] text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">
                  <tr>
                    <th className="px-4 py-3.5 w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="rounded border-[#2a2a4e] bg-[#1a1a2e] text-[#6366f1] focus:ring-[#6366f1] cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3.5">Title & Department</th>
                    <th className="px-4 py-3.5">Requester</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Priority Score</th>
                    <th className="px-4 py-3.5">Assigned Engineer</th>
                    <th className="px-4 py-3.5">Updated</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a2e]">
                  {filteredRequests.map((req) => {
                    const badge = STATUS_BADGES[req.status] || { label: req.status, color: 'bg-slate-500/15 text-slate-400 border-slate-500/30' };
                    const icon = DEPARTMENT_ICONS[req.department] || '💼';
                    const isChecked = selected.has(req._id);
                    const updatedDate = new Date(req.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

                    return (
                      <tr key={req._id} className={`hover:bg-[#1a1a2e]/50 transition-colors group ${isChecked ? 'bg-[#6366f1]/5' : ''}`}>
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleOne(req._id)}
                            className="rounded border-[#2a2a4e] bg-[#1a1a2e] text-[#6366f1] focus:ring-[#6366f1] cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xl shrink-0">{icon}</span>
                            <div>
                              <p className="font-bold text-white text-sm group-hover:text-[#818cf8] transition-colors">{req.title}</p>
                              <p className="text-[#6b7280] text-xs">{req.department}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-bold text-white">{req.requesterId?.name ?? '—'}</p>
                          <p className="text-[#6b7280] text-[11px]">{req.requesterId?.email ?? ''}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.color}`}>{badge.label}</span>
                        </td>
                        <td className="px-4 py-4">
                          {req.priorityScore > 0 ? (
                            <span className="px-2.5 py-1 rounded-lg bg-[#6366f1]/15 text-[#818cf8] font-bold text-xs border border-[#6366f1]/25 inline-block">
                              {req.priorityScore.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-[#4b5563] font-medium">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-[#9ca3af] font-medium">
                          {req.assignedTo ? (
                            <span className="text-white font-bold">{req.assignedTo.name}</span>
                          ) : (
                            <span className="text-[#4b5563] italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-[#6b7280] font-medium text-xs">{updatedDate}</td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {req.isDuplicateFlagged && (
                              <button
                                onClick={() => setDuplicateModalData({ requestId: req._id, title: req.title, department: req.department })}
                                className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="Compare duplicate candidates"
                              >
                                <AlertTriangle className="h-3.5 w-3.5" />
                                <span>Duplicate</span>
                              </button>
                            )}
                            <Link
                              href={`/admin/requests/${req._id}`}
                              className="px-3.5 py-1.5 rounded-xl border border-[#6366f1]/30 bg-[#6366f1]/10 text-[#818cf8] hover:bg-[#6366f1] hover:text-white hover:border-[#6366f1] font-bold text-xs transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            >
                              <span>Review</span>
                              <ArrowRight className="h-3.5 w-3.5" />
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
