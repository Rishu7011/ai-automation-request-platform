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
  draft:              { label: 'Draft',         color: 'bg-[#ffb95f]/15 text-[#ffb95f] border-[#ffb95f]/30' },
  ai_reviewing:       { label: 'AI Reviewing',  color: 'bg-[#8083ff]/15 text-[#c0c1ff] border-[#8083ff]/30' },
  submitted:          { label: 'Submitted',     color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  needs_more_info:    { label: 'Info Needed',   color: 'bg-[#ffb95f]/15 text-[#ffb95f] border-[#ffb95f]/30' },
  engineering_review: { label: 'Eng Review',   color: 'bg-[#6366f1]/15 text-[#c0c1ff] border-[#6366f1]/30' },
  approved:           { label: 'Approved',      color: 'bg-[#00a572]/15 text-[#4edea3] border-[#00a572]/30' },
  rejected:           { label: 'Rejected',      color: 'bg-[#93000a]/20 text-[#ffb4ab] border-[#ffb4ab]/30' },
  planned:            { label: 'Planned',       color: 'bg-[#00a572]/15 text-[#4edea3] border-[#00a572]/30' },
  in_development:     { label: 'In Dev',        color: 'bg-[#6366f1]/20 text-[#c0c1ff] border-[#6366f1]/30' },
  testing:            { label: 'Testing',       color: 'bg-[#8083ff]/15 text-[#c0c1ff] border-[#8083ff]/30' },
  completed:          { label: 'Completed',     color: 'bg-[#00a572]/20 text-[#4edea3] border-[#00a572]/40' },
  archived:           { label: 'Archived',      color: 'bg-[#34343d]/40 text-[#908fa0] border-[#464554]/30' },
};

