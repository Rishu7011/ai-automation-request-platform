'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { INTAKE_STAGES } from '@/constants';

interface ConversationTurn {
  _id: string;
  stage: number;
  sender: 'user' | 'ai';
  agentName?: string;
  message: string;
  timestamp: string;
}

interface RequestDetail {
  _id: string;
  title: string;
  department: string;
  status: string;
  priorityScore: number;
  createdAt: string;
  updatedAt: string;
  activityLog?: Array<{
    action: string;
    timestamp: string;
  }>;
}

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  submitted: { label: 'Submitted', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  in_review: { label: 'In Review', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  approved: { label: 'Approved', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  rejected: { label: 'Rejected', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  completed: { label: 'Completed', color: 'bg-green-500/10 text-green-400 border-green-500/30' },
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

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: requestId } = use(params);
  const router = useRouter();

  const [requestInfo, setRequestInfo] = useState<RequestDetail | null>(null);
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [activeStageFilter, setActiveStageFilter] = useState<number | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/intake/chat?requestId=${requestId}`);
        if (!res.ok) {
          throw new Error('Failed to load request details');
        }
        const data = await res.json();
        setRequestInfo({
          _id: requestId,
          title: data.title,
          department: data.department,
          status: data.status,
          priorityScore: data.priorityScore || 0,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
        setTurns(data.turns || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading details');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [requestId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#9ca3af] text-sm">Loading request details…</p>
        </div>
      </div>
    );
  }

  if (error || !requestInfo) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center p-6">
        <div className="text-center max-w-sm bg-[#0f0f1e] p-6 rounded-2xl border border-[#1e1e3a]">
          <p className="text-red-400 text-sm mb-4">{error || 'Request not found'}</p>
          <button
            onClick={() => router.push('/my-requests')}
            className="px-4 py-2 bg-[#6366f1] hover:bg-[#5558e0] text-white text-xs font-semibold rounded-xl"
          >
            ← Return to My Requests
          </button>
        </div>
      </div>
    );
  }

  const badge = STATUS_BADGES[requestInfo.status] || {
    label: requestInfo.status,
    color: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  };
  const icon = DEPARTMENT_ICONS[requestInfo.department] || '💼';

  const filteredTurns =
    activeStageFilter === 'all'
      ? turns
      : turns.filter((t) => t.stage === activeStageFilter);

  // Group turns by stage for 'all' view
  const stagesRepresented = Array.from(new Set(turns.map((t) => t.stage))).sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-[#0a0a12] text-[#e0e0e0]">
      {/* Header */}
      <div className="border-b border-[#1e1e3a] bg-[#0f0f1e]/80 backdrop-blur-md px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-[#6b7280] hover:text-[#e0e0e0] transition-colors text-sm"
            >
              ← Back
            </button>
            <span className="text-[#2a2a4e]">|</span>
            <div className="flex items-center gap-2">
              <span className="text-xl">{icon}</span>
              <h1 className="text-lg font-bold text-white truncate max-w-md">
                {requestInfo.title}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.color}`}>
                {badge.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {requestInfo.status === 'draft' && (
              <Link
                href={`/intake/${requestId}`}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white text-xs font-semibold shadow-lg shadow-[#6366f1]/20"
              >
                ✏️ Continue Interview
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Summary Card */}
        <div className="p-6 rounded-2xl bg-[#0f0f1e] border border-[#1e1e3a] mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#6366f1] mb-4">
            Request Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-[#6b7280] text-xs">Department</p>
              <p className="text-white font-medium mt-0.5">
                {icon} {requestInfo.department}
              </p>
            </div>
            <div>
              <p className="text-[#6b7280] text-xs">Status</p>
              <p className="text-white font-medium mt-0.5 capitalize">
                {requestInfo.status.replace(/_/g, ' ')}
              </p>
            </div>
            <div>
              <p className="text-[#6b7280] text-xs">Priority Score</p>
              <p className="text-[#818cf8] font-semibold mt-0.5">
                {requestInfo.priorityScore > 0 ? requestInfo.priorityScore.toFixed(1) : 'Pending Evaluation'}
              </p>
            </div>
            <div>
              <p className="text-[#6b7280] text-xs">Total Turns</p>
              <p className="text-white font-medium mt-0.5">{turns.length} Exchanges</p>
            </div>
          </div>
        </div>

        {/* Stage Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveStageFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeStageFilter === 'all'
                ? 'bg-[#6366f1] text-white'
                : 'bg-[#1a1a2e] text-[#9ca3af] hover:text-white border border-[#2a2a4e]'
            }`}
          >
            All Stages ({turns.length})
          </button>
          {INTAKE_STAGES.map((stg) => {
            const turnCount = turns.filter((t) => t.stage === stg.id).length;
            if (turnCount === 0) return null;
            return (
              <button
                key={stg.id}
                onClick={() => setActiveStageFilter(stg.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeStageFilter === stg.id
                    ? 'bg-[#6366f1] text-white'
                    : 'bg-[#1a1a2e] text-[#9ca3af] hover:text-white border border-[#2a2a4e]'
                }`}
              >
                {stg.icon} {stg.name} ({turnCount})
              </button>
            );
          })}
        </div>

        {/* Conversation Transcript */}
        <div className="space-y-6">
          {filteredTurns.length === 0 ? (
            <div className="p-8 text-center bg-[#0f0f1e] rounded-2xl border border-[#1e1e3a] text-[#6b7280] text-sm">
              No messages recorded for this section.
            </div>
          ) : (
            stagesRepresented
              .filter((stgId) => activeStageFilter === 'all' || activeStageFilter === stgId)
              .map((stgId) => {
                const stageObj = INTAKE_STAGES.find((s) => s.id === stgId);
                const stageTurns = filteredTurns.filter((t) => t.stage === stgId);

                return (
                  <div key={stgId} className="bg-[#0f0f1e] border border-[#1e1e3a] rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1e1e3a]">
                      <span className="text-lg">{stageObj?.icon || '💬'}</span>
                      <h3 className="text-sm font-semibold text-white">
                        Stage {stgId}: {stageObj?.name || `Stage ${stgId}`}
                      </h3>
                      <span className="text-xs text-[#6b7280] ml-auto">
                        {stageTurns.length} messages
                      </span>
                    </div>

                    <div className="space-y-4">
                      {stageTurns.map((turn) => {
                        const isUser = turn.sender === 'user';
                        return (
                          <div
                            key={turn._id}
                            className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                          >
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                                isUser
                                  ? 'bg-[#6366f1] text-white'
                                  : 'bg-[#1a1a2e] border border-[#2a2a4e] text-[#9ca3af]'
                              }`}
                            >
                              {isUser ? '👤' : '🤖'}
                            </div>

                            <div
                              className={`max-w-[80%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                                isUser
                                  ? 'bg-[#6366f1] text-white rounded-tr-sm'
                                  : 'bg-[#1a1a2e] border border-[#2a2a4e] text-[#d1d5db] rounded-tl-sm'
                              }`}
                            >
                              {turn.message}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}
