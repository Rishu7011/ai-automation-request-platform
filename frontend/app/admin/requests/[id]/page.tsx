'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { INTAKE_STAGES, REQUEST_STATUSES, RequestStatus } from '@/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Engineer {
  _id: string;
  name: string;
  username: string;
  department: string;
}

interface Comment {
  _id: string;
  content: string;
  authorId: { _id: string; name: string; username: string; department: string };
  createdAt: string;
  editedAt?: string;
}

interface PriorityInputs {
  strategicValue?: number;
  urgency?: number;
  orgImpact?: number;
  riskLevel?: number;
  urgencySignals?: string[];
  rationale?: string;
}

interface Estimate {
  annualHoursSaved: number;
  annualDollarsSaved: number;
  effortSize: 'S' | 'M' | 'L' | 'XL';
  buildCostEstimate: number;
  roiConfidence: string;
  effortConfidence: string;
  priorityScore: number;
  priorityInputs: PriorityInputs;
  requesterNarrative?: string;
  engineeringNarrative?: string;
  isOverridden: boolean;
  overriddenFields?: Record<string, { before: unknown; after: unknown }>;
}

interface Summary {
  processDescription?: string;
  painPoints?: string[];
  toolsUsed?: string[];
  risks?: string[];
  desiredOutcome?: string;
  hoursPerOccurrence?: number;
  frequencyPerYear?: number;
  peopleInvolved?: number;
}

interface RequestDetail {
  _id: string;
  title: string;
  department: string;
  status: string;
  priorityScore: number;
  roiConfidence: string;
  assignedTo?: { _id: string; name: string; username: string };
  tags?: string[];
  submittedAt?: string;
  statusHistory?: Array<{ oldStatus: string; newStatus: string; changedAt: string; reasonNote?: string }>;
  requesterId?: { _id: string; name: string; email: string; username: string };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', ai_reviewing: 'AI Reviewing', submitted: 'Submitted',
  needs_more_info: 'Needs More Info', engineering_review: 'Eng Review',
  approved: 'Approved', rejected: 'Rejected', planned: 'Planned',
  in_development: 'In Development', testing: 'Testing',
  completed: 'Completed', archived: 'Archived',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  submitted: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  ai_reviewing: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  needs_more_info: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  engineering_review: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  planned: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
  in_development: 'bg-blue-600/10 text-blue-300 border-blue-600/30',
  testing: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  completed: 'bg-green-500/10 text-green-400 border-green-500/30',
  archived: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
};

const REASON_REQUIRED: RequestStatus[] = ['rejected', 'needs_more_info'];

const CONFIDENCE_COLORS: Record<string, string> = {
  HIGH:   'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  MEDIUM: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  LOW:    'text-red-400 bg-red-400/10 border-red-400/30',
};

const DEPT_ICONS: Record<string, string> = {
  Recruitment: '🤝', HR: '🧑‍💼', Finance: '💵', Compliance: '⚖️',
  IT: '💻', Operations: '⚙️', Engineering: '🔧', Legal: '📜',
  Sales: '📈', Marketing: '🎯',
};

// ─── Score Gauge ─────────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const color = clamped >= 70 ? '#ef4444' : clamped >= 50 ? '#f97316' : clamped >= 30 ? '#eab308' : '#6b7280';
  const tierLabel = clamped >= 70 ? 'Critical' : clamped >= 50 ? 'High' : clamped >= 30 ? 'Medium' : 'Low';
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e1e3a" strokeWidth="3.5" />
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke={color} strokeWidth="3.5"
            strokeDasharray={`${clamped} ${100 - clamped}`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
          {clamped.toFixed(0)}
        </span>
      </div>
      <span className="text-xs font-medium" style={{ color }}>{tierLabel}</span>
    </div>
  );
}

// ─── Slider field ─────────────────────────────────────────────────────────────

function ScoreSlider({
  label, value, onChange, disabled,
}: { label: string; value: number; onChange: (v: number) => void; disabled: boolean }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-[#9ca3af] text-xs">{label}</label>
        <span className="text-white text-xs font-semibold">{value}/5</span>
      </div>
      <input
        type="range" min={1} max={5} step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        disabled={disabled}
        className="w-full accent-[#6366f1] cursor-pointer disabled:cursor-not-allowed"
      />
      <div className="flex justify-between text-[10px] text-[#4b5563] mt-0.5">
        <span>Low</span><span>High</span>
      </div>
    </div>
  );
}

