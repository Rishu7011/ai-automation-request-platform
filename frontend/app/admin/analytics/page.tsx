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
        <div className="text-center">
          <Loader2 className="w-10 h-10 border-2 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading enterprise analytics…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a12] p-8 flex items-center justify-center">
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-center max-w-md">
          <p className="font-semibold text-sm mb-2">{error || 'Analytics unavailable'}</p>
          <Link href="/admin/requests" className="text-xs text-indigo-400 underline">
            ← Return to Pipeline
          </Link>
        </div>
      </div>
    );
  }

  const { overview, departmentBreakdown, statusDistribution } = data;
  const maxDeptCount = Math.max(...departmentBreakdown.map((d) => d.count), 1);

  return (
    <div className="min-h-screen bg-[#0a0a12] text-[#e0e0e0] p-6 sm:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e1e3a] pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              Admin Analytics
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Enterprise Automation Performance</h1>
          <p className="text-xs text-gray-400">ROI metrics, department velocity, and request approval rollups</p>
        </div>

        <Link
          href="/admin/requests"
          className="px-4 py-2 rounded-xl bg-[#16162a] border border-[#2a2a4e] hover:border-indigo-500/40 text-xs font-semibold text-white transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <span>View Pipeline</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Task 9.3 Exclusion Alert Banner */}
      {overview.excludedLowConfidenceCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-300">Confidence Exclusion Notice (Task 9.3)</p>
              <p className="text-xs text-gray-300">
                {overview.excludedLowConfidenceCount} unreviewed low-confidence request estimate(s) are excluded from total monetary ROI metrics to preserve financial accuracy.
              </p>
            </div>
          </div>

          <Link
            href="/admin/requests"
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold transition-colors border border-amber-500/30 shrink-0"
          >
            Review Low Confidence →
          </Link>
        </div>
      )}

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Requests */}
        <div className="p-5 rounded-2xl bg-[#0f0f1e] border border-[#1e1e3a] space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Requests</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">{overview.totalRequests}</p>
          <p className="text-[11px] text-gray-500">{overview.submittedCount} active in pipeline</p>
        </div>

        {/* Total Annual Dollars Saved */}
        <div className="p-5 rounded-2xl bg-[#0f0f1e] border border-[#1e1e3a] space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Annual $ Saved</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-400">
            ${overview.totalAnnualDollarsSaved.toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-500/80">Confirmed / High-Medium confidence</p>
        </div>

        {/* Total Annual Hours Saved */}
        <div className="p-5 rounded-2xl bg-[#0f0f1e] border border-[#1e1e3a] space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Hours Saved / Year</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">
            {overview.totalAnnualHoursSaved.toLocaleString()} hrs
          </p>
          <p className="text-[11px] text-gray-500">Automated capacity gain</p>
        </div>

        {/* Approval Rate */}
        <div className="p-5 rounded-2xl bg-[#0f0f1e] border border-[#1e1e3a] space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Approval Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">{overview.approvalRate}%</p>
          <p className="text-[11px] text-gray-500">
            {overview.approvedCount} approved · {overview.rejectedCount} rejected
          </p>
        </div>
      </div>

      {/* Department Breakdown & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Volume Bar Chart (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0f0f1e] border border-[#1e1e3a] space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-white">Department Request Volume & Approvals</h2>
            <p className="text-xs text-gray-400">Breakdown of automation requests by business department</p>
          </div>

          <div className="space-y-4">
            {departmentBreakdown.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-8 text-center">No department request data yet.</p>
            ) : (
              departmentBreakdown.map((dept) => {
                const percent = Math.round((dept.count / maxDeptCount) * 100);
                return (
                  <div key={dept.department} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{dept.department}</span>
                      <span className="text-gray-400">
                        {dept.count} total · <span className="text-emerald-400">{dept.approvedCount} approved</span>
                      </span>
                    </div>

                    <div className="w-full h-3 bg-[#16162a] rounded-full overflow-hidden flex">
                      <div
                        className="bg-indigo-500 h-full transition-all duration-500 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Status Distribution (1 col) */}
        <div className="p-6 rounded-2xl bg-[#0f0f1e] border border-[#1e1e3a] space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-white">Pipeline Status Distribution</h2>
            <p className="text-xs text-gray-400">Current state of all active requests</p>
          </div>

          <div className="space-y-3">
            {statusDistribution.map((st) => (
              <div key={st.status} className="flex items-center justify-between p-3 rounded-xl bg-[#141426] border border-[#2a2a4e]">
                <span className="text-xs font-semibold text-gray-200 capitalize">{st.status.replace(/_/g, ' ')}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  {st.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
