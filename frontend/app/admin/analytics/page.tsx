'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AnalyticsSummary } from '@/lib/analytics';
import {
  Clock,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Loader2,
} from 'lucide-react';

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch('/api/admin/analytics');
        if (!res.ok) {
          throw new Error(res.status === 403 ? 'Admin access required' : 'Failed to load analytics');
        }
        const body = await res.json();
        setData(body.analytics);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading analytics');
      } finally {
        setIsLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-[#6366f1] animate-spin mx-auto" />
          <p className="text-[#6b7280] text-sm font-medium">Loading enterprise analytics…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center p-8">
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-center max-w-md space-y-3">
          <p className="font-bold text-base">{error || 'Analytics unavailable'}</p>
          <Link href="/admin/requests" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#818cf8] hover:underline">
            ← Return to Pipeline
          </Link>
        </div>
      </div>
    );
  }

  const { overview, departmentBreakdown, statusDistribution } = data;
  const maxDeptCount = Math.max(...departmentBreakdown.map((d) => d.count), 1);

  return (
    <div className="min-h-screen bg-[#0a0a12] text-[#e0e0e0] font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Enterprise Automation Performance</h1>
            <p className="text-sm text-[#9ca3af] mt-1">
              ROI metrics, department velocity, and request approval rollups. eng_admin / sys_admin only.
            </p>
          </div>
          <Link
            href="/admin/requests"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5558e0] hover:to-[#7c4fdb] text-white font-bold text-xs transition-all shadow-md shadow-[#6366f1]/20 flex items-center gap-2 w-fit"
          >
            <span>View Backlog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Confidence Exclusion Alert */}
        {overview.excludedLowConfidenceCount > 0 && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-300">Confidence Exclusion Notice</p>
                <p className="text-xs text-amber-300/80 leading-relaxed">
                  {overview.excludedLowConfidenceCount} unreviewed low-confidence estimates excluded from monetary ROI totals.
                </p>
              </div>
            </div>
            <Link
              href="/admin/requests"
              className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold transition-all border border-amber-500/30 shrink-0 self-start sm:self-auto"
            >
              Review Low Confidence →
            </Link>
          </div>
        )}

        {/* Overview Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#0f0f1e] border border-[#1e1e3a] flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-[#6366f1]/10 border border-[#6366f1]/20 flex items-center justify-center text-[#818cf8] shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">Total Requests</p>
              <p className="text-2xl font-bold text-white mt-0.5">{overview.totalRequests}</p>
              <p className="text-[11px] text-[#4b5563] font-medium">{overview.submittedCount} active</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0f0f1e] border border-[#1e1e3a] flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">Annual $ Saved</p>
              <p className="text-2xl font-bold text-emerald-400 mt-0.5">
                ${overview.totalAnnualDollarsSaved.toLocaleString()}
              </p>
              <p className="text-[11px] text-[#4b5563] font-medium">High-confidence only</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0f0f1e] border border-[#1e1e3a] flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">Hours Saved / yr</p>
              <p className="text-2xl font-bold text-white mt-0.5">{overview.totalAnnualHoursSaved.toLocaleString()}</p>
              <p className="text-[11px] text-[#4b5563] font-medium">Automated capacity</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0f0f1e] border border-[#1e1e3a] flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">Approval Rate</p>
              <p className="text-2xl font-bold text-white mt-0.5">{overview.approvalRate}%</p>
              <p className="text-[11px] text-[#4b5563] font-medium">
                {overview.approvedCount} approved · {overview.rejectedCount} rejected
              </p>
            </div>
          </div>
        </div>

        {/* Department Breakdown & Status Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Volume Bar Chart */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0f0f1e] border border-[#1e1e3a] space-y-6">
            <div>
              <h2 className="text-base font-bold text-white">Department Request Volume & Approvals</h2>
              <p className="text-xs text-[#6b7280] mt-0.5">Breakdown of automation requests by department</p>
            </div>

            <div className="space-y-5">
              {departmentBreakdown.length === 0 ? (
                <p className="text-xs text-[#4b5563] italic py-8 text-center">No department request data yet.</p>
              ) : (
                departmentBreakdown.map((dept) => {
                  const percent = Math.round((dept.count / maxDeptCount) * 100);
                  return (
                    <div key={dept.department} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{dept.department}</span>
                        <span className="text-[#6b7280] font-medium">
                          {dept.count} total ·{' '}
                          <span className="text-emerald-400 font-bold">{dept.approvedCount} approved</span>
                        </span>
                      </div>
                      <div className="w-full h-3 bg-[#1a1a2e] rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] h-full transition-all duration-500 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Status Distribution */}
          <div className="p-6 rounded-2xl bg-[#0f0f1e] border border-[#1e1e3a] space-y-5">
            <div>
              <h2 className="text-base font-bold text-white">Pipeline Status Distribution</h2>
              <p className="text-xs text-[#6b7280] mt-0.5">Current state of all active requests</p>
            </div>

            <div className="space-y-2">
              {statusDistribution.map((st) => (
                <div key={st.status} className="flex items-center justify-between p-3 rounded-xl bg-[#1a1a2e] border border-[#2a2a4e]">
                  <span className="text-xs font-bold text-[#d1d5db] capitalize">{st.status.replace(/_/g, ' ')}</span>
                  <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-[#6366f1]/15 text-[#818cf8] border border-[#6366f1]/25">
                    {st.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