const DEPARTMENT_ICONS: Record<string, string> = {
  Recruitment: '🤝', HR: '🧑‍💼', Finance: '💵', Compliance: '⚖️',
  IT: '💻', Operations: '⚙️', Engineering: '🔧', Legal: '📜',
  Sales: '📈', Marketing: '🎯',
};

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: requestId } = use(params);
  const router = useRouter();

  interface AttachmentItem {
    _id: string;
    originalName: string;
    filePath: string;
    fileSize: number;
    stage: number;
    createdAt: string;
  }

  const [requestInfo, setRequestInfo] = useState<RequestDetail | null>(null);
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [activeStageFilter, setActiveStageFilter] = useState<number | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [chatRes, attachRes] = await Promise.all([
          fetch(`/api/intake/chat?requestId=${requestId}`),
          fetch(`/api/requests/${requestId}/attachments`),
        ]);

        if (!chatRes.ok) throw new Error('Failed to load request details');
        const data = await chatRes.json();
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

        if (attachRes.ok) {
          const attData = await attachRes.json();
          setAttachments(attData.attachments || []);
        }
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
      <div className="min-h-screen bg-[#13131b] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[#908fa0] text-sm font-medium">Loading request details…</p>
        </div>
      </div>
    );
  }

  if (error || !requestInfo) {
    return (
      <div className="min-h-screen bg-[#13131b] flex items-center justify-center p-6">
        <div className="text-center max-w-sm glass-panel border border-[#464554]/30 p-6 rounded-2xl space-y-4">
          <p className="text-[#ffb4ab] text-sm font-medium">{error || 'Request not found'}</p>
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
    color: 'bg-[#34343d]/40 text-[#908fa0] border-[#464554]/30',
  };
  const icon = DEPARTMENT_ICONS[requestInfo.department] || '💼';

  const filteredTurns = activeStageFilter === 'all'
    ? turns
    : turns.filter((t) => t.stage === activeStageFilter);

  const stagesRepresented = Array.from(new Set(turns.map((t) => t.stage))).sort((a, b) => a - b);
  const maxCompletedStage = turns.length > 0 ? Math.max(...turns.map((t) => t.stage)) : 1;

  return (
    <div className="min-h-screen bg-[#13131b] text-[#e4e1ed] font-inter">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#464554]/30 pb-6">
          <div className="flex items-start gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl bg-[#1f1f27] border border-[#464554]/40 text-[#908fa0] hover:text-white transition-colors cursor-pointer mt-0.5 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1">
                <span className="text-2xl">{icon}</span>
                <h1 className="text-xl sm:text-2xl font-bold font-outfit text-white tracking-tight">
                  {requestInfo.title}
                </h1>
                <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${badge.color}`}>
                  {badge.label}
                </span>
              </div>
              <p className="text-xs text-[#908fa0] font-medium ml-9">
                {requestInfo.department} Department · {turns.length} conversation exchanges
              </p>
            </div>
          </div>

          {requestInfo.status === 'draft' && (
            <Link
              href={`/intake/${requestId}`}
              className="shrink-0 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-[#8083ff] hover:brightness-110 text-white text-xs font-bold transition-all shadow-md shadow-[#6366f1]/30 flex items-center gap-1.5 cursor-pointer w-fit"
            >
              <Edit3 className="h-4 w-4" /> Resume Intake
            </Link>
          )}
        </div>

        {/* Stepper Lifecycle Pipeline */}
        <div className="glass-panel p-5 rounded-xl border border-[#464554]/30 space-y-3">
          <p className="text-[10px] font-bold font-outfit uppercase tracking-widest text-[#908fa0]">AI Requirements Pipeline</p>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {INTAKE_STAGES.map((stg) => {
              const isDone = stg.id <= maxCompletedStage;
              const isCurrent = stg.id === maxCompletedStage;

              return (
                <div
                  key={stg.id}
                  onClick={() => setActiveStageFilter(stg.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg cursor-pointer transition-all ${
                    activeStageFilter === stg.id
                      ? 'bg-[#6366f1]/20 border border-[#6366f1]/50'
                      : 'hover:bg-[#34343d]/30'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isDone
                        ? 'bg-[#00a572] text-white shadow-sm'
                        : isCurrent
                        ? 'bg-[#6366f1] text-white animate-pulse'
                        : 'bg-[#1f1f27] border border-[#464554]/40 text-[#908fa0]'
                    }`}
                  >
                    {isDone ? '✓' : stg.id}
                  </div>
                  <span className={`text-[10px] font-medium text-center truncate max-w-full ${isDone ? 'text-[#4edea3]' : 'text-[#908fa0]'}`}>
                    {stg.name.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Department', value: `${icon} ${requestInfo.department}` },
            { label: 'Status', value: requestInfo.status.replace(/_/g, ' ') },
            { label: 'Priority Score', value: requestInfo.priorityScore > 0 ? `${requestInfo.priorityScore.toFixed(0)} / 100` : 'Pending', highlight: requestInfo.priorityScore > 0 },
            { label: 'Attachments', value: `${attachments.length} Files` },
          ].map(({ label, value, highlight }) => (
            <div key={label} className="p-4 rounded-xl glass-panel border border-[#464554]/30 space-y-1">
              <p className="text-[10px] font-bold font-outfit uppercase tracking-wider text-[#908fa0]">{label}</p>
              <p className={`text-sm font-bold capitalize ${highlight ? 'text-[#4edea3] font-mono-code' : 'text-white'}`}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Uploaded Documentation & Attachments Section */}
        {attachments.length > 0 && (
          <div className="p-5 glass-panel border border-[#464554]/30 rounded-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#c0c1ff] font-outfit">
              📎 Attached Files & Documentation ({attachments.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {attachments.map((att) => (
                <div
                  key={att._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#0d0d15] border border-[#464554]/30"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-xs font-bold text-white truncate">{att.originalName}</p>
                    <p className="text-[10px] text-[#908fa0] font-mono-code">
                      {(att.fileSize / 1024).toFixed(1)} KB · Stage {att.stage ?? 1}
                    </p>
                  </div>
                  <a
                    href={att.filePath}
                    download={att.originalName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#6366f1]/15 hover:bg-[#6366f1] text-[#c0c1ff] hover:text-white text-xs font-bold transition-colors border border-[#6366f1]/30 shrink-0 cursor-pointer"
                  >
                    ⬇ Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stage filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setActiveStageFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeStageFilter === 'all'
                ? 'bg-[#6366f1] text-white shadow-sm'
                : 'glass-panel text-[#908fa0] hover:text-white border border-[#464554]/30'
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
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  activeStageFilter === stg.id
                    ? 'bg-[#6366f1] text-white shadow-sm'
                    : 'glass-panel text-[#908fa0] hover:text-white border border-[#464554]/30'
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
            <div className="p-8 text-center glass-panel rounded-xl border border-[#464554]/30 text-[#908fa0] text-xs font-medium">
              No conversation records for this section.
            </div>
          ) : (
            stagesRepresented
              .filter((stgId) => activeStageFilter === 'all' || activeStageFilter === stgId)
              .map((stgId) => {
                const stageObj = INTAKE_STAGES.find((s) => s.id === stgId);
                const stageTurns = filteredTurns.filter((t) => t.stage === stgId);
                return (
                  <div key={stgId} className="glass-panel border border-[#464554]/30 rounded-xl p-5 space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-[#464554]/20">
                      <span className="text-lg">{stageObj?.icon || '💬'}</span>
                      <h3 className="text-sm font-bold font-outfit text-white">
                        Stage {stgId}: {stageObj?.name || `Stage ${stgId}`}
                      </h3>
                      <span className="text-xs text-[#908fa0] font-mono-code ml-auto">
                        {stageTurns.length} exchanges
                      </span>
                    </div>

                    <div className="space-y-4">
                      {stageTurns.map((turn) => {
                        const isUser = turn.sender === 'user';
                        return (
                          <div key={turn._id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              isUser ? 'bg-[#6366f1] text-white' : 'bg-[#1f1f27] text-[#c0c1ff] border border-[#464554]/40'
                            }`}>
                              {isUser ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                            </div>
                            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                              isUser
                                ? 'bg-gradient-to-r from-indigo-600 to-[#8083ff] text-white'
                                : 'bg-[#1f1f27] border border-[#464554]/40 text-[#e4e1ed]'
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
      </main>
    </div>
  );
}

