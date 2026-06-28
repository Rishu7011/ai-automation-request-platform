'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  draft: { label: 'Draft', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  submitted: { label: 'Submitted', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  in_review: { label: 'In Review', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  information_requested: { label: 'Info Needed', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  roi_calculated: { label: 'ROI Evaluated', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
  engineering_review: { label: 'Eng Review', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  approved: { label: 'Approved', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  rejected: { label: 'Rejected', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  planned: { label: 'Planned', color: 'bg-teal-500/10 text-teal-400 border-teal-500/30' },
  in_development: { label: 'In Development', color: 'bg-blue-600/10 text-blue-400 border-blue-600/30' },
  testing: { label: 'Testing', color: 'bg-violet-500/10 text-violet-400 border-violet-500/30' },
  completed: { label: 'Completed', color: 'bg-green-500/10 text-green-400 border-green-500/30' },
  archived: { label: 'Archived', color: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
};

const DEPARTMENT_ICONS: Record<string, string> = {
  Recruitment: '🤝',
  HR: '🧑‍💼',
  Finance: '💵',
  Compliance: '⚖️',
  IT: '💻',
  Operations: '⚙️',
  Engineering: '🔧',
  Legal: '📜',
  Sales: '📈',
  Marketing: '🎯',
};

export default function MyRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchRequests() {
      try {
        const res = await fetch('/api/requests');
        if (!res.ok) {
          throw new Error('Failed to load requests');
        }
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

  return (
    <div className="min-h-screen bg-[#0a0a12] text-[#e0e0e0]">
      {/* Top Navigation Bar */}
      <div className="border-b border-[#1e1e3a] bg-[#0f0f1e]/80 backdrop-blur-md px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white tracking-tight">My Automation Requests</h1>
            <span className="bg-[#1a1a2e] text-[#6366f1] border border-[#2a2a4e] text-xs px-2.5 py-0.5 rounded-full font-medium">
              {requests.length} Total
            </span>
          </div>
          <button
            onClick={() => router.push('/intake/new')}
            className="
              px-4 py-2 rounded-xl font-semibold text-sm
              bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]
              hover:from-[#5558e0] hover:to-[#7c4fdb]
              text-white shadow-lg shadow-[#6366f1]/20 transition-all duration-200
              flex items-center gap-2
            "
          >
            <span>+</span> New Request
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#9ca3af] text-sm">Loading your requests…</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-sm text-center my-8">
            {error}
          </div>
        ) : requests.length === 0 ? (
          /* Empty state */
          <div className="max-w-md mx-auto py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#1a1a2e] border border-[#2a2a4e] flex items-center justify-center text-3xl mx-auto mb-6 shadow-inner">
              📋
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No requests yet</h2>
            <p className="text-[#9ca3af] text-sm mb-8 leading-relaxed">
              Submit your first automation idea and our AI agent will guide you step-by-step to capture requirement details.
            </p>
            <button
              onClick={() => router.push('/intake/new')}
              className="
                inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm
                bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]
                hover:from-[#5558e0] hover:to-[#7c4fdb]
                text-white shadow-xl shadow-[#6366f1]/30 transition-all duration-200
              "
            >
              🚀 Submit an Automation Request
            </button>
          </div>
        ) : (
          /* List of requests */
          <div className="space-y-4">
            {requests.map((req) => {
              const badge = STATUS_BADGES[req.status] || {
                label: req.status,
                color: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
              };
              const icon = DEPARTMENT_ICONS[req.department] || '💼';
              const updatedDate = new Date(req.updatedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={req._id}
                  className="
                    p-5 rounded-2xl bg-[#0f0f1e] border border-[#1e1e3a]
                    hover:border-[#6366f1]/50 hover:bg-[#131326] transition-all duration-200
                    flex flex-col md:flex-row md:items-center justify-between gap-4 group
                  "
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#1a1a2e] border border-[#2a2a4e] flex items-center justify-center text-2xl flex-shrink-0 group-hover:border-[#6366f1]/40 transition-colors">
                      {icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap mb-1">
                        <h3 className="text-base font-semibold text-white group-hover:text-[#818cf8] transition-colors">
                          {req.title}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#9ca3af]">
                        <span>{req.department}</span>
                        <span>•</span>
                        <span>Updated {updatedDate}</span>
                        {req.priorityScore > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-[#6366f1] font-medium">
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
                      className="
                        px-4 py-2 rounded-xl text-xs font-semibold
                        bg-[#1a1a2e] border border-[#2a2a4e] text-[#e0e0e0]
                        hover:bg-[#6366f1] hover:border-[#6366f1] hover:text-white
                        transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap
                      "
                    >
                      {req.status === 'draft' ? (
                        <>✏️ Resume Interview →</>
                      ) : (
                        <>👁️ View Request →</>
                      )}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
