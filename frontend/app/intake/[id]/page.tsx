'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { INTAKE_STAGES } from '@/constants';
import FileUpload from '@/components/FileUpload';
import {
  Attachment,
  AttachmentActions,
  AttachmentAction,
  AttachmentContent,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/ui/attachment';
import {
  Send,
  CheckCircle2,
  Bot,
  User,
  Save,
  ArrowLeft,
  AlertTriangle,
  UserIcon,
  FileText,
  X,
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
    <nav className="glass-panel border border-[#464554]/30 rounded-2xl p-4 md:p-5 shadow-sm">
      <div className="relative flex justify-between items-center">
        {/* Connector Line */}
        <div className="absolute top-4 md:top-4.5 left-6 right-6 h-[2px] bg-[#464554]/40 z-0" />
        
        {INTAKE_STAGES.map((stage, idx) => {
          const isCompleted = completedStages.has(stage.id);
          const isCurrent = stage.id === currentStage;

          return (
            <div key={stage.id} className="relative z-10 flex flex-col items-center gap-2 flex-1">
              <div
                className={`
                  w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${
                    isCompleted
                      ? 'bg-[#00a572] text-[#002113] shadow-[0_0_15px_rgba(78,222,163,0.3)]'
                      : isCurrent
                      ? 'bg-[#6366f1] text-white indigo-pulse shadow-[0_0_15px_rgba(99,102,241,0.4)] ring-2 ring-[#c0c1ff]'
                      : 'bg-[#1f1f27] border border-[#464554]/60 text-[#908fa0] font-mono-code'
                  }
                `}
              >
                {isCompleted ? <CheckCircle2 className="h-4 w-4 stroke-[3]" /> : idx + 1}
              </div>
              <span
                className={`text-[10px] md:text-[11px] font-bold uppercase tracking-tighter text-center font-outfit hidden sm:block ${
                  isCompleted
                    ? 'text-[#4edea3]'
                    : isCurrent
                    ? 'text-[#c0c1ff]'
                    : 'text-[#908fa0]'
                }`}
              >
                {stage.name}
              </span>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Chat Bubble ──────────────────────────────────────────────────────────────

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-5`}>
      {/* Avatar */}
      <div
        className={`
          flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shadow-xs font-outfit
          ${isUser ? 'bg-[#6366f1] text-white shadow-md shadow-[#6366f1]/30' : 'bg-[#6366f1]/20 border border-[#8083ff]/40 text-[#c0c1ff] indigo-glow'}
        `}
      >
        {isUser ? <UserIcon className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-[#c0c1ff]" />}
      </div>

      {/* Bubble */}
      <div
        className={`
          max-w-[80%] px-5 py-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed font-inter shadow-sm
          ${
            isUser
              ? 'bg-[#6366f1] text-white rounded-tr-xs font-medium'
              : 'bg-[#1f1f27] border border-[#464554]/40 text-[#e4e1ed] rounded-tl-xs font-normal'
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
      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#6366f1]/20 border border-[#8083ff]/40 text-[#c0c1ff] flex items-center justify-center shadow-xs font-outfit indigo-glow">
        <Bot className="h-4 w-4" />
      </div>
      <div className="glass-panel border border-[#464554]/40 px-5 py-3.5 rounded-2xl rounded-tl-xs flex items-center gap-1.5 shadow-xs">
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
    <div className="mx-4 mb-5 p-5 rounded-xl bg-[#6366f1]/15 border border-[#6366f1]/30 text-center shadow-md shadow-[#6366f1]/10">
      <p className="text-[#c0c1ff] font-bold text-xs font-outfit uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5">
        <CheckCircle2 className="h-4 w-4 text-[#4edea3]" /> {stageName} Section Complete
      </p>
      <p className="text-[#c7c4d7] text-xs mb-4 font-medium">
        {isLastStage
          ? 'Intake assessment complete! Click below to run full AI analysis & submit.'
          : 'Great progress! Ready to proceed to the next requirement stage?'}
      </p>
      <button
        onClick={onNext}
        disabled={isSubmitting}
        className="px-6 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-[#8083ff] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md shadow-[#6366f1]/30 cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
      >
        {isLastStage
          ? isSubmitting
            ? 'Running AI Analysis…'
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
    <div className="fixed inset-0 bg-[#13131b]/80 backdrop-blur-md flex items-center justify-center z-50">
      <div className="glass-panel border border-[#464554]/40 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl space-y-4">
        <div className="w-12 h-12 border-4 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto" />
        <div>
          <h3 className="text-white font-bold font-outfit text-base">Running AI Analysis</h3>
          <p className="text-[#908fa0] text-xs mt-1 font-medium">
            CogniFlow agents are scoring ROI & priority metrics.
          </p>
        </div>
        <div className="bg-[#0d0d15] border border-[#464554]/30 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl flex-shrink-0">{steps[stepIdx].icon}</span>
          <span className="text-[#c7c4d7] text-xs font-semibold text-left">{steps[stepIdx].text}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Review Summary Card ──────────────────────────────────────────────────────

function ConfidenceBadge({ level }: { level: string }) {
  const map: Record<string, { color: string; label: string }> = {
    HIGH:   { color: 'text-[#4edea3] bg-[#00a572]/15 border-[#00a572]/30', label: '🟢 High' },
    MEDIUM: { color: 'text-[#ffb95f] bg-[#ffb95f]/15 border-[#ffb95f]/30', label: '🟡 Medium' },
    LOW:    { color: 'text-[#ffb4ab] bg-[#93000a]/20 border-[#ffb4ab]/30', label: '🔴 Low' },
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
      <div className="p-4 rounded-xl glass-panel border border-[#464554]/30">
        <p className="text-[#c0c1ff] font-bold text-xs uppercase tracking-wider font-outfit mb-1">Review Summary</p>
        <p className="text-white font-bold text-sm font-outfit">{requestTitle}</p>
        <p className="text-[#908fa0] text-xs mt-1 font-medium leading-relaxed">{data.narratives.requester}</p>
      </div>

      {/* ROI & Effort */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl glass-panel border border-[#464554]/30 shadow-xs">
          <p className="text-[#908fa0] text-[10px] font-bold uppercase tracking-wider font-outfit mb-1">Annual Savings</p>
          <p className="text-white font-black font-outfit text-xl">{fmt(data.estimate.annualDollarsSaved)}</p>
          <p className="text-[#908fa0] text-xs font-mono-code mt-0.5">{data.estimate.annualHoursSaved.toLocaleString()} hrs saved</p>
          <div className="mt-2">
            <ConfidenceBadge level={data.roiConfidence} />
          </div>
        </div>
        <div className="p-4 rounded-xl glass-panel border border-[#464554]/30 shadow-xs">
          <p className="text-[#908fa0] text-[10px] font-bold uppercase tracking-wider font-outfit mb-1">Effort Estimate</p>
          <p className="text-white font-black font-outfit text-xl">{data.estimate.effortSize}</p>
          <p className="text-[#908fa0] text-xs font-mono-code mt-0.5">Build cost ~{fmt(data.estimate.buildCostMid)}</p>
          <p className="text-[#4edea3] text-xs font-bold mt-1">ROI: {roiLabel}</p>
        </div>
      </div>

      {/* Priority Score */}
      <div className="p-4 rounded-xl glass-panel border border-[#464554]/30 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-[#908fa0] text-[10px] font-bold uppercase tracking-wider font-outfit mb-0.5">Priority Score</p>
          <p className="text-white font-black font-outfit text-2xl">{data.priorityScore}<span className="text-[#908fa0] text-sm font-normal">/100</span></p>
        </div>
        <div className="text-right">
          <p className="text-[#908fa0] text-[10px] font-bold uppercase tracking-wider font-outfit mb-0.5">Automation Type</p>
          <p className="text-[#c0c1ff] text-xs font-bold">{data.categorization.automationType}</p>
        </div>
      </div>

      {/* Systems Tags */}
      {data.categorization.systemsTouched.length > 0 && (
        <div className="p-4 rounded-xl glass-panel border border-[#464554]/30 shadow-xs">
          <p className="text-[#908fa0] text-[10px] font-bold uppercase tracking-wider font-outfit mb-2">Systems Involved</p>
          <div className="flex flex-wrap gap-2">
            {data.categorization.systemsTouched.map((s) => (
              <span key={s} className="text-xs bg-[#0d0d15] text-[#c7c4d7] font-medium px-3 py-1 rounded-full border border-[#464554]/30">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Risk Flags */}
      {data.estimate.riskFlags.length > 0 && (
        <div className="p-4 rounded-xl bg-[#ffb95f]/15 border border-[#ffb95f]/30">
          <p className="text-[#ffb95f] text-xs font-bold mb-2 flex items-center gap-1 font-outfit">
            <AlertTriangle className="h-3.5 w-3.5 text-[#ffb95f]" /> Risk Flags
          </p>
          <ul className="space-y-1">
            {data.estimate.riskFlags.map((r) => (
              <li key={r} className="text-[#c7c4d7] text-xs font-medium">• {r}</li>
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

  interface StagedFile {
    id: string;
    file: File;
    name: string;
    size: number;
  }

  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);

  const handleFileSelect = useCallback((file: File) => {
    setStagedFiles((prev) => [
      ...prev,
      {
        id: `staged-${Date.now()}-${Math.random()}`,
        file,
        name: file.name,
        size: file.size,
      },
    ]);
  }, []);

  const handleFileRemove = useCallback((id: string) => {
    setStagedFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // Send user message
  const handleSend = async () => {
    const trimmed = input.trim();
    if ((!trimmed && stagedFiles.length === 0) || isAiTyping || stageComplete) return;

    setInput('');
    setError('');
    setIsAiTyping(true);

    let attachmentNotes = '';
    const currentStaged = [...stagedFiles];
    setStagedFiles([]);

    try {
      if (currentStaged.length > 0) {
        const uploadNotes: string[] = [];
        for (const item of currentStaged) {
          const formData = new FormData();
          formData.append('file', item.file);
          formData.append('requestId', requestId);
          formData.append('stage', String(currentStage));

          const res = await fetch('/api/intake/upload', {
            method: 'POST',
            body: formData,
          });

          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error ?? `Upload failed for ${item.name}`);
          }

          const data = await res.json();
          const summary = (data.analysis as { summary?: string } | undefined)?.summary;
          const processInfo = (data.analysis as { extractedProcessInfo?: string } | undefined)?.extractedProcessInfo;
          let note = `📎 Attached file: ${item.name}`;
          if (summary || processInfo) {
            note += `\n[Document Analysis]: ${summary ?? processInfo}`;
          }
          uploadNotes.push(note);
        }
        if (uploadNotes.length > 0) {
          attachmentNotes = uploadNotes.join('\n\n');
        }
      }

      let fullMessage = trimmed;
      if (attachmentNotes) {
        fullMessage = trimmed ? `${trimmed}\n\n${attachmentNotes}` : attachmentNotes;
      }

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: fullMessage,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);

      const res = await fetch('/api/intake/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          stage: currentStage,
          message: fullMessage,
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process request. Please try again.');
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
      <div className="min-h-screen bg-[#13131b] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[#908fa0] text-sm font-medium">Loading intake wizard…</p>
        </div>
      </div>
    );
  }

  if (error && !requestInfo) {
    return (
      <div className="min-h-screen bg-[#13131b] flex items-center justify-center p-4">
        <div className="text-center max-w-sm space-y-4">
          <p className="text-[#ffb4ab] text-sm bg-[#93000a]/20 px-6 py-4 rounded-xl border border-[#ffb4ab]/30 font-medium">
            {error}
          </p>
          <button
            onClick={() => router.push('/my-requests')}
            className="text-[#c0c1ff] text-xs font-bold hover:underline"
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
    <div className="min-h-screen bg-[#13131b] text-[#e4e1ed] flex flex-col font-inter">
      {isSubmitting && !reviewData && <SubmittingOverlay />}

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#1f1f27] border-b border-[#464554]/30 px-4 sm:px-6 py-3.5 flex items-center justify-between flex-shrink-0 shadow-md">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleSaveAndExit}
            className="p-1.5 rounded-lg hover:bg-[#34343d] text-[#908fa0] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-bold font-outfit text-white truncate">
              {requestInfo?.title ?? 'AI Requirement Intake'}
            </h1>
            <p className="text-[11px] font-semibold text-[#908fa0]">
              {requestInfo?.department} Department • AI Intake Session
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveAndExit}
          className="flex-shrink-0 text-xs font-bold text-[#c7c4d7] hover:text-white border border-[#464554]/40 px-3.5 py-1.5 rounded-lg hover:bg-[#34343d] transition-colors flex items-center gap-1.5 cursor-pointer font-outfit"
        >
          <Save className="h-3.5 w-3.5" /> Save & Exit
        </button>
      </header>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 flex flex-col space-y-5">
        
        {/* Stage Stepper Progress */}
        <StageProgressBar currentStage={currentStage} completedStages={completedStages} />

        {/* Stage Label */}
        <div className="flex items-center justify-between px-2 pt-1">
          <div>
            <span className="text-[#c0c1ff] text-xs font-bold uppercase tracking-wider font-outfit">
              Stage {currentStage} of {INTAKE_STAGES.length}
            </span>
            <h2 className="text-base font-bold text-white font-outfit mt-0.5">
              {currentStageIcon} {currentStageName}
            </h2>
          </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto min-h-[350px] max-h-[550px] p-4 glass-panel border border-[#464554]/30 rounded-2xl">
          {messages.length === 0 && !isAiTyping && (
            <div className="text-center py-12 text-[#908fa0]">
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
              <div className="mx-4 mb-3 p-4 rounded-xl bg-[#00a572]/15 border border-[#00a572]/30 text-center">
                <p className="text-[#4edea3] font-bold text-sm font-outfit">✅ Request Submitted Successfully!</p>
                <p className="text-[#908fa0] text-xs mt-1 font-medium">Redirecting to proposal details…</p>
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
            <div className="mx-4 mb-4 p-3.5 rounded-xl bg-[#0d0d15] border border-[#464554]/30 text-xs text-[#908fa0] font-medium text-center">
              💡 Complete this final question and click Submit to run full AI ROI analysis.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-[#93000a]/20 border border-[#ffb4ab]/30 text-[#ffb4ab] text-xs font-bold text-center">
              {error}
              <button className="ml-2 underline cursor-pointer" onClick={() => setError('')}>Dismiss</button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="glass-panel border border-[#464554]/30 rounded-2xl p-4">
          {stageComplete ? (
            <div className="text-center py-1">
              <p className="text-[#908fa0] text-xs font-medium">
                Click the button above to proceed to the next stage.
              </p>
            </div>
          ) : (
            <div className="flex flex-col w-full">
              {/* Staged Attachment Chips (Full Width Row Above Input Controls) */}
              {stagedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-[#464554]/30 w-full">
                  {stagedFiles.map((stg) => (
                    <Attachment
                      key={stg.id}
                      size="xs"
                      state="idle"
                      className="bg-[#1f1f27] border border-[#464554]/40 text-[#e4e1ed] rounded-lg px-2.5 py-1 shadow-sm min-w-0"
                    >
                      <AttachmentMedia className="bg-[#0d0d15] text-[#c0c1ff] w-5 h-5 rounded-md">
                        <FileText className="h-3 w-3 text-[#c0c1ff]" />
                      </AttachmentMedia>
                      <AttachmentContent className="min-w-0 flex-1 px-1">
                        <AttachmentTitle className="text-[#e4e1ed] text-[11px] font-medium truncate block max-w-[160px]">
                          {stg.name}
                        </AttachmentTitle>
                      </AttachmentContent>
                      <AttachmentActions>
                        <AttachmentAction
                          onClick={() => handleFileRemove(stg.id)}
                          aria-label={`Remove ${stg.name}`}
                          className="text-[#908fa0] hover:text-[#ffb4ab] p-0.5 ml-1"
                        >
                          <X className="h-3 w-3" />
                        </AttachmentAction>
                      </AttachmentActions>
                    </Attachment>
                  ))}
                </div>
              )}

              {/* Main Input Control Row */}
              <div className="flex gap-3 items-end w-full">
                <FileUpload
                  disabled={isAiTyping}
                  onFileSelect={handleFileSelect}
                />

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
                  className="flex-1 w-full bg-[#1f1f27] border border-[#464554]/40 rounded-xl px-4 py-3 text-[#e4e1ed] placeholder-[#908fa0] text-xs sm:text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-[#6366f1] disabled:opacity-50 transition-all max-h-32 overflow-y-auto [color-scheme:dark]"
                  style={{ minHeight: '46px' }}
                />
                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && stagedFiles.length === 0) || isAiTyping}
                  className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-[#8083ff] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shadow-md shadow-[#6366f1]/30 active:scale-95 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


