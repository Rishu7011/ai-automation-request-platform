'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { INTAKE_STAGES } from '@/constants';
import FileUpload from '@/components/FileUpload';
import {
  Send,
  CheckCircle2,
  Bot,
  User,
  Save,
  ArrowLeft,
  AlertTriangle,
  UserIcon,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface RequestInfo {
  department: string;
  title: string;
  status: string;
}

interface ReviewData {
  priorityScore: number;
  roiConfidence: string;
  estimate: {
    annualHoursSaved: number;
    annualDollarsSaved: number;
    buildCostMid: number;
    simpleROI: number;
    effortSize: string;
    riskFlags: string[];
  };
  narratives: {
    requester: string;
    engineering: string;
  };
  categorization: {
    automationType: string;
    departmentTags: string[];
    systemsTouched: string[];
  };
}

// ─── Stage Progress Bar ───────────────────────────────────────────────────────

function StageProgressBar({
  currentStage,
  completedStages,
}: {
  currentStage: number;
  completedStages: Set<number>;
}) {
  return (
    <div className="flex items-center gap-1.5 px-6 py-3.5 bg-white border-b border-slate-200 overflow-x-auto scrollbar-none">
      {INTAKE_STAGES.map((stage, idx) => {
        const isCompleted = completedStages.has(stage.id);
        const isCurrent = stage.id === currentStage;
        const isFuture = stage.id > currentStage && !completedStages.has(stage.id);

        return (
          <div key={stage.id} className="flex items-center flex-shrink-0">
            {idx > 0 && (
              <div
                className={`w-6 h-0.5 mx-1 transition-colors ${
                  isCompleted || idx < currentStage - 1
                    ? 'bg-blue-400'
                    : 'bg-slate-200'
                }`}
              />
            )}
            <div
              title={stage.name}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all
                ${
                  isCompleted
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : isCurrent
                    ? 'bg-[#4a91e9] text-white shadow-md shadow-[#6366f1]/20'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }
              `}
            >
              <span>{isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : stage.icon}</span>
              <span className="hidden sm:inline whitespace-nowrap">{stage.name}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Chat Bubble ──────────────────────────────────────────────────────────────

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-5`}>
      {/* Avatar */}
      {/* <div
        className={`
          flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shadow-xs
          ${isUser ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'}
        `}
      >
        {isUser ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div> */}

      {/* Bubble */}
      <div
        className={`
          max-w-[80%] px-5 py-3.5 rounded-2xl text-md sm:text-md leading-relaxed font-md shadow-xs
          ${
            isUser
              ? 'bg-gray-400 text-white rounded-tr-xs '
              : 'bg-white border border-slate-200 text-slate-800   rounded-tl-xs'
          }
        `}
      >
        {message.content}
      </div>
    </div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-3.5 mb-5">
      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
        <Bot className="h-4 w-4" />
      </div>
      <div className="bg-white border border-slate-200 px-5 py-3.5 rounded-2xl rounded-tl-xs flex items-center gap-1.5 shadow-xs">
        <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

// ─── Stage Complete Banner ────────────────────────────────────────────────────

function StageCompleteBanner({
  stageName,
  onNext,
  isLastStage,
  isSubmitting,
}: {
  stageName: string;
  onNext: () => void;
  isLastStage: boolean;
  isSubmitting?: boolean;
}) {
  return (
    <div className="mx-4 mb-5 p-5 rounded-2xl bg-blue-50 border border-blue-200 text-center shadow-xs">
      <p className="text-blue-700 font-bold text-sm mb-1 flex items-center justify-center gap-1.5">
        <CheckCircle2 className="h-4 w-4 text-blue-600" /> {stageName} Complete
      </p>
      <p className="text-slate-600 text-xs mb-4 font-medium">
        {isLastStage
          ? 'Intake assessment complete! Click below to run full AI analysis & submit.'
          : 'Section complete! Ready to move to the next section?'}
      </p>
      <button
        onClick={onNext}
        disabled={isSubmitting}
        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md shadow-[#6366f1]/20 cursor-pointer inline-flex items-center gap-1.5"
      >
        {isLastStage
          ? isSubmitting
            ? 'Running Analysis…'
            : 'Submit & Run AI Scoring'
          : 'Next Section →'}
      </button>
    </div>
  );
}

// ─── Submitting Overlay ───────────────────────────────────────────────────────

function SubmittingOverlay() {
  const steps = [
    { icon: '🔍', text: 'Extracting process information…' },
    { icon: '💰', text: 'Calculating ROI estimates…' },
    { icon: '⚙️', text: 'Estimating engineering effort…' },
    { icon: '🏷️', text: 'Categorizing automation type…' },
    { icon: '📊', text: 'Scoring priority…' },
    { icon: '✍️', text: 'Generating summaries…' },
  ];
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIdx((i) => (i + 1) % steps.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-sm w-full mx-4 text-center shadow-xl space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <div>
          <h3 className="text-slate-900 font-bold text-base">Running AI Analysis</h3>
          <p className="text-slate-500 text-xs mt-1 font-medium">
            CogniFlow agents are scoring ROI & priority metrics.
          </p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl flex-shrink-0">{steps[stepIdx].icon}</span>
          <span className="text-slate-800 text-xs font-semibold text-left">{steps[stepIdx].text}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Review Summary Card ──────────────────────────────────────────────────────

function ConfidenceBadge({ level }: { level: string }) {
  const map: Record<string, { color: string; label: string }> = {
    HIGH:   { color: 'text-emerald-800 bg-emerald-100 border-emerald-200', label: '🟢 High' },
    MEDIUM: { color: 'text-amber-800 bg-amber-100 border-amber-200',     label: '🟡 Medium' },
    LOW:    { color: 'text-rose-800 bg-rose-100 border-rose-200',         label: '🔴 Low' },
  };
  const cfg = map[level.toUpperCase()] ?? map.LOW;
  return (
    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${cfg.color}`}>
      {cfg.label} Confidence
    </span>
  );
}

function ReviewSummaryCard({ data, requestTitle }: { data: ReviewData; requestTitle: string }) {
  const fmt = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n.toFixed(0)}`;

  const roiPct = data.estimate.simpleROI * 100;
  const roiLabel = roiPct >= 0 ? `+${roiPct.toFixed(0)}%` : `${roiPct.toFixed(0)}%`;

  return (
    <div className="mx-4 mb-5 space-y-4">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
        <p className="text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">Review Summary</p>
        <p className="text-slate-900 font-bold text-sm">{requestTitle}</p>
        <p className="text-[#9ca3af] text-xs mt-1 font-medium">{data.narratives.requester}</p>
      </div>

      {/* ROI & Effort */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Annual Savings</p>
          <p className="text-slate-900 font-bold text-lg">{fmt(data.estimate.annualDollarsSaved)}</p>
          <p className="text-slate-500 text-xs font-medium">{data.estimate.annualHoursSaved.toLocaleString()} hrs saved</p>
          <div className="mt-2">
            <ConfidenceBadge level={data.roiConfidence} />
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Effort Estimate</p>
          <p className="text-slate-900 font-bold text-lg">{data.estimate.effortSize}</p>
          <p className="text-slate-500 text-xs font-medium">Build cost ~{fmt(data.estimate.buildCostMid)}</p>
          <p className="text-blue-600 text-xs font-bold mt-1">ROI: {roiLabel}</p>
        </div>
      </div>

      {/* Priority Score */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-0.5">Priority Score</p>
          <p className="text-slate-900 font-bold text-2xl">{data.priorityScore}<span className="text-slate-400 text-sm font-normal">/100</span></p>
        </div>
        <div className="text-right">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-0.5">Automation Type</p>
          <p className="text-slate-800 text-xs font-bold">{data.categorization.automationType}</p>
        </div>
      </div>

      {/* Systems Tags */}
      {data.categorization.systemsTouched.length > 0 && (
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Systems Involved</p>
          <div className="flex flex-wrap gap-1.5">
            {data.categorization.systemsTouched.map((s) => (
              <span key={s} className="text-xs bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-lg border border-slate-200">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Risk Flags */}
      {data.estimate.riskFlags.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <p className="text-amber-800 text-xs font-bold mb-2 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Risk Flags
          </p>
          <ul className="space-y-1">
            {data.estimate.riskFlags.map((r) => (
              <li key={r} className="text-slate-700 text-xs font-medium">• {r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function IntakeChatPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params?.id as string;


  const [requestInfo, setRequestInfo] = useState<RequestInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStage, setCurrentStage] = useState(1);
  const [completedStages, setCompletedStages] = useState<Set<number>>(new Set());
  const [slotFillState, setSlotFillState] = useState<Record<string, unknown>>({});
  const [input, setInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [stageComplete, setStageComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Stage 8 submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const stageOpenerCalledRef = useRef<Set<number>>(new Set());

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiTyping, scrollToBottom]);

  // Load existing conversation
  useEffect(() => {
    if (!requestId) return;

    const loadConversation = async () => {
      try {
        const res = await fetch(`/api/intake/chat?requestId=${requestId}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? 'Failed to load conversation');
          return;
        }

        const data = await res.json();
        setRequestInfo({
          department: data.department,
          title: data.title,
          status: data.status,
        });

        if (data.turns && data.turns.length > 0) {
          const existingMessages: ChatMessage[] = data.turns.map(
            (t: { sender: string; message: string; timestamp: string; stage: number }, i: number) => ({
              id: `loaded-${i}`,
              role: t.sender === 'user' ? 'user' : 'ai',
              content: t.message,
              timestamp: new Date(t.timestamp),
            })
          );
          setMessages(existingMessages);

          const lastTurn = data.turns[data.turns.length - 1];
          const lastStage = lastTurn.stage ?? 1;
          setCurrentStage(lastStage);

          const completed = new Set<number>();
          for (let s = 1; s < lastStage; s++) {
            completed.add(s);
          }
          setCompletedStages(completed);
          stageOpenerCalledRef.current.add(lastStage);
        }
      } catch {
        setError('Failed to load conversation');
      } finally {
        setIsLoading(false);
      }
    };

    loadConversation();
  }, [requestId]);

  // Request stage opener from AI
  useEffect(() => {
    if (isLoading || !requestInfo) return;
    if (stageOpenerCalledRef.current.has(currentStage)) return;
    stageOpenerCalledRef.current.add(currentStage);

    const requestOpener = async () => {
      setIsAiTyping(true);
      try {
        const res = await fetch('/api/intake/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestId,
            stage: currentStage,
            slotFillState,
            isStageOpener: true,
          }),
        });

        if (!res.ok) return;

        const data = await res.json();
        const aiMsg: ChatMessage = {
          id: `ai-opener-${currentStage}-${Date.now()}`,
          role: 'ai',
          content: data.aiMessage,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch {
        // silently handle
      } finally {
        setIsAiTyping(false);
        inputRef.current?.focus();
      }
    };

    requestOpener();
  }, [currentStage, isLoading, requestInfo]);

  // Send user message
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isAiTyping || stageComplete) return;

    setInput('');
    setError('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsAiTyping(true);

    try {
      const res = await fetch('/api/intake/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          stage: currentStage,
          message: trimmed,
          slotFillState,
          isStageOpener: false,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'AI response failed');
        return;
      }

      const data = await res.json();

      if (data.slot_fill_update && Object.keys(data.slot_fill_update).length > 0) {
        setSlotFillState((prev) => ({ ...prev, ...data.slot_fill_update }));
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: data.aiMessage,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      if (data.stage_complete) {
        setStageComplete(true);
      }
    } catch {
      setError('Failed to get AI response. Please try again.');
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleNextStage = async () => {
    const isLastStage = currentStage === INTAKE_STAGES.length;
    if (isLastStage) {
      setIsSubmitting(true);
      setError('');
      try {
        const res = await fetch('/api/intake/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? 'Submission failed. Please try again.');
          setIsSubmitting(false);
          return;
        }
        setReviewData(data as ReviewData);
        setTimeout(() => router.push(`/requests/${requestId}`), 3000);
      } catch {
        setError('Network error during submission. Please try again.');
        setIsSubmitting(false);
      }
      return;
    }

    setCompletedStages((prev) => new Set([...prev, currentStage]));
    setStageComplete(false);
    setCurrentStage((s) => s + 1);
  };

  const handleSaveAndExit = () => {
    router.push('/my-requests');
  };



  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[#6b7280] text-sm font-medium">Loading intake wizard…</p>
        </div>
      </div>
    );
  }

  if (error && !requestInfo) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center p-4">
        <div className="text-center max-w-sm space-y-4">
          <p className="text-rose-400 text-sm bg-rose-500/10 px-6 py-4 rounded-2xl border border-rose-500/30 font-medium">
            {error}
          </p>
          <button
            onClick={() => router.push('/my-requests')}
            className="text-[#818cf8] text-xs font-bold hover:underline"
          >
            ← Return to My Requests
          </button>
        </div>
      </div>
    );
  }

  const currentStageName =
    INTAKE_STAGES.find((s) => s.id === currentStage)?.name ?? `Stage ${currentStage}`;
  const currentStageIcon =
    INTAKE_STAGES.find((s) => s.id === currentStage)?.icon ?? '💬';
  const isLastStage = currentStage === INTAKE_STAGES.length;

  return (
    <div className="min-h-screen bg-[#0a0a12] text-[#e0e0e0] flex flex-col font-sans">
      {isSubmitting && !reviewData && <SubmittingOverlay />}

      {/* Top Header */}
      <header className="bg-[#0f0f1e] border-b border-[#1e1e3a] px-4 sm:px-6 py-3.5 flex items-center justify-between flex-shrink-0 overflow-hidden">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleSaveAndExit}
            className="p-1.5 rounded-xl hover:bg-[#1a1a2e] text-[#9ca3af] transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white truncate">
              {requestInfo?.title ?? 'Intake Assessment'}
            </h1>
            <p className="text-[11px] font-semibold text-[#6b7280]">
              {requestInfo?.department} • Draft Proposal
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveAndExit}
          className="flex-shrink-0 text-xs font-bold text-[#9ca3af] hover:text-white border border-[#2a2a4e] px-3.5 py-1.5 rounded-xl hover:bg-[#1a1a2e] transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Save className="h-3.5 w-3.5" /> Save & Exit
        </button>
      </header>

      {/* Stage Stepper Progress */}
      <StageProgressBar currentStage={currentStage} completedStages={completedStages} />

      {/* Stage Label */}
      <div className="px-4 sm:px-6 pt-4 pb-2 flex-shrink-0">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-[#818cf8] text-xs font-bold uppercase tracking-wider">
              Stage {currentStage} of {INTAKE_STAGES.length}
            </span>
            <h2 className="text-base font-bold text-white mt-0.5">
              {currentStageIcon} {currentStageName}
            </h2>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        <div className="max-w-2xl mx-auto">
          {messages.length === 0 && !isAiTyping && (
            <div className="text-center py-12 text-[#4b5563]">
              <p className="text-3xl mb-3">💬</p>
              <p className="text-xs font-medium">Starting intake session…</p>
            </div>
          )}

          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}

          {isAiTyping && <TypingIndicator />}

          {/* Review Summary Card */}
          {reviewData && (
            <div className="mb-4">
              <div className="mx-4 mb-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                <p className="text-emerald-300 font-bold text-sm">✅ Request Submitted Successfully!</p>
                <p className="text-[#9ca3af] text-xs mt-1 font-medium">Redirecting to proposal details…</p>
              </div>
              <ReviewSummaryCard data={reviewData} requestTitle={requestInfo?.title ?? 'Your Request'} />
            </div>
          )}

          {stageComplete && !isAiTyping && !reviewData && (
            <StageCompleteBanner
              stageName={currentStageName}
              onNext={handleNextStage}
              isLastStage={isLastStage}
              isSubmitting={isSubmitting}
            />
          )}

          {isLastStage && !stageComplete && !reviewData && messages.length > 0 && (
            <div className="mx-4 mb-4 p-3.5 rounded-2xl bg-[#1a1a2e] border border-[#2a2a4e] text-xs text-[#6b7280] font-medium text-center">
              💡 Complete this final question and click Submit to run full AI ROI analysis.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold text-center">
              {error}
              <button className="ml-2 underline cursor-pointer" onClick={() => setError('')}>Dismiss</button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-[#1e1e3a] bg-[#0f0f1e] px-4 sm:px-6 py-4 flex-shrink-0">
        <div className="max-w-2xl mx-auto">
          {stageComplete ? (
            <div className="text-center">
              <p className="text-[#6b7280] text-xs font-medium">
                Click the button above to proceed to the next stage.
              </p>
            </div>
          ) : (
            <div className="flex gap-3 items-end">
              {/* + button (and chips stacked above it, inside FileUpload) */}
              <FileUpload disabled={isAiTyping} />

              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isAiTyping}
                placeholder={
                  isAiTyping
                    ? 'CogniFlow AI is processing…'
                    : 'Type your answer… (Enter to send, Shift+Enter for new line)'
                }
                rows={1}
                className="flex-1 bg-[#1a1a2e] border border-[#2a2a4e] rounded-2xl px-4 py-3 text-[#e0e0e0] placeholder-[#4b5563] text-xs sm:text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-[#6366f1] disabled:opacity-50 transition-all max-h-32 overflow-y-auto"
                style={{ minHeight: '46px' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isAiTyping}
                className="flex-shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5558e0] hover:to-[#7c4fdb] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shadow-md shadow-[#6366f1]/20 cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

