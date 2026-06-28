'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEPARTMENTS } from '@/constants';

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

  const handleDepartmentSelect = (dept: string) => {
    setSelectedDept(dept);
    setStep('title');
  };

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
    <div className="min-h-screen bg-[#0a0a12] text-[#e0e0e0]">
      {/* Header */}
      <div className="border-b border-[#1e1e3a] bg-[#0f0f1e]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-[#6b7280] hover:text-[#e0e0e0] transition-colors text-sm flex items-center gap-1"
          >
            ← Back
          </button>
          <span className="text-[#2a2a4e]">|</span>
          <h1 className="text-lg font-semibold text-[#e0e0e0]">New Automation Request</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {step === 'department' ? (
          <>
            {/* Department selection */}
            <div className="text-center mb-10">
              <div className="text-4xl mb-4">🚀</div>
              <h2 className="text-3xl font-bold text-white mb-3">
                Submit an Automation Idea
              </h2>
              <p className="text-[#9ca3af] text-lg max-w-xl mx-auto">
                Our AI will guide you through a short interview to capture everything engineering
                needs to evaluate and prioritize your request.
              </p>
            </div>

            <p className="text-sm font-semibold text-[#6366f1] uppercase tracking-widest mb-5 text-center">
              Step 1 of 2 — Select your department
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept}
                  onClick={() => handleDepartmentSelect(dept)}
                  className={`
                    flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200
                    text-center cursor-pointer group
                    ${
                      selectedDept === dept
                        ? 'border-[#6366f1] bg-[#6366f1]/10 text-white'
                        : 'border-[#1e1e3a] bg-[#0f0f1e] text-[#9ca3af] hover:border-[#6366f1]/50 hover:bg-[#1a1a2e] hover:text-white'
                    }
                  `}
                >
                  <span className="text-2xl">{DEPARTMENT_ICONS[dept]}</span>
                  <span className="text-xs font-medium leading-tight">{dept}</span>
                </button>
              ))}
            </div>

            {selectedDept && (
              <div className="mt-8 p-5 rounded-xl bg-[#1a1a2e] border border-[#2a2a4e]">
                <p className="text-sm text-[#6b7280]">Selected department focus:</p>
                <p className="text-[#e0e0e0] font-medium mt-1">
                  {DEPARTMENT_ICONS[selectedDept]} {selectedDept} —{' '}
                  <span className="text-[#9ca3af] font-normal">
                    {DEPARTMENT_DESCRIPTIONS[selectedDept]}
                  </span>
                </p>
                <button
                  onClick={() => setStep('title')}
                  className="mt-4 px-6 py-2.5 rounded-lg bg-[#6366f1] hover:bg-[#5558e0] text-white text-sm font-medium transition-colors"
                >
                  Continue →
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Title entry */}
            <div className="max-w-xl mx-auto">
              <button
                onClick={() => setStep('department')}
                className="text-[#6b7280] hover:text-[#e0e0e0] transition-colors text-sm flex items-center gap-1 mb-8"
              >
                ← Change department
              </button>

              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1a2e] border border-[#2a2a4e] text-sm text-[#9ca3af] mb-6">
                  {DEPARTMENT_ICONS[selectedDept!]} {selectedDept}
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Give your idea a title
                </h2>
                <p className="text-[#9ca3af] text-sm">
                  A short, descriptive name for the process you want to automate.
                </p>
              </div>

              <p className="text-sm font-semibold text-[#6366f1] uppercase tracking-widest mb-5 text-center">
                Step 2 of 2 — Name your request
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                    Request title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && title.trim()) handleStart();
                    }}
                    placeholder={`e.g. Automate ${selectedDept} report generation`}
                    autoFocus
                    className="
                      w-full bg-[#0f0f1e] border border-[#2a2a4e] rounded-xl px-4 py-3
                      text-[#e0e0e0] placeholder-[#4b5563] text-sm
                      focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-transparent
                      transition-all
                    "
                  />
                  <p className="text-xs text-[#6b7280] mt-1.5">
                    Don&apos;t worry about making it perfect — you can refine it during the interview.
                  </p>
                </div>

                {error && (
                  <p className="text-red-400 text-sm bg-red-400/10 px-4 py-3 rounded-lg border border-red-400/20">
                    {error}
                  </p>
                )}

                <button
                  onClick={handleStart}
                  disabled={!title.trim() || isCreating}
                  className="
                    w-full py-3 px-6 rounded-xl font-semibold text-sm
                    bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]
                    hover:from-[#5558e0] hover:to-[#7c4fdb]
                    disabled:opacity-50 disabled:cursor-not-allowed
                    text-white transition-all duration-200
                    flex items-center justify-center gap-2
                  "
                >
                  {isCreating ? (
                    <>
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      Creating…
                    </>
                  ) : (
                    <>Start AI Intake Interview →</>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
