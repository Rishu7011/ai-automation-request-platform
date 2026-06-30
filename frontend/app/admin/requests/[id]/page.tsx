'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { INTAKE_STAGES, REQUEST_STATUSES, RequestStatus } from '@/constants';
import {
  Sliders,
  FileText,
  Users,
  BarChart2,
  Shield,
  Settings,
  ArrowLeft,
  User,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Send,
  MessageSquare,
  Paperclip,
  Download,
  Edit3,
  Check,
  ChevronRight
} from 'lucide-react';

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
  draft: 'bg-amber-100 text-amber-800 border-amber-200',
  submitted: 'bg-blue-100 text-blue-800 border-blue-200',
  ai_reviewing: 'bg-purple-100 text-purple-800 border-purple-200',
  needs_more_info: 'bg-orange-100 text-orange-800 border-orange-200',
  engineering_review: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-rose-100 text-rose-800 border-rose-200',
  planned: 'bg-teal-100 text-teal-800 border-teal-200',
  in_development: 'bg-blue-100 text-blue-800 border-blue-200',
  testing: 'bg-purple-100 text-purple-800 border-purple-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  archived: 'bg-slate-100 text-slate-700 border-slate-200',
};

const REASON_REQUIRED: RequestStatus[] = ['rejected', 'needs_more_info'];

const CONFIDENCE_COLORS: Record<string, string> = {
  HIGH:   'text-emerald-800 bg-emerald-100 border-emerald-200',
  MEDIUM: 'text-amber-800 bg-amber-100 border-amber-200',
  LOW:    'text-rose-800 bg-rose-100 border-rose-200',
};

const DEPT_ICONS: Record<string, string> = {
  Recruitment: '🤝', HR: '🧑‍💼', Finance: '💵', Compliance: '⚖️',
  IT: '💻', Operations: '⚙️', Engineering: '🔧', Legal: '📜',
  Sales: '📈', Marketing: '🎯',
};

