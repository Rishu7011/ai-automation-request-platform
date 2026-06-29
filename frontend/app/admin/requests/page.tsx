'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DEPARTMENTS } from '@/constants';
import DuplicateComparisonModal from '@/components/DuplicateComparisonModal';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  draft:              { label: 'Draft',          color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  ai_reviewing:       { label: 'AI Reviewing',   color: 'bg-violet-500/10 text-violet-400 border-violet-500/30' },
  submitted:          { label: 'Submitted',       color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  needs_more_info:    { label: 'Info Needed',     color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  engineering_review: { label: 'Eng Review',     color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  approved:           { label: 'Approved',        color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  rejected:           { label: 'Rejected',        color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  planned:            { label: 'Planned',          color: 'bg-teal-500/10 text-teal-400 border-teal-500/30' },
  in_development:     { label: 'In Dev',          color: 'bg-blue-600/10 text-blue-300 border-blue-600/30' },
  testing:            { label: 'Testing',          color: 'bg-violet-500/10 text-violet-400 border-violet-500/30' },
  completed:          { label: 'Completed',        color: 'bg-green-500/10 text-green-400 border-green-500/30' },
  archived:           { label: 'Archived',         color: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
};

const DEPARTMENT_ICONS: Record<string, string> = {
  Recruitment: '🤝', HR: '🧑‍💼', Finance: '💵', Compliance: '⚖️',
  IT: '💻', Operations: '⚙️', Engineering: '🔧', Legal: '📜',
  Sales: '📈', Marketing: '🎯',
};

const BULK_STATUSES = [
  { value: 'engineering_review', label: 'Move to Eng Review' },
  { value: 'approved',           label: 'Approve' },
  { value: 'rejected',           label: 'Reject' },
  { value: 'archived',           label: 'Archive' },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<AdminRequestItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [duplicateModalData, setDuplicateModalData] = useState<{
    requestId: string;
    title: string;
    department: string;
  } | null>(null);

  // Bulk select state (Task 4.4)
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

  const filteredRequests = requests.filter((req) => {
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

  // Bulk select helpers
  const allSelected = filteredRequests.length > 0 && filteredRequests.every((r) => selected.has(r._id));
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredRequests.map((r) => r._id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
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
        body: JSON.stringify({
          requestIds: Array.from(selected),
          newStatus: bulkStatus,
          reasonNote: bulkReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBulkResult(`❌ ${data.error}`);
      } else {
        setBulkResult(`✅ Updated ${data.updated} request${data.updated !== 1 ? 's' : ''}.`);
        setSelected(new Set());
        setBulkStatus('');
        setBulkReason('');
        // Refresh list
        const r2 = await fetch('/api/admin/requests');
        if (r2.ok) { const d2 = await r2.json(); setRequests(d2.requests ?? []); }
      }
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  const needsReason = ['rejected', 'needs_more_info'].includes(bulkStatus);

  return (
    <div className="min-h-screen bg-[#0a0a12] text-[#e0e0e0]">
      {/* ── Header ── */}
      <div className="border-b border-[#1e1e3a] bg-[#0f0f1e]/80 backdrop-blur-md px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎛️</span>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Engineering Pipeline</h1>
              <p className="text-[#6b7280] text-xs">{requests.length} total requests across all departments</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/audit-log"
              className="text-xs text-[#9ca3af] hover:text-white px-3 py-1.5 rounded-lg border border-[#2a2a4e] transition-colors">
              📜 Audit Log
            </Link>
            <Link href="/admin/settings/priority-weights"
              className="text-xs text-[#9ca3af] hover:text-white px-3 py-1.5 rounded-lg border border-[#2a2a4e] transition-colors">
              ⚙️ Settings
            </Link>
            <Link href="/ledger"
              className="text-xs text-[#9ca3af] hover:text-white px-3 py-1.5 rounded-lg border border-[#2a2a4e] transition-colors">
              👁️ Ledger
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Filters ── */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-6">
          <input
            type="text"
            placeholder="Search by title, requester name, or email…"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSelected(new Set()); }}
            className="flex-1 bg-[#0f0f1e] border border-[#1e1e3a] rounded-xl px-4 py-2.5 text-sm text-[#e0e0e0] placeholder-[#4b5563] focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-transparent"
          />
          <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}
            className="bg-[#0f0f1e] border border-[#1e1e3a] rounded-xl px-4 py-2.5 text-sm text-[#e0e0e0] focus:outline-none focus:ring-2 focus:ring-[#6366f1]">
            <option value="all">All Departments</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#0f0f1e] border border-[#1e1e3a] rounded-xl px-4 py-2.5 text-sm text-[#e0e0e0] focus:outline-none focus:ring-2 focus:ring-[#6366f1]">
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_BADGES).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
          </select>
          <button
            onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
              showDuplicatesOnly
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-[#0f0f1e] text-gray-400 border-[#1e1e3a] hover:text-white'
            }`}
          >
            ⚠️ Duplicates Only
          </button>
        </div>

        {/* ── Bulk Action Bar (Task 4.4) ── */}
        {someSelected && (
          <div className="mb-4 p-3 bg-[#1a1a2e] border border-[#2a2a4e] rounded-xl flex flex-wrap items-center gap-3">
            <span className="text-[#9ca3af] text-xs">{selected.size} selected</span>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="bg-[#0f0f1e] border border-[#2a2a4e] text-[#d1d5db] text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#6366f1]"
            >
              <option value="">— Choose action —</option>
              {BULK_STATUSES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
            {needsReason && (
              <input
                type="text"
                placeholder="Reason (required)…"
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                className="bg-[#0f0f1e] border border-[#2a2a4e] text-[#d1d5db] text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#6366f1] min-w-[200px]"
              />
            )}
            <button
              onClick={handleBulkAction}
              disabled={isBulkSubmitting || !bulkStatus || (needsReason && !bulkReason.trim())}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#6366f1] hover:bg-[#5558e0] disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
            >
              {isBulkSubmitting ? 'Applying…' : 'Apply'}
            </button>
            <button onClick={() => setSelected(new Set())} className="text-xs text-[#6b7280] hover:text-white">Clear</button>
            {bulkResult && <span className={`text-xs ${bulkResult.startsWith('✅') ? 'text-emerald-400' : 'text-red-400'}`}>{bulkResult}</span>}
          </div>
        )}

        {/* ── Requests Table ── */}
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#9ca3af] text-sm">Loading pipeline…</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-sm text-center my-8">{error}</div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center bg-[#0f0f1e] rounded-2xl border border-[#1e1e3a] text-[#9ca3af] text-sm">
            No requests matched your filters.
          </div>
        ) : (
          <div className="bg-[#0f0f1e] border border-[#1e1e3a] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#e0e0e0]">
                <thead className="bg-[#1a1a2e] text-[#6b7280] uppercase text-[10px] tracking-wider border-b border-[#1e1e3a]">
                  <tr>
                    <th className="px-4 py-4 w-10">
                      <input type="checkbox" checked={allSelected} onChange={toggleAll}
                        className="rounded border-[#2a2a4e] accent-[#6366f1] cursor-pointer" />
                    </th>
                    <th className="px-4 py-4">Title & Department</th>
                    <th className="px-4 py-4">Requester</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Priority</th>
                    <th className="px-4 py-4">Assigned To</th>
                    <th className="px-4 py-4">Updated</th>
                    <th className="px-4 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e1e3a]">
                  {filteredRequests.map((req) => {
                    const badge = STATUS_BADGES[req.status] || { label: req.status, color: 'bg-gray-500/10 text-gray-400 border-gray-500/30' };
                    const icon = DEPARTMENT_ICONS[req.department] || '💼';
                    const isChecked = selected.has(req._id);
                    const updatedDate = new Date(req.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

                    return (
                      <tr key={req._id}
                        className={`hover:bg-[#131326] transition-colors group ${isChecked ? 'bg-[#6366f1]/5' : ''}`}>
                        <td className="px-4 py-3.5">
                          <input type="checkbox" checked={isChecked} onChange={() => toggleOne(req._id)}
                            className="rounded border-[#2a2a4e] accent-[#6366f1] cursor-pointer" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">{icon}</span>
                            <div>
                              <p className="font-semibold text-white text-sm group-hover:text-[#818cf8] transition-colors">{req.title}</p>
                              <p className="text-[#6b7280] text-[11px]">{req.department}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-white">{req.requesterId?.name ?? '—'}</p>
                          <p className="text-[#6b7280] text-[11px]">{req.requesterId?.email ?? ''}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-[#818cf8]">
                            {req.priorityScore > 0 ? req.priorityScore.toFixed(1) : '—'}
                          </span>
                          {req.roiConfidence && (
                            <p className="text-[#6b7280] text-[10px]">{req.roiConfidence} ROI</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-[#9ca3af]">
                          {req.assignedTo ? (
                            <span className="text-[#d1d5db]">{req.assignedTo.name}</span>
                          ) : (
                            <span className="text-[#4b5563] italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-[#9ca3af]">{updatedDate}</td>
                        <td className="px-4 py-3.5 text-right flex items-center justify-end gap-2">
                          {req.isDuplicateFlagged && (
                            <button
                              onClick={() =>
                                setDuplicateModalData({
                                  requestId: req._id,
                                  title: req.title,
                                  department: req.department,
                                })
                              }
                              className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 text-xs font-semibold transition-colors flex items-center gap-1"
                              title="Compare duplicate candidates"
                            >
                              ⚠️ Duplicate
                            </button>
                          )}
                          <Link
                            href={`/admin/requests/${req._id}`}
                            className="px-3 py-1.5 rounded-lg bg-[#1a1a2e] border border-[#2a2a4e] hover:bg-[#6366f1] hover:border-[#6366f1] hover:text-white text-[#e0e0e0] font-medium text-xs transition-colors inline-block whitespace-nowrap"
                          >
                            Review →
                          </Link>
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
              // Refetch requests
              fetch('/api/admin/requests')
                .then((res) => res.json())
                .then((data) => setRequests(data.requests || []));
            }}
          />
        )}
      </div>
    </div>
  );
}
