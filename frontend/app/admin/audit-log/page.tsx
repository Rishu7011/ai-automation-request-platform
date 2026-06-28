'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AuditLogEntry {
  _id: string;
  actorId?: {
    _id: string;
    name: string;
    email: string;
    username: string;
    role: string;
  };
  actionType: string;
  entityType: string;
  entityId: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  ipAddress?: string;
  timestamp: string;
}

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
          if (res.status === 403) {
            setError('Admin permission required to view audit logs.');
          } else {
            setError('Failed to fetch audit log.');
          }
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
    <div className="min-h-screen bg-[#0a0a12] text-[#e0e0e0]">
      {/* Top Header */}
      <div className="border-b border-[#1e1e3a] bg-[#0f0f1e]/80 backdrop-blur-md px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white tracking-tight">📜 System Audit Log</h1>
            <span className="bg-[#1a1a2e] text-[#6366f1] border border-[#2a2a4e] text-xs px-2.5 py-0.5 rounded-full font-medium">
              {totalLogs} Audit Events
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <Link
              href="/admin/users"
              className="text-xs text-[#9ca3af] hover:text-white px-3 py-1.5 rounded-lg border border-[#2a2a4e] transition-colors"
            >
              👥 Users
            </Link>
            <Link
              href="/admin/requests"
              className="text-xs text-[#9ca3af] hover:text-white px-3 py-1.5 rounded-lg border border-[#2a2a4e] transition-colors"
            >
              📊 Pipeline
            </Link>
            <Link
              href="/admin/settings/priority-weights"
              className="text-xs text-[#9ca3af] hover:text-white px-3 py-1.5 rounded-lg border border-[#2a2a4e] transition-colors"
            >
              ⚖️ Weights
            </Link>
            <Link
              href="/admin/settings/effort-ranges"
              className="text-xs text-[#9ca3af] hover:text-white px-3 py-1.5 rounded-lg border border-[#2a2a4e] transition-colors"
            >
              ⏱️ Effort
            </Link>
            <Link
              href="/admin/settings/rates"
              className="text-xs text-[#9ca3af] hover:text-white px-3 py-1.5 rounded-lg border border-[#2a2a4e] transition-colors"
            >
              💵 Rates
            </Link>
            <Link
              href="/admin/audit-log"
              className="text-xs text-white bg-[#6366f1] px-3 py-1.5 rounded-lg font-semibold transition-colors"
            >
              📜 Audit Log
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <label className="text-xs text-[#9ca3af] whitespace-nowrap">Action Type:</label>
            <select
              value={selectedActionType}
              onChange={(e) => {
                setSelectedActionType(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#0f0f1e] border border-[#1e1e3a] rounded-xl px-3 py-2 text-xs text-[#e0e0e0] focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
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
            <label className="text-xs text-[#9ca3af] whitespace-nowrap">Entity Type:</label>
            <select
              value={selectedEntityType}
              onChange={(e) => {
                setSelectedEntityType(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#0f0f1e] border border-[#1e1e3a] rounded-xl px-3 py-2 text-xs text-[#e0e0e0] focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
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
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#9ca3af] text-sm">Loading audit logs…</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-sm text-center my-8">
            {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center bg-[#0f0f1e] rounded-2xl border border-[#1e1e3a] text-[#9ca3af] text-sm">
            No audit log entries match the selected filters.
          </div>
        ) : (
          <div className="bg-[#0f0f1e] border border-[#1e1e3a] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#e0e0e0]">
                <thead className="bg-[#1a1a2e] text-[#9ca3af] uppercase text-[10px] tracking-wider border-b border-[#1e1e3a]">
                  <tr>
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Actor</th>
                    <th className="px-6 py-4">Action Type</th>
                    <th className="px-6 py-4">Entity Type</th>
                    <th className="px-6 py-4">Entity ID</th>
                    <th className="px-6 py-4 text-right">State Diff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e1e3a]">
                  {logs.map((log) => {
                    const dateFormatted = new Date(log.timestamp).toLocaleString();
                    const isExpanded = expandedId === log._id;
                    const hasDiff = !!log.beforeState || !!log.afterState;

                    return (
                      <React.Fragment key={log._id}>
                        <tr className="hover:bg-[#131326] transition-colors">
                          <td className="px-6 py-4 font-mono text-[11px] text-[#9ca3af] whitespace-nowrap">
                            {dateFormatted}
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-white">
                              {log.actorId?.name || 'System / Unregistered'}
                            </p>
                            <p className="text-[#6b7280] text-[11px]">
                              {log.actorId?.email || '-'}
                            </p>
                          </td>
                          <td className="px-6 py-4 font-mono text-[#818cf8]">
                            <span className="px-2 py-0.5 rounded bg-[#6366f1]/10 border border-[#6366f1]/20">
                              {log.actionType}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-white font-medium">{log.entityType}</td>
                          <td className="px-6 py-4 font-mono text-[11px] text-[#9ca3af]">
                            {log.entityId}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {hasDiff ? (
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : log._id)}
                                className="px-3 py-1 rounded bg-[#1a1a2e] border border-[#2a2a4e] hover:border-[#6366f1] text-[#9ca3af] hover:text-white text-xs transition-colors"
                              >
                                {isExpanded ? 'Hide Diff ▲' : 'View Diff ▼'}
                              </button>
                            ) : (
                              <span className="text-[#4b5563] text-xs">No Diff</span>
                            )}
                          </td>
                        </tr>

                        {/* Expanded State Diff Drawer */}
                        {isExpanded && (
                          <tr className="bg-[#0a0a14]">
                            <td colSpan={6} className="px-6 py-4 border-t border-[#1e1e3a]">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                                <div>
                                  <p className="text-amber-400 font-bold mb-1 uppercase tracking-wider text-[10px]">
                                    Before State
                                  </p>
                                  <pre className="p-3 bg-[#0f0f1e] border border-[#1e1e3a] rounded-xl text-[#9ca3af] overflow-x-auto max-h-48">
                                    {log.beforeState
                                      ? JSON.stringify(log.beforeState, null, 2)
                                      : 'null'}
                                  </pre>
                                </div>
                                <div>
                                  <p className="text-emerald-400 font-bold mb-1 uppercase tracking-wider text-[10px]">
                                    After State
                                  </p>
                                  <pre className="p-3 bg-[#0f0f1e] border border-[#1e1e3a] rounded-xl text-[#9ca3af] overflow-x-auto max-h-48">
                                    {log.afterState
                                      ? JSON.stringify(log.afterState, null, 2)
                                      : 'null'}
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

            {/* Pagination controls */}
            <div className="px-6 py-4 bg-[#1a1a2e] border-t border-[#1e1e3a] flex items-center justify-between text-xs text-[#9ca3af]">
              <span>
                Page {currentPage} of {totalPages} ({totalLogs} Total Events)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="px-3 py-1.5 rounded-lg bg-[#0f0f1e] border border-[#2a2a4e] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#6366f1] transition-colors"
                >
                  ← Previous
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="px-3 py-1.5 rounded-lg bg-[#0f0f1e] border border-[#2a2a4e] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#6366f1] transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React from 'react';
