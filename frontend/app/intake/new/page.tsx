'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DEPARTMENTS } from '@/constants';
import { ArrowLeft, Rocket, ArrowRight, Sparkles, Loader2 } from 'lucide-react';

const DEPARTMENT_ICONS: Record<string, string> = {
  Recruitment: '🤝', HR: '🧑‍💼', Finance: '💵', Compliance: '⚖️',
  IT: '💻', Operations: '⚙️', Engineering: '🔧', Legal: '📜',
  Sales: '📈', Marketing: '🎯',
};

const DEPARTMENT_DESCRIPTIONS: Record<string, string> = {
  Recruitment: 'Candidate screening, ATS workflows, time-to-fill automation',
  HR: 'Onboarding, offboarding, benefits, HRIS integration',
  Finance: 'Invoice matching, reconciliation, approval chains',
  Compliance: 'Audit trails, regulatory filing, data retention',
  IT: 'Ticket routing, access provisioning, script automation',
  Operations: 'Throughput, SLA tracking, vendor/logistics workflows',
  Engineering: 'Internal tooling, CI/CD, infra automation',
  Legal: 'Contract review, turnaround time, template standardization',
  Sales: 'CRM updates, quote generation, deal-stage bottlenecks',
  Marketing: 'Campaign workflows, content approvals, reporting',
};

export default function NewIntakePage() {
  const router = useRouter();
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'department' | 'title'>('department');

  const handleStart = async () => {
    if (!selectedDept || !title.trim()) return;
    setIsCreating(true);
    setError('');
    try {
      const res = await fetch('/api/intake/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department: selectedDept, title: title.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to create request');
        return;
      }
      const { requestId } = await res.json();
      router.push(`/intake/${requestId}`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-[#e0e0e0] font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => (step === 'title' ? setStep('department') : router.back())}
              className="p-2 rounded-xl bg-[#1a1a2e] border border-[#2a2a4e] text-[#9ca3af] hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-base font-bold text-white">New Automation Proposal</h1>
              <p className="text-[11px] text-[#6b7280] font-medium">
                {step === 'department' ? 'Step 1 of 2 — Select department' : 'Step 2 of 2 — Name your proposal'}
              </p>
            </div>
          </div>
          <Link href="/my-requests" className="text-xs font-bold text-[#6b7280] hover:text-[#818cf8] transition-colors">
            Cancel
          </Link>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-[#1a1a2e] rounded-full mb-10">
          <div
            className="h-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-full transition-all duration-500"
            style={{ width: step === 'department' ? '50%' : '100%' }}
          />
        </div>

        {step === 'department' ? (
          <div className="space-y-8">
            {/* Intro */}
            <div className="text-center max-w-xl mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#6366f1]/15 border border-[#6366f1]/25 text-[#818cf8] flex items-center justify-center mx-auto">
                <Rocket className="h-6 w-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Submit an Automation Idea
              </h2>
              <p className="text-[#9ca3af] text-sm leading-relaxed">
                Our AI will guide you through a structured intake to calculate ROI, engineering effort, and priority tier.
              </p>
            </div>

            {/* Department grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {DEPARTMENTS.map((dept) => {
                const isSelected = selectedDept === dept;
                return (
                  <button
                    key={dept}
                    onClick={() => { setSelectedDept(dept); setStep('title'); }}
                    className={`flex flex-col items-center gap-2.5 p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group ${
                      isSelected
                        ? 'border-[#6366f1] bg-[#6366f1]/10 ring-2 ring-[#6366f1]/20'
                        : 'border-[#1e1e3a] bg-[#0f0f1e] hover:border-[#6366f1]/50 hover:bg-[#1a1a2e]'
                    }`}
                  >
                    <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform">
                      {DEPARTMENT_ICONS[dept]}
                    </span>
                    <span className="text-xs font-bold text-[#d1d5db]">{dept}</span>
                  </button>
                );
              })}
            </div>

            {/* Selected dept info */}
            {selectedDept && (
              <div className="p-5 rounded-2xl bg-[#0f0f1e] border border-[#6366f1]/30 max-w-xl mx-auto space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{DEPARTMENT_ICONS[selectedDept]}</span>
                  <div>
                    <p className="text-xs font-bold text-[#6b7280] uppercase tracking-wider">Selected</p>
                    <p className="text-sm font-bold text-white mt-0.5">{selectedDept}</p>
                    <p className="text-xs text-[#6b7280] font-medium mt-1">
                      {DEPARTMENT_DESCRIPTIONS[selectedDept]}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setStep('title')}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5558e0] hover:to-[#7c4fdb] text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Continue to Title <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-md mx-auto space-y-6">
            {/* Selected dept badge */}
            <div className="flex justify-center">
              <button
                onClick={() => setStep('department')}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#6366f1]/15 border border-[#6366f1]/30 text-xs font-bold text-[#818cf8] hover:bg-[#6366f1]/25 transition-colors cursor-pointer"
              >
                <span>{DEPARTMENT_ICONS[selectedDept!]}</span>
                <span>{selectedDept}</span>
                <span className="text-[#4b5563] text-[10px]">← change</span>
              </button>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Name Your Proposal
              </h2>
              <p className="text-[#9ca3af] text-xs font-medium">
                A concise title describing the manual process or workflow bottleneck.
              </p>
            </div>

            <div className="bg-[#0f0f1e] border border-[#1e1e3a] p-6 rounded-2xl space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b7280] mb-2">
                  Request Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && title.trim()) handleStart(); }}
                  placeholder={`e.g. Automated ${selectedDept} Invoice Matching`}
                  autoFocus
                  className="w-full bg-[#0a0a12] border border-[#2a2a4e] rounded-xl px-4 py-3 text-[#e0e0e0] placeholder-[#4b5563] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-[#6366f1] transition-all"
                />
                <p className="text-[11px] text-[#4b5563] font-medium mt-1.5">
                  You can refine the details with AI during the intake interview.
                </p>
              </div>

              {error && (
                <p className="text-rose-400 text-xs bg-rose-500/10 px-4 py-3 rounded-xl border border-rose-500/30 font-bold">
                  {error}
                </p>
              )}

              <button
                onClick={handleStart}
                disabled={!title.trim() || isCreating}
                className="w-full py-3 px-6 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5558e0] hover:to-[#7c4fdb] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#6366f1]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isCreating ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /><span>Creating Proposal…</span></>
                ) : (
                  <><span>Start AI Intake Assessment</span><Sparkles className="h-4 w-4" /></>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
