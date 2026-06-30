'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { INTAKE_STAGES } from '@/constants';
import { ArrowLeft, Bot, User as UserIcon, Edit3 } from 'lucide-react';

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
}

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  draft:              { label: 'Draft',         color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  ai_reviewing:       { label: 'AI Reviewing',  color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  submitted:          { label: 'Submitted',     color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  needs_more_info:    { label: 'Info Needed',   color: 'bg-orange-500/15 text-orange-300 border-orange-500/30' },
  engineering_review: { label: 'Eng Review',   color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
  approved:           { label: 'Approved',      color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  rejected:           { label: 'Rejected',      color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  planned:            { label: 'Planned',       color: 'bg-teal-500/15 text-teal-300 border-teal-500/30' },
  in_development:     { label: 'In Dev',        color: 'bg-blue-600/20 text-blue-300 border-blue-500/30' },
  testing:            { label: 'Testing',       color: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
  completed:          { label: 'Completed',     color: 'bg-green-500/15 text-green-300 border-green-500/30' },
  archived:           { label: 'Archived',      color: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
};

const DEPARTMENT_ICONS: Record<string, string> = {
  Recruitment: '🤝', HR: '🧑‍💼', Finance: '💵', Compliance: '⚖️',
  IT: '💻', Operations: '⚙️', Engineering: '🔧', Legal: '📜',
  Sales: '📈', Marketing: '🎯',
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
        if (!res.ok) throw new Error('Failed to load request details');
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
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[#6b7280] text-sm font-medium">Loading request details…</p>
        </div>
      </div>
    );
  }

  if (error || !requestInfo) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center p-6">
        <div className="text-center max-w-sm bg-[#0f0f1e] border border-[#1e1e3a] p-6 rounded-2xl space-y-4">
          <p className="text-rose-400 text-sm font-medium">{error || 'Request not found'}</p>
          <button
            onClick={() => router.push('/my-requests')}
            className="px-4 py-2 bg-[#6366f1] hover:bg-[#5558e0] text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            ← Return to My Requests
          </button>
        </div>
      </div>
    );
  }

  const badge = STATUS_BADGES[requestInfo.status] || {
    label: requestInfo.status,
    color: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  };
  const icon = DEPARTMENT_ICONS[requestInfo.department] || '💼';

  const filteredTurns = activeStageFilter === 'all'
    ? turns
    : turns.filter((t) => t.stage === activeStageFilter);

  const stagesRepresented = Array.from(new Set(turns.map((t) => t.stage))).sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-[#0a0a12] text-[#e0e0e0] font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl bg-[#1a1a2e] border border-[#2a2a4e] text-[#9ca3af] hover:text-white transition-colors cursor-pointer mt-0.5 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xl">{icon}</span>
                <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  {requestInfo.title}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.color}`}>
                  {badge.label}
                </span>
              </div>
              <p className="text-xs text-[#6b7280] font-semibold ml-8">
                {requestInfo.department} Department · {turns.length} conversation turns
              </p>
            </div>
          </div>

          {requestInfo.status === 'draft' && (
            <Link
              href={`/intake/${requestId}`}
              className="shrink-0 px-4 py-2 rounded-xl bg-[#6366f1] hover:bg-[#5558e0] text-white text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Edit3 className="h-3.5 w-3.5" /> Resume
            </Link>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Department', value: `${icon} ${requestInfo.department}` },
            { label: 'Status', value: requestInfo.status.replace(/_/g, ' ') },
            { label: 'Priority Score', value: requestInfo.priorityScore > 0 ? `${requestInfo.priorityScore.toFixed(1)} / 100` : 'Pending', highlight: requestInfo.priorityScore > 0 },
            { label: 'Transcript Turns', value: `${turns.length} Exchanges` },
          ].map(({ label, value, highlight }) => (
            <div key={label} className="p-3.5 rounded-xl bg-[#0f0f1e] border border-[#1e1e3a]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">{label}</p>
              <p className={`text-sm font-bold mt-0.5 capitalize ${highlight ? 'text-[#818cf8]' : 'text-white'}`}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Stage filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setActiveStageFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeStageFilter === 'all'
                ? 'bg-[#6366f1] text-white shadow-sm'
                : 'bg-[#0f0f1e] text-[#9ca3af] hover:text-white border border-[#1e1e3a]'
            }`}
          >
            All Stages ({turns.length})
          </button>
          {INTAKE_STAGES.map((stg) => {
            const count = turns.filter((t) => t.stage === stg.id).length;
            if (count === 0) return null;
            return (
              <button
                key={stg.id}
                onClick={() => setActiveStageFilter(stg.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  activeStageFilter === stg.id
                    ? 'bg-[#6366f1] text-white shadow-sm'
                    : 'bg-[#0f0f1e] text-[#9ca3af] hover:text-white border border-[#1e1e3a]'
                }`}
              >
                {stg.icon} {stg.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Conversation transcript */}
        <div className="space-y-5">
          {filteredTurns.length === 0 ? (
            <div className="p-8 text-center bg-[#0f0f1e] rounded-2xl border border-[#1e1e3a] text-[#6b7280] text-xs font-medium">
              No conversation records for this section.
            </div>
          ) : (
            stagesRepresented
              .filter((stgId) => activeStageFilter === 'all' || activeStageFilter === stgId)
              .map((stgId) => {
                const stageObj = INTAKE_STAGES.find((s) => s.id === stgId);
                const stageTurns = filteredTurns.filter((t) => t.stage === stgId);
                return (
                  <div key={stgId} className="bg-[#0f0f1e] border border-[#1e1e3a] rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-[#1a1a2e]">
                      <span className="text-lg">{stageObj?.icon || '💬'}</span>
                      <h3 className="text-sm font-bold text-white">
                        Stage {stgId}: {stageObj?.name || `Stage ${stgId}`}
                      </h3>
                      <span className="text-xs text-[#4b5563] font-semibold ml-auto">
                        {stageTurns.length} exchanges
                      </span>
                    </div>

                    <div className="space-y-4">
                      {stageTurns.map((turn) => {
                        const isUser = turn.sender === 'user';
                        return (
                          <div key={turn._id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              isUser ? 'bg-[#6366f1] text-white' : 'bg-[#1a1a2e] text-[#818cf8] border border-[#2a2a4e]'
                            }`}>
                              {isUser ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                            </div>
                            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                              isUser
                                ? 'bg-[#6366f1] text-white'
                                : 'bg-[#1a1a2e] border border-[#2a2a4e] text-[#d1d5db]'
                            }`}>
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