// ─── Comment Thread ────────────────────────────────────────────────────────────

function CommentThread({ requestId, currentUserId }: { requestId: string; currentUserId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/requests/${requestId}/comments`);
    if (res.ok) {
      const data = await res.json();
      setComments(data.comments ?? []);
    }
  }, [requestId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!newComment.trim()) return;
    setIsSending(true);
    await fetch(`/api/requests/${requestId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newComment.trim() }),
    });
    setNewComment('');
    setIsSending(false);
    load();
  };

  const saveEdit = async (commentId: string) => {
    await fetch(`/api/requests/${requestId}/comments`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId, content: editContent }),
    });
    setEditingId(null);
    load();
  };

  const softDelete = async (commentId: string) => {
    await fetch(`/api/requests/${requestId}/comments?commentId=${commentId}`, { method: 'DELETE' });
    load();
  };

  const mention = (username: string) => setNewComment((c) => `${c}@${username} `);

  return (
    <div className="space-y-4">
      {comments.length === 0 && (
        <p className="text-[#6b7280] text-xs text-center py-4">No comments yet.</p>
      )}
      {comments.map((c) => {
        const isOwn = c.authorId._id === currentUserId;
        return (
          <div key={c._id} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1a1a2e] border border-[#2a2a4e] flex items-center justify-center text-xs text-[#9ca3af] flex-shrink-0">
              {c.authorId.name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-white text-xs font-semibold">{c.authorId.name}</span>
                <span className="text-[#4b5563] text-[10px]">{c.authorId.department}</span>
                <span className="text-[#4b5563] text-[10px]">
                  {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {c.editedAt && ' (edited)'}
                </span>
                {!isOwn && (
                  <button
                    onClick={() => mention(c.authorId.username)}
                    className="text-[10px] text-[#6366f1] hover:underline"
                  >
                    @mention
                  </button>
                )}
                {isOwn && (
                  <div className="flex gap-2 ml-auto">
                    <button
                      onClick={() => { setEditingId(c._id); setEditContent(c.content); }}
                      className="text-[10px] text-[#6b7280] hover:text-white"
                    >Edit</button>
                    <button
                      onClick={() => softDelete(c._id)}
                      className="text-[10px] text-red-400 hover:text-red-300"
                    >Delete</button>
                  </div>
                )}
              </div>
              {editingId === c._id ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg px-3 py-2 text-xs text-white resize-none focus:outline-none focus:ring-1 focus:ring-[#6366f1]"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(c._id)} className="px-3 py-1 rounded-lg bg-[#6366f1] text-white text-xs">Save</button>
                    <button onClick={() => setEditingId(null)} className="px-3 py-1 rounded-lg bg-[#1a1a2e] border border-[#2a2a4e] text-[#9ca3af] text-xs">Cancel</button>
                  </div>
                </div>
              ) : (
                <p className="text-[#d1d5db] text-xs leading-relaxed whitespace-pre-wrap">{c.content}</p>
              )}
            </div>
          </div>
        );
      })}

      {/* New comment box */}
      <div className="border-t border-[#1e1e3a] pt-4 space-y-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment… use @username to mention someone"
          className="w-full bg-[#1a1a2e] border border-[#2a2a4e] rounded-xl px-4 py-3 text-xs text-white placeholder-[#4b5563] resize-none focus:outline-none focus:ring-1 focus:ring-[#6366f1]"
          rows={3}
        />
        <button
          onClick={submit}
          disabled={isSending || !newComment.trim()}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#6366f1] hover:bg-[#5558e0] disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
        >
          {isSending ? 'Posting…' : 'Post Comment'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Engineering Review Page ──────────────────────────────────────────────

export default function EngineeringReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: requestId } = use(params);
  const router = useRouter();

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'estimate' | 'comments' | 'history'>('overview');

  // Override form state
  const [overrideMode, setOverrideMode] = useState(false);
  const [overrideValues, setOverrideValues] = useState({
    hoursPerOccurrence: 1, frequencyPerYear: 12, peopleInvolved: 1,
    blendedHourlyCost: 75, effortSize: 'M' as 'S' | 'M' | 'L' | 'XL',
    strategicValue: 3, urgency: 3, orgImpact: 3, riskLevel: 2,
  });
  const [isSavingOverride, setIsSavingOverride] = useState(false);
  const [overrideSuccess, setOverrideSuccess] = useState(false);

  // Status form state
  const [selectedStatus, setSelectedStatus] = useState('');
  const [reasonNote, setReasonNote] = useState('');
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');

  // Assignee state
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Bulk select state (for header back to list page)
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [reviewRes, engineerRes, sessionRes] = await Promise.all([
        fetch(`/api/admin/requests/${requestId}/estimate`),
        fetch(`/api/admin/requests/${requestId}/assign`),
        fetch('/api/auth/session'),
      ]);

      if (!reviewRes.ok) {
        const d = await reviewRes.json();
        setError(d.error ?? 'Failed to load review data');
        setIsLoading(false);
        return;
      }

      const reviewData = await reviewRes.json();
      setRequest(reviewData.request ?? null);
      setEstimate(reviewData.estimate ?? null);
      setSummary(reviewData.summary ?? null);

      if (reviewData.estimate) {
        const e = reviewData.estimate as Estimate;
        const s = reviewData.summary as Summary | null;
        setOverrideValues({
          hoursPerOccurrence: s?.hoursPerOccurrence ?? 1,
          frequencyPerYear: s?.frequencyPerYear ?? 12,
          peopleInvolved: s?.peopleInvolved ?? 1,
          blendedHourlyCost: 75,
          effortSize: e.effortSize ?? 'M',
          strategicValue: e.priorityInputs?.strategicValue ?? 3,
          urgency: e.priorityInputs?.urgency ?? 3,
          orgImpact: e.priorityInputs?.orgImpact ?? 3,
          riskLevel: e.priorityInputs?.riskLevel ?? 2,
        });
        setSelectedStatus(reviewData.request?.status ?? '');
        setSelectedAssignee(reviewData.request?.assignedTo?._id ?? '');
      }

      if (engineerRes.ok) {
        const engData = await engineerRes.json();
        setEngineers(engData.engineers ?? []);
      }

      if (sessionRes.ok) {
        const sessData = await sessionRes.json();
        setCurrentUserId(sessData?.user?.id ?? '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading data');
    } finally {
      setIsLoading(false);
    }
  }, [requestId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  // ── Override submit ──
  const handleSaveOverride = async () => {
    setIsSavingOverride(true);
    setOverrideSuccess(false);
    try {
      const res = await fetch(`/api/admin/requests/${requestId}/estimate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(overrideValues),
      });
      if (res.ok) {
        const data = await res.json();
        setEstimate(data.estimate);
        if (request) setRequest({ ...request, priorityScore: data.newPriorityScore });
        setOverrideMode(false);
        setOverrideSuccess(true);
        setTimeout(() => setOverrideSuccess(false), 3000);
      }
    } finally {
      setIsSavingOverride(false);
    }
  };

  // ── Status change ──
  const handleStatusChange = async () => {
    setStatusError('');
    setIsChangingStatus(true);
    try {
      const res = await fetch(`/api/admin/requests/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus: selectedStatus, reasonNote }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusError(data.error ?? 'Status change failed');
      } else {
        if (request) setRequest({ ...request, status: data.status, statusHistory: data.statusHistory });
        setReasonNote('');
      }
    } finally {
      setIsChangingStatus(false);
    }
  };

  // ── Assign ──
  const handleAssign = async () => {
    setIsAssigning(true);
    await fetch(`/api/admin/requests/${requestId}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigneeId: selectedAssignee || null }),
    });
    setIsAssigning(false);
    load();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#9ca3af] text-sm">Loading engineering review…</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center p-6">
        <div className="text-center max-w-sm bg-[#0f0f1e] p-6 rounded-2xl border border-[#1e1e3a]">
          <p className="text-red-400 text-sm mb-4">{error || 'Request not found'}</p>
          <button onClick={() => router.push('/admin/requests')}
            className="px-4 py-2 bg-[#6366f1] text-white text-xs rounded-xl">
            ← Back to Pipeline
          </button>
        </div>
      </div>
    );
  }

  const badge = STATUS_COLORS[request.status] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/30';
  const deptIcon = DEPT_ICONS[request.department] ?? '💼';
  const needsReason = REASON_REQUIRED.includes(selectedStatus as RequestStatus);

  return (
    <div className="min-h-screen bg-[#0a0a12] text-[#e0e0e0]">
      {/* ── Header ── */}
      <div className="border-b border-[#1e1e3a] bg-[#0f0f1e]/80 backdrop-blur-md px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.push('/admin/requests')}
              className="text-[#6b7280] hover:text-white transition-colors text-sm flex-shrink-0">← Pipeline</button>
            <span className="text-[#2a2a4e]">|</span>
            <span className="text-xl flex-shrink-0">{deptIcon}</span>
            <h1 className="text-lg font-bold text-white truncate">{request.title}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${badge}`}>
              {STATUS_LABELS[request.status] ?? request.status}
            </span>
            {estimate?.isOverridden && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 flex-shrink-0">
                ✏️ Overridden
              </span>
            )}
          </div>
          <Link href={`/requests/${requestId}`}
            className="text-xs text-[#9ca3af] hover:text-white px-3 py-1.5 rounded-lg border border-[#2a2a4e] transition-colors flex-shrink-0">
            👤 Requester View
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">

          {/* ── Left: Main content ── */}
          <div className="space-y-6">

            {/* Tab bar */}
            <div className="flex items-center gap-1 p-1 bg-[#0f0f1e] border border-[#1e1e3a] rounded-xl w-fit">
              {([
                ['overview',  '📋 Overview'],
                ['estimate',  '💰 Estimate & Override'],
                ['comments',  '💬 Comments'],
                ['history',   '📜 History'],
              ] as const).map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-[#6366f1] text-white'
                      : 'text-[#9ca3af] hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* ── Overview Tab ── */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Requester info */}
                <div className="p-5 bg-[#0f0f1e] border border-[#1e1e3a] rounded-2xl">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6366f1] mb-3">Requester</h2>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-[#6b7280] text-xs">Name</p><p className="text-white mt-0.5">{request.requesterId?.name ?? '—'}</p></div>
                    <div><p className="text-[#6b7280] text-xs">Email</p><p className="text-white mt-0.5">{request.requesterId?.email ?? '—'}</p></div>
                    <div><p className="text-[#6b7280] text-xs">Department</p><p className="text-white mt-0.5">{request.department}</p></div>
                    <div><p className="text-[#6b7280] text-xs">Submitted</p><p className="text-white mt-0.5">{request.submittedAt ? new Date(request.submittedAt).toLocaleDateString() : '—'}</p></div>
                  </div>
                </div>

                {/* Summary */}
                {summary && (
                  <div className="p-5 bg-[#0f0f1e] border border-[#1e1e3a] rounded-2xl space-y-4">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6366f1]">Process Summary</h2>
                    {summary.processDescription && (
                      <div>
                        <p className="text-[#6b7280] text-xs mb-1">Description</p>
                        <p className="text-[#d1d5db] text-sm leading-relaxed">{summary.processDescription}</p>
                      </div>
                    )}
                    {summary.desiredOutcome && (
                      <div>
                        <p className="text-[#6b7280] text-xs mb-1">Desired Outcome</p>
                        <p className="text-[#d1d5db] text-sm leading-relaxed">{summary.desiredOutcome}</p>
                      </div>
                    )}
                    {summary.painPoints?.length ? (
                      <div>
                        <p className="text-[#6b7280] text-xs mb-2">Pain Points</p>
                        <ul className="space-y-1">
                          {summary.painPoints.map((p) => <li key={p} className="text-[#d1d5db] text-xs flex gap-2"><span>•</span>{p}</li>)}
                        </ul>
                      </div>
                    ) : null}
                    {summary.toolsUsed?.length ? (
                      <div>
                        <p className="text-[#6b7280] text-xs mb-2">Tools Used</p>
                        <div className="flex flex-wrap gap-1.5">
                          {summary.toolsUsed.map((t) => <span key={t} className="text-xs bg-[#1a1a2e] border border-[#2a2a4e] text-[#d1d5db] px-2 py-0.5 rounded-md">{t}</span>)}
                        </div>
                      </div>
                    ) : null}
                    {summary.risks?.length ? (
                      <div>
                        <p className="text-amber-400 text-xs mb-2">⚠️ Risks</p>
                        <ul className="space-y-1">
                          {summary.risks.map((r) => <li key={r} className="text-[#d1d5db] text-xs flex gap-2"><span>•</span>{r}</li>)}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Narratives */}
                {estimate?.requesterNarrative && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-[#0f0f1e] border border-[#1e1e3a] rounded-2xl">
                      <p className="text-xs font-semibold text-[#6366f1] uppercase tracking-wider mb-2">Requester Narrative</p>
                      <p className="text-[#d1d5db] text-xs leading-relaxed">{estimate.requesterNarrative}</p>
                    </div>
                    <div className="p-4 bg-[#0f0f1e] border border-[#1e1e3a] rounded-2xl">
                      <p className="text-xs font-semibold text-[#6366f1] uppercase tracking-wider mb-2">Engineering Narrative</p>
                      <p className="text-[#d1d5db] text-xs leading-relaxed">{estimate.engineeringNarrative}</p>
                    </div>
                  </div>
                )}

                {/* Tags */}
                {request.tags?.length ? (
                  <div className="p-4 bg-[#0f0f1e] border border-[#1e1e3a] rounded-2xl">
                    <p className="text-[#6b7280] text-xs mb-2">Tags & Systems</p>
                    <div className="flex flex-wrap gap-1.5">
                      {request.tags.map((t) => <span key={t} className="text-xs bg-[#1a1a2e] border border-[#2a2a4e] text-[#d1d5db] px-2 py-0.5 rounded-md">{t}</span>)}
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* ── Estimate & Override Tab ── */}
            {activeTab === 'estimate' && estimate && (
              <div className="space-y-4">
                {overrideSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 text-xs text-center">
                    ✅ Estimate overridden successfully. Priority score recalculated.
                  </div>
                )}

                {/* Current estimates grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Annual Savings', value: `$${(estimate.annualDollarsSaved ?? 0).toLocaleString()}` },
                    { label: 'Hours Saved/yr', value: (estimate.annualHoursSaved ?? 0).toLocaleString() },
                    { label: 'Effort Size', value: estimate.effortSize },
                    { label: 'Build Cost', value: `~$${((estimate.buildCostEstimate ?? 0)).toLocaleString()}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-3 bg-[#0f0f1e] border border-[#1e1e3a] rounded-xl">
                      <p className="text-[#6b7280] text-xs mb-1">{label}</p>
                      <p className="text-white font-bold text-base">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Confidence badges */}
                <div className="flex gap-3 flex-wrap">
                  {[
                    { label: 'ROI Confidence', level: estimate.roiConfidence },
                    { label: 'Effort Confidence', level: estimate.effortConfidence },
                  ].map(({ label, level }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-[#6b7280] text-xs">{label}:</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${CONFIDENCE_COLORS[level] ?? CONFIDENCE_COLORS.LOW}`}>
                        {level}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Priority inputs breakdown */}
                {estimate.priorityInputs && (
                  <div className="p-4 bg-[#0f0f1e] border border-[#1e1e3a] rounded-2xl">
                    <p className="text-[#6366f1] text-xs font-semibold uppercase tracking-wider mb-3">Priority Factor Breakdown</p>
                    <div className="space-y-3">
                      {([
                        ['Strategic Value', estimate.priorityInputs.strategicValue],
                        ['Urgency',         estimate.priorityInputs.urgency],
                        ['Org Impact',      estimate.priorityInputs.orgImpact],
                        ['Risk Level',      estimate.priorityInputs.riskLevel],
                      ] as [string, number | undefined][]).map(([label, val]) => (
                        <div key={label} className="flex items-center gap-3">
                          <span className="text-[#9ca3af] text-xs w-28 flex-shrink-0">{label}</span>
                          <div className="flex-1 bg-[#1a1a2e] rounded-full h-1.5">
                            <div
                              className="bg-[#6366f1] h-1.5 rounded-full"
                              style={{ width: `${((val ?? 1) - 1) / 4 * 100}%` }}
                            />
                          </div>
                          <span className="text-white text-xs font-semibold w-6 text-right">{val ?? '—'}</span>
                        </div>
                      ))}
                    </div>
                    {estimate.priorityInputs.rationale && (
                      <p className="text-[#9ca3af] text-xs mt-3 italic">{estimate.priorityInputs.rationale}</p>
                    )}
                    {estimate.priorityInputs.urgencySignals?.length ? (
                      <div className="mt-3">
                        <p className="text-[#6b7280] text-xs mb-1">Urgency Signals</p>
                        <ul className="space-y-0.5">
                          {estimate.priorityInputs.urgencySignals.map((s) => (
                            <li key={s} className="text-[#d1d5db] text-xs">• {s}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Override section */}
                <div className="p-4 bg-[#0f0f1e] border border-[#1e1e3a] rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[#6366f1] text-xs font-semibold uppercase tracking-wider">
                      {overrideMode ? '✏️ Override Inputs' : 'Admin Override'}
                    </p>
                    {!overrideMode && (
                      <button
                        onClick={() => setOverrideMode(true)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors"
                      >
                        ✏️ Edit Inputs
                      </button>
                    )}
                  </div>

                  {overrideMode && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        {([
                          ['Hours / Occurrence', 'hoursPerOccurrence', 0.5],
                          ['Times / Year', 'frequencyPerYear', 1],
                          ['People Involved', 'peopleInvolved', 1],
                          ['Blended Rate ($/hr)', 'blendedHourlyCost', 1],
                        ] as const).map(([label, key, step]) => (
                          <div key={key}>
                            <label className="text-[#9ca3af] text-xs mb-1 block">{label}</label>
                            <input
                              type="number"
                              min={0}
                              step={step}
                              value={overrideValues[key]}
                              onChange={(e) => setOverrideValues((v) => ({ ...v, [key]: parseFloat(e.target.value) || 0 }))}
                              className="w-full bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#6366f1]"
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="text-[#9ca3af] text-xs mb-1 block">Effort Size</label>
                        <div className="flex gap-2">
                          {(['S', 'M', 'L', 'XL'] as const).map((sz) => (
                            <button
                              key={sz}
                              onClick={() => setOverrideValues((v) => ({ ...v, effortSize: sz }))}
                              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                overrideValues.effortSize === sz
                                  ? 'bg-[#6366f1] text-white'
                                  : 'bg-[#1a1a2e] border border-[#2a2a4e] text-[#9ca3af] hover:text-white'
                              }`}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        {([
                          ['Strategic Value', 'strategicValue'],
                          ['Urgency', 'urgency'],
                          ['Org Impact', 'orgImpact'],
                          ['Risk Level', 'riskLevel'],
                        ] as const).map(([label, key]) => (
                          <ScoreSlider
                            key={key}
                            label={label}
                            value={overrideValues[key]}
                            onChange={(v) => setOverrideValues((ov) => ({ ...ov, [key]: v }))}
                            disabled={false}
                          />
                        ))}
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleSaveOverride}
                          disabled={isSavingOverride}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold bg-[#6366f1] hover:bg-[#5558e0] disabled:opacity-50 text-white transition-colors"
                        >
                          {isSavingOverride ? 'Recalculating…' : 'Save & Recalculate'}
                        </button>
                        <button
                          onClick={() => setOverrideMode(false)}
                          className="px-4 py-2 rounded-xl text-xs font-medium bg-[#1a1a2e] border border-[#2a2a4e] text-[#9ca3af] hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Overridden fields diff */}
                  {estimate.isOverridden && estimate.overriddenFields && Object.keys(estimate.overriddenFields).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#1e1e3a]">
                      <p className="text-[#6b7280] text-xs mb-2">Overridden Fields</p>
                      <div className="space-y-1.5">
                        {Object.entries(estimate.overriddenFields).map(([field, diff]) => (
                          <div key={field} className="flex items-center gap-2 text-xs">
                            <span className="text-[#9ca3af] w-36 flex-shrink-0">{field}</span>
                            <span className="text-red-400 line-through">{String(diff.before)}</span>
                            <span className="text-[#6b7280]">→</span>
                            <span className="text-emerald-400">{String(diff.after)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Comments Tab ── */}
            {activeTab === 'comments' && (
              <div className="p-5 bg-[#0f0f1e] border border-[#1e1e3a] rounded-2xl">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6366f1] mb-4">💬 Comment Thread</h2>
                <CommentThread requestId={requestId} currentUserId={currentUserId} />
              </div>
            )}

            {/* ── History Tab ── */}
            {activeTab === 'history' && (
              <div className="p-5 bg-[#0f0f1e] border border-[#1e1e3a] rounded-2xl">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6366f1] mb-4">📜 Status History</h2>
                {!request.statusHistory?.length ? (
                  <p className="text-[#6b7280] text-xs text-center py-4">No status changes yet.</p>
                ) : (
                  <div className="space-y-3">
                    {[...request.statusHistory].reverse().map((h, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#6366f1] mt-1.5 flex-shrink-0" />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            {h.oldStatus && (
                              <>
                                <span className={`px-2 py-0.5 rounded-full border ${STATUS_COLORS[h.oldStatus] ?? 'border-gray-500/30 text-gray-400'}`}>
                                  {STATUS_LABELS[h.oldStatus] ?? h.oldStatus}
                                </span>
                                <span className="text-[#4b5563]">→</span>
                              </>
                            )}
                            <span className={`px-2 py-0.5 rounded-full border ${STATUS_COLORS[h.newStatus] ?? 'border-gray-500/30 text-gray-400'}`}>
                              {STATUS_LABELS[h.newStatus] ?? h.newStatus}
                            </span>
                            <span className="text-[#4b5563]">
                              {new Date(h.changedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {h.reasonNote && (
                            <p className="text-[#9ca3af] text-xs mt-1 italic">&quot;{h.reasonNote}&quot;</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right Sidebar ── */}
          <div className="space-y-4">

            {/* Priority Score */}
            <div className="p-4 bg-[#0f0f1e] border border-[#1e1e3a] rounded-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6366f1] mb-3">Priority Score</p>
              <div className="flex items-center gap-4">
                <ScoreGauge score={request.priorityScore ?? 0} />
                <div className="text-xs space-y-1 text-[#9ca3af]">
                  <p>Score: <span className="text-white font-bold">{(request.priorityScore ?? 0).toFixed(1)}</span>/100</p>
                  <p>ROI: <span className="text-white">{request.roiConfidence}</span></p>
                  {estimate?.effortSize && <p>Effort: <span className="text-white">{estimate.effortSize}</span></p>}
                </div>
              </div>
            </div>

            {/* Status Management */}
            <div className="p-4 bg-[#0f0f1e] border border-[#1e1e3a] rounded-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6366f1]">Status Management</p>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-[#1a1a2e] border border-[#2a2a4e] text-[#d1d5db] text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#6366f1]"
              >
                {REQUEST_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
                ))}
              </select>
              {needsReason && (
                <textarea
                  value={reasonNote}
                  onChange={(e) => setReasonNote(e.target.value)}
                  placeholder={`Required: reason for "${STATUS_LABELS[selectedStatus] ?? selectedStatus}"…`}
                  className="w-full bg-[#1a1a2e] border border-[#2a2a4e] text-[#d1d5db] text-xs rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#6366f1]"
                  rows={2}
                />
              )}
              {statusError && <p className="text-red-400 text-xs">{statusError}</p>}
              <button
                onClick={handleStatusChange}
                disabled={isChangingStatus || selectedStatus === request.status}
                className="w-full py-2 rounded-xl text-xs font-semibold bg-[#6366f1] hover:bg-[#5558e0] disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
              >
                {isChangingStatus ? 'Updating…' : 'Update Status'}
              </button>
            </div>

            {/* Assignee */}
            <div className="p-4 bg-[#0f0f1e] border border-[#1e1e3a] rounded-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6366f1]">Assigned Engineer</p>
              {request.assignedTo && (
                <div className="flex items-center gap-2 p-2 bg-[#1a1a2e] rounded-lg border border-[#2a2a4e]">
                  <div className="w-6 h-6 rounded-full bg-[#6366f1]/20 flex items-center justify-center text-xs text-[#6366f1]">
                    {request.assignedTo.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium">{request.assignedTo.name}</p>
                    <p className="text-[#6b7280] text-[10px]">@{request.assignedTo.username}</p>
                  </div>
                </div>
              )}
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="w-full bg-[#1a1a2e] border border-[#2a2a4e] text-[#d1d5db] text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#6366f1]"
              >
                <option value="">— Unassigned —</option>
                {engineers.map((e) => (
                  <option key={e._id} value={e._id}>{e.name} (@{e.username})</option>
                ))}
              </select>
              <button
                onClick={handleAssign}
                disabled={isAssigning}
                className="w-full py-2 rounded-xl text-xs font-semibold bg-[#1a1a2e] border border-[#2a2a4e] hover:bg-[#6366f1] hover:border-[#6366f1] text-[#d1d5db] hover:text-white disabled:opacity-50 transition-colors"
              >
                {isAssigning ? 'Saving…' : 'Update Assignee'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
