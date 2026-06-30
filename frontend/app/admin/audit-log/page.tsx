'use client';

import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

interface AuditLogEntry {
  _id: string;
  actorId?: { _id: string; name: string; email: string; username: string; role: string };
  actionType: string;
  entityType: string;
  entityId: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  ipAddress?: string;
  timestamp: string;
}

const selectClass =
  'bg-[#1a1a2e] border border-[#2a2a4e] text-[#d1d5db] text-xs font-semibold rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#6366f1] cursor-pointer';

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedActionType, setSelectedActionType] = useState('all');
  const [selectedEntityType, setSelectedEntityType] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchLogs() {
      setIsLoading(true);
      setError('');
      try {
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: '15',
          actionType: selectedActionType,
          entityType: selectedEntityType,
        });
        const res = await fetch(`/api/admin/audit-log?${queryParams.toString()}`);
        if (!res.ok) {
          setError(res.status === 403 ? 'Admin permission required to view audit logs.' : 'Failed to fetch audit log.');
          return;
        }
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalLogs(data.totalLogs || 0);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching audit logs');
      } finally {
        setIsLoading(false);
      }
    }
    fetchLogs();
  }, [currentPage, selectedActionType, selectedEntityType]);

  return (
    <div className="min-h-screen bg-[#0a0a12] text-[#e0e0e0] font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">System Audit & Compliance Log</h1>
            <p className="text-sm text-[#9ca3af] mt-1">
              Immutable audit trail — all user approvals, overrides, and state transitions. sys_admin only.
            </p>
          </div>
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#6366f1]/15 text-[#818cf8] border border-[#6366f1]/25 w-fit">
            {totalLogs.toLocaleString()} Events Captured
          </span>
        </div>

        {/* Filter Controls */}
        <div className="bg-[#0f0f1e] border border-[#1e1e3a] p-4 rounded-2xl flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280] whitespace-nowrap">Action:</label>
            <select
              value={selectedActionType}
              onChange={(e) => { setSelectedActionType(e.target.value); setCurrentPage(1); }}
              className={selectClass}
            >
              <option value="all">All Actions</option>
              <option value="ACCOUNT_REGISTERED">ACCOUNT_REGISTERED</option>
              <option value="ACCOUNT_APPROVED">ACCOUNT_APPROVED</option>
              <option value="USER_STATUS_UPDATED">USER_STATUS_UPDATED</option>
              <option value="USER_ROLE_UPDATED">USER_ROLE_UPDATED</option>
              <option value="REQUEST_CREATED">REQUEST_CREATED</option>
              <option value="REQUEST_STATUS_UPDATED">REQUEST_STATUS_UPDATED</option>
              <option value="ESTIMATE_OVERRIDDEN">ESTIMATE_OVERRIDDEN</option>
              <option value="PRIORITY_WEIGHTS_UPDATED">PRIORITY_WEIGHTS_UPDATED</option>
              <option value="EFFORT_RANGES_UPDATED">EFFORT_RANGES_UPDATED</option>
              <option value="BLENDED_RATES_UPDATED">BLENDED_RATES_UPDATED</option>
              <option value="COMMENT_CREATED">COMMENT_CREATED</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280] whitespace-nowrap">Entity:</label>
            <select
              value={selectedEntityType}
              onChange={(e) => { setSelectedEntityType(e.target.value); setCurrentPage(1); }}
              className={selectClass}
            >
              <option value="all">All Entities</option>
              <option value="User">User</option>
              <option value="Request">Request</option>
              <option value="PriorityWeightsConfig">PriorityWeightsConfig</option>
              <option value="SystemSettings">SystemSettings</option>
              <option value="RequestComment">RequestComment</option>
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[#6b7280] text-sm font-medium">Loading audit logs…</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm text-center">
            {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center bg-[#0f0f1e] rounded-2xl border border-[#1e1e3a] text-[#6b7280] text-sm font-medium">
            No audit log entries match the selected filter criteria.
          </div>
        ) : (
          <div className="bg-[#0f0f1e] border border-[#1e1e3a] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#e0e0e0]">
                <thead className="border-b border-[#1e1e3a] text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">
                  <tr>
                    <th className="px-5 py-3.5">Timestamp</th>
                    <th className="px-5 py-3.5">Actor</th>
                    <th className="px-5 py-3.5">Action Type</th>
                    <th className="px-5 py-3.5">Entity Type</th>
                    <th className="px-5 py-3.5">Entity ID</th>
                    <th className="px-5 py-3.5 text-right">State Diff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a2e]">
                  {logs.map((log) => {
                    const dateFormatted = new Date(log.timestamp).toLocaleString();
                    const isExpanded = expandedId === log._id;
                    const hasDiff = !!log.beforeState || !!log.afterState;

                    return (
                      <React.Fragment key={log._id}>
                        <tr className="hover:bg-[#1a1a2e]/50 transition-colors">
                          <td className="px-5 py-4 font-mono text-[11px] text-[#6b7280] whitespace-nowrap">
                            {dateFormatted}
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-bold text-white">{log.actorId?.name || 'System / Unregistered'}</p>
                            <p className="text-[#6b7280] text-[11px]">{log.actorId?.email || '—'}</p>
                          </td>
                          <td className="px-5 py-4 font-mono">
                            <span className="px-2.5 py-0.5 rounded-md bg-[#6366f1]/15 text-[#818cf8] font-bold border border-[#6366f1]/25 text-[11px]">
                              {log.actionType}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-white font-bold">{log.entityType}</td>
                          <td className="px-5 py-4 font-mono text-[11px] text-[#6b7280]">{log.entityId}</td>
                          <td className="px-5 py-4 text-right">
                            {hasDiff ? (
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : log._id)}
                                className="px-3 py-1.5 rounded-xl bg-[#1a1a2e] hover:bg-[#6366f1] hover:text-white border border-[#2a2a4e] text-[#d1d5db] font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-1"
                              >
                                <span>{isExpanded ? 'Hide' : 'View'} Diff</span>
                                {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              </button>
                            ) : (
                              <span className="text-[#4b5563] text-xs font-medium">No Diff</span>
                            )}
                          </td>
                        </tr>

                        {/* Expanded State Diff Drawer */}
                        {isExpanded && (
                          <tr className="bg-[#0d0d1c]">
                            <td colSpan={6} className="px-5 py-4 border-t border-[#1e1e3a]">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                                <div>
                                  <p className="text-amber-300 font-bold mb-1 uppercase tracking-wider text-[10px]">Before State</p>
                                  <pre className="p-3.5 bg-[#0a0a12] border border-[#1e1e3a] rounded-xl text-[#9ca3af] overflow-x-auto max-h-48">
                                    {log.beforeState ? JSON.stringify(log.beforeState, null, 2) : 'null'}
                                  </pre>
                                </div>
                                <div>
                                  <p className="text-emerald-300 font-bold mb-1 uppercase tracking-wider text-[10px]">After State</p>
                                  <pre className="p-3.5 bg-[#0a0a12] border border-[#1e1e3a] rounded-xl text-[#9ca3af] overflow-x-auto max-h-48">
                                    {log.afterState ? JSON.stringify(log.afterState, null, 2) : 'null'}
                                  </pre>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-5 py-4 bg-[#0d0d1c] border-t border-[#1e1e3a] flex items-center justify-between text-xs text-[#6b7280] font-medium">
              <span>Page {currentPage} of {totalPages} ({totalLogs.toLocaleString()} Total Events)</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="px-3.5 py-1.5 rounded-xl bg-[#1a1a2e] border border-[#2a2a4e] text-[#d1d5db] font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1e1e3a] transition-all cursor-pointer"
                >
                  ← Prev
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="px-3.5 py-1.5 rounded-xl bg-[#1a1a2e] border border-[#2a2a4e] text-[#d1d5db] font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1e1e3a] transition-all cursor-pointer"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer note */}
        <div className="flex items-center gap-2 text-[11px] text-[#4b5563] font-semibold uppercase tracking-wider">
          <ShieldCheck className="h-4 w-4 text-emerald-500/60" />
          <span>Immutable Audit Trail — read-only, append-only, no edit or delete</span>
        </div>
      </main>
    </div>
  );
}
