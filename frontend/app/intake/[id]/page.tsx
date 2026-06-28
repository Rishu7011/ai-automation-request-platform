'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { INTAKE_STAGES } from '@/constants';

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
    <div className="flex items-center gap-1 px-4 py-3 border-b border-[#1e1e3a] overflow-x-auto scrollbar-hide">
      {INTAKE_STAGES.map((stage, idx) => {
        const isCompleted = completedStages.has(stage.id);
        const isCurrent = stage.id === currentStage;
        const isFuture = stage.id > currentStage && !completedStages.has(stage.id);

        return (
          <div key={stage.id} className="flex items-center flex-shrink-0">
            {idx > 0 && (
              <div
                className={`w-6 h-0.5 mx-0.5 ${
                  isCompleted || (idx < currentStage - 1)
                    ? 'bg-[#6366f1]'
                    : 'bg-[#1e1e3a]'
                }`}
              />
            )}
            <div
              title={stage.name}
              className={`
                flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all
                ${
                  isCompleted
                    ? 'bg-[#6366f1]/20 text-[#6366f1] border border-[#6366f1]/40'
                    : isCurrent
                    ? 'bg-[#6366f1] text-white shadow-lg shadow-[#6366f1]/30'
                    : isFuture
                    ? 'bg-[#1a1a2e] text-[#4b5563] border border-[#1e1e3a]'
                    : 'bg-[#1a1a2e] text-[#4b5563] border border-[#1e1e3a]'
                }
              `}
            >
              <span>{isCompleted ? '✓' : stage.icon}</span>
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
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      {/* Avatar */}
      <div
        className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm
          ${isUser ? 'bg-[#6366f1] text-white' : 'bg-[#1a1a2e] border border-[#2a2a4e] text-[#9ca3af]'}
        `}
      >
        {isUser ? '👤' : '🤖'}
      </div>

      {/* Bubble */}
      <div
        className={`
          max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${
            isUser
              ? 'bg-[#6366f1] text-white rounded-tr-sm'
              : 'bg-[#1a1a2e] border border-[#2a2a4e] text-[#d1d5db] rounded-tl-sm'
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
    <div className="flex gap-3 mb-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1a1a2e] border border-[#2a2a4e] flex items-center justify-center text-sm">
        🤖
      </div>
      <div className="bg-[#1a1a2e] border border-[#2a2a4e] px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#6366f1] animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 rounded-full bg-[#6366f1] animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 rounded-full bg-[#6366f1] animate-bounce [animation-delay:300ms]" />
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
    <div className="mx-4 mb-4 p-4 rounded-xl bg-[#6366f1]/10 border border-[#6366f1]/30 text-center">
      <p className="text-[#6366f1] font-semibold text-sm mb-1">
        ✅ {stageName} complete
      </p>
      <p className="text-[#9ca3af] text-xs mb-3">
        {isLastStage
          ? 'Ready to submit your request.'
          : 'Great job! Ready to move to the next section?'}
      </p>
      <button
        onClick={onNext}
        disabled={isSubmitting}
        className="px-5 py-2 rounded-lg bg-[#6366f1] hover:bg-[#5558e0] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
      >
        {isLastStage
          ? isSubmitting
            ? '⏳ Processing…'
            : '📤 Submit Request'
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 bg-[#0a0a12]/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#0f0f1e] border border-[#2a2a4e] rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
        <div className="w-14 h-14 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto mb-5" />
        <h3 className="text-white font-semibold text-base mb-2">Running AI Analysis</h3>
        <p className="text-[#9ca3af] text-sm mb-5">
          Our AI agents are processing your request. This takes 20–40 seconds.
        </p>
        <div className="bg-[#1a1a2e] rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-lg flex-shrink-0">{steps[stepIdx].icon}</span>
          <span className="text-[#d1d5db] text-sm text-left">{steps[stepIdx].text}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Review Summary Card (Stage 8) ───────────────────────────────────────────

function ConfidenceBadge({ level }: { level: string }) {
  const map: Record<string, { color: string; label: string }> = {
    HIGH:   { color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30', label: '🟢 High' },
    MEDIUM: { color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',   label: '🟡 Medium' },
    LOW:    { color: 'text-red-400 bg-red-400/10 border-red-400/30',             label: '🔴 Low' },
  };
  const cfg = map[level.toUpperCase()] ?? map.LOW;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
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
    <div className="mx-4 mb-4 space-y-3">
      {/* Header */}
      <div className="p-4 rounded-xl bg-[#6366f1]/10 border border-[#6366f1]/30">
        <p className="text-[#6366f1] font-semibold text-xs uppercase tracking-widest mb-1">Review Summary</p>
        <p className="text-white font-medium text-sm">{requestTitle}</p>
        <p className="text-[#9ca3af] text-xs mt-1">{data.narratives.requester}</p>
      </div>

      {/* ROI & Effort */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-[#1a1a2e] border border-[#2a2a4e]">
          <p className="text-[#6b7280] text-xs mb-1">Annual Savings</p>
          <p className="text-white font-bold text-lg">{fmt(data.estimate.annualDollarsSaved)}</p>
          <p className="text-[#9ca3af] text-xs">{data.estimate.annualHoursSaved.toLocaleString()} hrs saved</p>
          <div className="mt-2">
            <ConfidenceBadge level={data.roiConfidence} />
          </div>
        </div>
        <div className="p-3 rounded-xl bg-[#1a1a2e] border border-[#2a2a4e]">
          <p className="text-[#6b7280] text-xs mb-1">Effort Estimate</p>
          <p className="text-white font-bold text-lg">{data.estimate.effortSize}</p>
          <p className="text-[#9ca3af] text-xs">Build cost ~{fmt(data.estimate.buildCostMid)}</p>
          <p className="text-[#9ca3af] text-xs">ROI: {roiLabel}</p>
        </div>
      </div>

      {/* Priority Score */}
      <div className="p-3 rounded-xl bg-[#1a1a2e] border border-[#2a2a4e] flex items-center justify-between">
        <div>
          <p className="text-[#6b7280] text-xs mb-0.5">Priority Score</p>
          <p className="text-white font-bold text-2xl">{data.priorityScore}<span className="text-[#6b7280] text-sm font-normal">/100</span></p>
        </div>
        <div className="text-right">
          <p className="text-[#6b7280] text-xs mb-0.5">Type</p>
          <p className="text-[#d1d5db] text-xs font-medium">{data.categorization.automationType}</p>
        </div>
      </div>

      {/* Tags */}
      {data.categorization.systemsTouched.length > 0 && (
        <div className="p-3 rounded-xl bg-[#1a1a2e] border border-[#2a2a4e]">
          <p className="text-[#6b7280] text-xs mb-2">Systems Involved</p>
          <div className="flex flex-wrap gap-1.5">
            {data.categorization.systemsTouched.map((s) => (
              <span key={s} className="text-xs bg-[#2a2a4e] text-[#d1d5db] px-2 py-0.5 rounded-md">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Risk Flags */}
      {data.estimate.riskFlags.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-400/5 border border-amber-400/20">
          <p className="text-amber-400 text-xs font-medium mb-2">⚠️ Risk Flags</p>
          <ul className="space-y-1">
            {data.estimate.riskFlags.map((r) => (
              <li key={r} className="text-[#d1d5db] text-xs">• {r}</li>
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

  // ── Load existing conversation on mount ──
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

        // Reconstruct messages
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

          // Determine current stage from last turn
          const lastTurn = data.turns[data.turns.length - 1];
          const lastStage = lastTurn.stage ?? 1;
          setCurrentStage(lastStage);

          // Mark all stages before lastStage as completed (rough heuristic)
          // A more precise approach would be to track stage_complete events
          const completed = new Set<number>();
          for (let s = 1; s < lastStage; s++) {
            completed.add(s);
          }
          setCompletedStages(completed);

          // Mark opener as already called for this stage
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

  // ── Request stage opener from AI when entering a new stage ──
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
        // silently handle — user can still type
      } finally {
        setIsAiTyping(false);
        inputRef.current?.focus();
      }
    };

    requestOpener();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStage, isLoading, requestInfo]);

  // ── Send user message ──
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

      // Merge slot fill update
      if (data.slot_fill_update && Object.keys(data.slot_fill_update).length > 0) {
        setSlotFillState((prev) => ({ ...prev, ...data.slot_fill_update }));
      }

      // Add AI message
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: data.aiMessage,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Stage complete?
      if (data.stage_complete) {
        setStageComplete(true);
      }
    } catch {
      setError('Failed to get AI response. Please try again.');
    } finally {
      setIsAiTyping(false);
    }
  };

  // ── Advance to next stage (or submit on last stage) ──
  const handleNextStage = async () => {
    const isLastStage = currentStage === INTAKE_STAGES.length;
    if (isLastStage) {
      // Task 2.12 — run the full agent pipeline
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
        // Show review data briefly then redirect
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

  // ── Save & exit ──
  const handleSaveAndExit = () => {
    router.push('/my-requests');
  };

  // ── Enter key to send (Shift+Enter for newline) ──
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Render ──

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#9ca3af] text-sm">Loading your interview…</p>
        </div>
      </div>
    );
  }

  if (error && !requestInfo) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
        <div className="text-center max-w-sm">
          <p className="text-red-400 text-sm bg-red-400/10 px-6 py-4 rounded-xl border border-red-400/20">
            {error}
          </p>
          <button
            onClick={() => router.push('/my-requests')}
            className="mt-4 text-[#6366f1] text-sm hover:underline"
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
    <div className="min-h-screen bg-[#0a0a12] text-[#e0e0e0] flex flex-col">
      {/* Submission processing overlay */}
      {isSubmitting && !reviewData && <SubmittingOverlay />}
      {/* ── Top Header ── */}
      <div className="border-b border-[#1e1e3a] bg-[#0f0f1e]/80 backdrop-blur-md px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleSaveAndExit}
            className="text-[#6b7280] hover:text-[#e0e0e0] transition-colors text-sm flex-shrink-0"
          >
            ← 
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-white truncate">
              {requestInfo?.title ?? 'Intake Interview'}
            </h1>
            <p className="text-xs text-[#6b7280]">
              {requestInfo?.department} · Draft
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveAndExit}
          className="flex-shrink-0 text-xs text-[#6b7280] hover:text-[#e0e0e0] transition-colors border border-[#2a2a4e] px-3 py-1.5 rounded-lg hover:border-[#6366f1]/40"
        >
          💾 Save & Exit
        </button>
      </div>

      {/* ── Stage Progress ── */}
      <StageProgressBar currentStage={currentStage} completedStages={completedStages} />

      {/* ── Stage Label ── */}
      <div className="px-6 pt-4 pb-2 flex-shrink-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-[#6366f1] text-xs font-semibold uppercase tracking-widest">
              Stage {currentStage} of {INTAKE_STAGES.length}
            </span>
          </div>
          <h2 className="text-base font-semibold text-white mt-0.5">
            {currentStageIcon} {currentStageName}
          </h2>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-2xl mx-auto">
          {messages.length === 0 && !isAiTyping && (
            <div className="text-center py-12 text-[#4b5563]">
              <p className="text-3xl mb-3">💬</p>
              <p className="text-sm">Starting your interview…</p>
            </div>
          )}

          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}

          {isAiTyping && <TypingIndicator />}

          {/* Stage 8 Review Card — shown after submission completes */}
          {reviewData && (
            <div className="mb-4">
              <div className="mx-4 mb-3 p-3 rounded-xl bg-emerald-400/10 border border-emerald-400/30 text-center">
                <p className="text-emerald-400 font-semibold text-sm">✅ Request Submitted Successfully!</p>
                <p className="text-[#9ca3af] text-xs mt-1">Redirecting to your request…</p>
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

          {/* Stage 8 Review Card shown inline while still chatting */}
          {isLastStage && !stageComplete && !reviewData && messages.length > 0 && (
            <div className="mx-4 mb-4 p-3 rounded-xl bg-[#1a1a2e] border border-[#2a2a4e] text-xs text-[#6b7280] text-center">
              💡 When you are ready, complete this section and click Submit to run the AI analysis.
            </div>
          )}

          {error && (
            <div className="mx-0 mb-4 p-3 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-sm text-center">
              {error}
              <button
                className="ml-2 underline"
                onClick={() => setError('')}
              >
                Dismiss
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Input Area ── */}
      <div className="border-t border-[#1e1e3a] bg-[#0f0f1e]/80 backdrop-blur-md px-6 py-4 flex-shrink-0">
        <div className="max-w-2xl mx-auto">
          {stageComplete ? (
            <div className="text-center">
              <p className="text-[#6b7280] text-sm">
                Use the button above to continue to the next section.
              </p>
            </div>
          ) : (
            <div className="flex gap-3 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isAiTyping}
                placeholder={
                  isAiTyping
                    ? 'AI is thinking…'
                    : 'Type your answer here… (Enter to send, Shift+Enter for new line)'
                }
                rows={1}
                className="
                  flex-1 bg-[#1a1a2e] border border-[#2a2a4e] rounded-xl px-4 py-3
                  text-[#e0e0e0] placeholder-[#4b5563] text-sm resize-none
                  focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-transparent
                  disabled:opacity-50 transition-all
                  max-h-32 overflow-y-auto
                "
                style={{ minHeight: '48px' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isAiTyping}
                className="
                  flex-shrink-0 w-11 h-11 rounded-xl
                  bg-gradient-to-br from-[#6366f1] to-[#8b5cf6]
                  hover:from-[#5558e0] hover:to-[#7c4fdb]
                  disabled:opacity-40 disabled:cursor-not-allowed
                  flex items-center justify-center text-white
                  transition-all duration-200
                "
              >
                ↑
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