// ─── Score Gauge ─────────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const color = clamped >= 70 ? '#dc2626' : clamped >= 50 ? '#ea580c' : clamped >= 30 ? '#d97706' : '#64748b';
  const tierLabel = clamped >= 70 ? 'Critical' : clamped >= 50 ? 'High' : clamped >= 30 ? 'Medium' : 'Low';
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke={color} strokeWidth="3.5"
            strokeDasharray={`${clamped} ${100 - clamped}`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-slate-900 font-extrabold text-sm">
          {clamped.toFixed(0)}
        </span>
      </div>
      <span className="text-xs font-bold" style={{ color }}>{tierLabel}</span>
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
        <label className="text-slate-600 text-xs font-bold">{label}</label>
        <span className="text-slate-900 text-xs font-extrabold">{value}/5</span>
      </div>
      <input
        type="range" min={1} max={5} step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        disabled={disabled}
        className="w-full accent-blue-600 cursor-pointer disabled:cursor-not-allowed"
      />
      <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-0.5">
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

  useEffect(() => {
    queueMicrotask(() => { void load(); });
  }, [load]);

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
        <p className="text-slate-400 text-xs text-center py-4 font-medium">No comments yet.</p>
      )}
      {comments.map((c) => {
        const isOwn = c.authorId._id === currentUserId;
        return (
          <div key={c._id} className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">
              {c.authorId.name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-slate-900 text-xs font-bold">{c.authorId.name}</span>
                <span className="text-slate-400 text-[10px] font-semibold">{c.authorId.department}</span>
                <span className="text-slate-400 text-[10px] font-medium">
                  {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {c.editedAt && ' (edited)'}
                </span>
                {!isOwn && (
                  <button
                    onClick={() => mention(c.authorId.username)}
                    className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    @mention
                  </button>
                )}
                {isOwn && (
                  <div className="flex gap-2 ml-auto">
                    <button
                      onClick={() => { setEditingId(c._id); setEditContent(c.content); }}
                      className="text-[10px] text-slate-500 font-bold hover:text-slate-800 cursor-pointer"
                    >Edit</button>
                    <button
                      onClick={() => softDelete(c._id)}
                      className="text-[10px] text-rose-600 font-bold hover:text-rose-700 cursor-pointer"
                    >Delete</button>
                  </div>
                )}
              </div>
              {editingId === c._id ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-600"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(c._id)} className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer">Save</button>
                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer">Cancel</button>
                  </div>
                </div>
              ) : (
                <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap font-medium">{c.content}</p>
              )}
            </div>
          </div>
        );
      })}

      {/* New comment box */}
      <div className="border-t border-slate-200 pt-4 space-y-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment… use @username to mention someone"
          className="w-full bg-slate-100/70 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
          rows={3}
        />
        <button
          onClick={submit}
          disabled={isSending || !newComment.trim()}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all cursor-pointer shadow-sm"
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
  const [attachments, setAttachments] = useState<Array<{
    _id: string;
    originalName: string;
    fileSize: number;
    filePath: string;
    createdAt: string;
  }>>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'estimate' | 'comments' | 'history' | 'attachments'>('overview');

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

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [reviewRes, engineerRes, sessionRes, attachRes] = await Promise.all([
        fetch(`/api/admin/requests/${requestId}/estimate`),
        fetch(`/api/admin/requests/${requestId}/assign`),
        fetch('/api/auth/session'),
        fetch(`/api/requests/${requestId}/attachments`),
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

  useEffect(() => {
    queueMicrotask(() => { void load(); });
  }, [load]);

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-sm font-medium">Loading engineering review…</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="text-center max-w-sm bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <p className="text-rose-600 font-bold text-sm">{error || 'Request not found'}</p>
          <button onClick={() => router.push('/admin/requests')}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer">
            ← Back to Pipeline
          </button>
        </div>
      </div>
    );
  }

  const badge = STATUS_COLORS[request.status] ?? 'bg-slate-100 text-slate-700 border-slate-200';
  const deptIcon = DEPT_ICONS[request.department] ?? '💼';
  const needsReason = REASON_REQUIRED.includes(selectedStatus as RequestStatus);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Admin Top Navigation */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => router.push('/admin/requests')} className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
                <Sliders className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight truncate max-w-md">{request.title}</h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge}`}>
                    {STATUS_LABELS[request.status] ?? request.status}
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{request.department} Department</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href={`/requests/${requestId}`}
              className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 px-3.5 py-2 rounded-xl transition-all">
              Requester Portal View →
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">

          {/* Left: Main details */}
          <div className="space-y-6">

            {/* Tab navigation */}
            <div className="flex items-center gap-1.5 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-xs w-fit">
              {([
                ['overview',    '📋 Overview'],
                ['estimate',    '💰 Estimate & Override'],
                ['comments',    '💬 Comments'],
                ['history',     '📜 History'],
                ['attachments', '📎 Attachments'],
              ] as const).map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-5">
                <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-blue-600">Requester Profile</h2>
                  <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                    <div><p className="text-slate-400 font-semibold">Name</p><p className="text-slate-900 font-bold text-sm mt-0.5">{request.requesterId?.name ?? '—'}</p></div>
                    <div><p className="text-slate-400 font-semibold">Email</p><p className="text-slate-900 font-bold text-sm mt-0.5">{request.requesterId?.email ?? '—'}</p></div>
                    <div><p className="text-slate-400 font-semibold">Department</p><p className="text-slate-900 font-bold text-sm mt-0.5">{request.department}</p></div>
                    <div><p className="text-slate-400 font-semibold">Submitted Date</p><p className="text-slate-900 font-bold text-sm mt-0.5">{request.submittedAt ? new Date(request.submittedAt).toLocaleDateString() : '—'}</p></div>
                  </div>
                </div>

                {summary && (
                  <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5">
                    <h2 className="text-xs font-extrabold uppercase tracking-wider text-blue-600">Process Intake Summary</h2>
                    {summary.processDescription && (
                      <div>
                        <p className="text-slate-400 text-xs font-semibold mb-1">Process Description</p>
                        <p className="text-slate-800 text-xs leading-relaxed font-medium">{summary.processDescription}</p>
                      </div>
                    )}
                    {summary.desiredOutcome && (
                      <div>
                        <p className="text-slate-400 text-xs font-semibold mb-1">Desired Automation Outcome</p>
                        <p className="text-slate-800 text-xs leading-relaxed font-medium">{summary.desiredOutcome}</p>
                      </div>
                    )}
                    {summary.painPoints?.length ? (
                      <div>
                        <p className="text-slate-400 text-xs font-semibold mb-2">Key Pain Points</p>
                        <ul className="space-y-1">
                          {summary.painPoints.map((p) => <li key={p} className="text-slate-700 text-xs font-medium flex gap-2"><span>•</span>{p}</li>)}
                        </ul>
                      </div>
                    ) : null}
                    {summary.toolsUsed?.length ? (
                      <div>
                        <p className="text-slate-400 text-xs font-semibold mb-2">Systems & Tools Involved</p>
                        <div className="flex flex-wrap gap-1.5">
                          {summary.toolsUsed.map((t) => <span key={t} className="text-xs bg-slate-100 border border-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded-lg">{t}</span>)}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}

            {/* Estimate & Override Tab */}
            {activeTab === 'estimate' && estimate && (
              <div className="space-y-5">
                {overrideSuccess && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center">
                    ✅ Estimate overridden successfully. Priority score recalculated.
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Annual Savings', value: `$${(estimate.annualDollarsSaved ?? 0).toLocaleString()}` },
                    { label: 'Hours Saved/yr', value: (estimate.annualHoursSaved ?? 0).toLocaleString() },
                    { label: 'Effort Size', value: estimate.effortSize },
                    { label: 'Build Cost', value: `~$${((estimate.buildCostEstimate ?? 0)).toLocaleString()}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <p className="text-slate-400 text-xs font-semibold uppercase">{label}</p>
                      <p className="text-slate-900 font-extrabold text-lg mt-1">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-extrabold uppercase tracking-wider text-blue-600">Admin Override Controls</h2>
                    {!overrideMode && (
                      <button
                        onClick={() => setOverrideMode(true)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition-all cursor-pointer"
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
                            <label className="text-slate-600 text-xs font-bold mb-1 block">{label}</label>
                            <input
                              type="number"
                              min={0}
                              step={step}
                              value={overrideValues[key]}
                              onChange={(e) => setOverrideValues((v) => ({ ...v, [key]: parseFloat(e.target.value) || 0 }))}
                              className="w-full bg-slate-100/70 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="text-slate-600 text-xs font-bold mb-1 block">Effort Size</label>
                        <div className="flex gap-2">
                          {(['S', 'M', 'L', 'XL'] as const).map((sz) => (
                            <button
                              key={sz}
                              onClick={() => setOverrideValues((v) => ({ ...v, effortSize: sz }))}
                              className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                                overrideValues.effortSize === sz
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
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
                          className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-all cursor-pointer shadow-sm"
                        >
                          {isSavingOverride ? 'Recalculating…' : 'Save & Recalculate'}
                        </button>
                        <button
                          onClick={() => setOverrideMode(false)}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-blue-600 mb-4">💬 Comment Thread</h2>
                <CommentThread requestId={requestId} currentUserId={currentUserId} />
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-blue-600 mb-4">📜 Status Audit History</h2>
                {!request.statusHistory?.length ? (
                  <p className="text-slate-400 text-xs text-center py-4 font-medium">No status changes recorded.</p>
                ) : (
                  <div className="space-y-4">
                    {[...request.statusHistory].reverse().map((h, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            {h.oldStatus && (
                              <>
                                <span className={`px-2.5 py-0.5 rounded-full font-bold border ${STATUS_COLORS[h.oldStatus] ?? 'border-slate-200 text-slate-600'}`}>
                                  {STATUS_LABELS[h.oldStatus] ?? h.oldStatus}
                                </span>
                                <span className="text-slate-400">→</span>
                              </>
                            )}
                            <span className={`px-2.5 py-0.5 rounded-full font-bold border ${STATUS_COLORS[h.newStatus] ?? 'border-slate-200 text-slate-600'}`}>
                              {STATUS_LABELS[h.newStatus] ?? h.newStatus}
                            </span>
                            <span className="text-slate-400 font-medium">
                              {new Date(h.changedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {h.reasonNote && (
                            <p className="text-slate-600 text-xs mt-1.5 italic">&quot;{h.reasonNote}&quot;</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Attachments Tab */}
            {activeTab === 'attachments' && (
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
                  Uploaded Documentation & Attachments ({attachments.length})
                </h2>
                {attachments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No files attached to this request.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {attachments.map((att) => (
                      <div
                        key={att._id}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200"
                      >
                        <div className="min-w-0 pr-3">
                          <p className="text-xs font-bold text-slate-800 truncate">{att.originalName}</p>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {(att.fileSize / 1024).toFixed(1)} KB · {new Date(att.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <a
                          href={att.filePath}
                          download={att.originalName}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold transition-colors border border-blue-100 shrink-0 cursor-pointer"
                        >
                          ⬇ Download
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar Controls */}
          <div className="space-y-5">

            {/* Priority Score Card */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
              <p className="text-xs font-extrabold uppercase tracking-wider text-blue-600">Priority Score Gauge</p>
              <div className="flex items-center gap-4">
                <ScoreGauge score={request.priorityScore ?? 0} />
                <div className="text-xs space-y-1 text-slate-500 font-medium">
                  <p>Score: <span className="text-slate-900 font-bold">{(request.priorityScore ?? 0).toFixed(1)}</span>/100</p>
                  <p>ROI: <span className="text-slate-900 font-bold">{request.roiConfidence}</span></p>
                  {estimate?.effortSize && <p>Effort: <span className="text-slate-900 font-bold">{estimate.effortSize}</span></p>}
                </div>
              </div>
            </div>

            {/* Status Management Card */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
              <p className="text-xs font-extrabold uppercase tracking-wider text-blue-600">Status Management</p>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-slate-100/70 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
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
                  className="w-full bg-slate-100/70 border border-slate-200 text-slate-800 text-xs font-medium rounded-xl px-3.5 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-600"
                  rows={2}
                />
              )}
              {statusError && <p className="text-rose-600 text-xs font-bold">{statusError}</p>}
              <button
                onClick={handleStatusChange}
                disabled={isChangingStatus || selectedStatus === request.status}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all cursor-pointer shadow-sm"
              >
                {isChangingStatus ? 'Updating…' : 'Update Status'}
              </button>
            </div>

            {/* Assignee Card */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
              <p className="text-xs font-extrabold uppercase tracking-wider text-blue-600">Assigned Engineer</p>
              {request.assignedTo && (
                <div className="flex items-center gap-3 p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-xs">
                    {request.assignedTo.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-slate-900 text-xs font-bold">{request.assignedTo.name}</p>
                    <p className="text-slate-500 text-[10px] font-semibold">@{request.assignedTo.username}</p>
                  </div>
                </div>
              )}
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="w-full bg-slate-100/70 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
              >
                <option value="">— Unassigned —</option>
                {engineers.map((e) => (
                  <option key={e._id} value={e._id}>{e.name} (@{e.username})</option>
                ))}
              </select>
              <button
                onClick={handleAssign}
                disabled={isAssigning}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-100 border border-slate-200 hover:bg-blue-600 hover:text-white text-slate-800 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isAssigning ? 'Saving…' : 'Update Assignee'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Admin Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-6 mt-auto">

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-blue-600" />
            <span className="font-bold text-slate-700">Enterprise AI Prioritization Engine</span>
          </div>
          <p>© 2024 CogniFlow Enterprise Admin Console.</p>
        </div>
      </footer>
    </div>
  );
}


