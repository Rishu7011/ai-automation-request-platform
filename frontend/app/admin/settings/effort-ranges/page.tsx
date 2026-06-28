'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface EffortRange {
  min: number;
  max: number;
}

interface EffortRangesState {
  S: EffortRange;
  M: EffortRange;
  L: EffortRange;
  XL: EffortRange;
}

const DEFAULT_RANGES: EffortRangesState = {
  S: { min: 20, max: 40 },
  M: { min: 40, max: 100 },
  L: { min: 100, max: 250 },
  XL: { min: 250, max: 500 },
};

export default function AdminEffortRangesPage() {
  const [ranges, setRanges] = useState<EffortRangesState>(DEFAULT_RANGES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadEffortRanges() {
      try {
        const res = await fetch('/api/admin/settings/system?key=effortRanges');
        if (res.ok) {
          const data = await res.json();
          if (data.setting?.value) {
            setRanges(data.setting.value as EffortRangesState);
          }
        }
      } catch {
        setError('Failed to load effort ranges configuration.');
      } finally {
        setIsLoading(false);
      }
    }
    loadEffortRanges();
  }, []);

  const handleChange = (size: keyof EffortRangesState, bound: 'min' | 'max', val: number) => {
    setRanges((prev) => ({
      ...prev,
      [size]: {
        ...prev[size],
        [bound]: Math.max(0, val),
      },
    }));
    setMessage('');
    setError('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/admin/settings/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'effortRanges', value: ranges }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save configuration.');
      } else {
        setMessage('✅ Effort ranges updated successfully!');
      }
    } catch {
      setError('An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-[#e0e0e0]">
      {/* Top Bar */}
      <div className="border-b border-[#1e1e3a] bg-[#0f0f1e]/80 backdrop-blur-md px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white tracking-tight">⏱️ Effort Ranges Config</h1>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <Link
              href="/admin/users"
              className="text-xs text-[#9ca3af] hover:text-white px-3 py-1.5 rounded-lg border border-[#2a2a4e] transition-colors"
            >
              👥 Users
            </Link>
            <Link
              href="/admin/requests"
              className="text-xs text-[#9ca3af] hover:text-white px-3 py-1.5 rounded-lg border border-[#2a2a4e] transition-colors"
            >
              📊 Pipeline
            </Link>
            <Link
              href="/admin/settings/priority-weights"
              className="text-xs text-[#9ca3af] hover:text-white px-3 py-1.5 rounded-lg border border-[#2a2a4e] transition-colors"
            >
              ⚖️ Weights
            </Link>
            <Link
              href="/admin/settings/effort-ranges"
              className="text-xs text-white bg-[#6366f1] px-3 py-1.5 rounded-lg font-semibold transition-colors"
            >
              ⏱️ Effort
            </Link>
            <Link
              href="/admin/settings/rates"
              className="text-xs text-[#9ca3af] hover:text-white px-3 py-1.5 rounded-lg border border-[#2a2a4e] transition-colors"
            >
              💵 Rates
            </Link>
            <Link
              href="/admin/audit-log"
              className="text-xs text-[#9ca3af] hover:text-white px-3 py-1.5 rounded-lg border border-[#2a2a4e] transition-colors"
            >
              📜 Audit Log
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Description Header */}
        <div className="mb-8 p-6 rounded-2xl bg-[#0f0f1e] border border-[#1e1e3a]">
          <h2 className="text-base font-semibold text-white mb-1">T-Shirt Size Engineering Hour Ranges</h2>
          <p className="text-xs text-[#9ca3af]">
            Specify the lower and upper bounds of engineering hours for each T-shirt size (S, M, L, XL).
            These ranges feed into the ROI calculation engine to estimate build cost.
          </p>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#9ca3af] text-sm">Loading effort configurations…</p>
          </div>
        ) : (
          <div className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-sm text-center">
                {error}
              </div>
            )}
            {message && (
              <div className="p-4 rounded-xl bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-sm text-center">
                {message}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { size: 'S', title: 'Small (S)', desc: 'Minor automation or script', badgeColor: 'bg-emerald-500/10 text-emerald-400' },
                { size: 'M', title: 'Medium (M)', desc: 'Standard workflow automation', badgeColor: 'bg-blue-500/10 text-blue-400' },
                { size: 'L', title: 'Large (L)', desc: 'Multi-system integration', badgeColor: 'bg-purple-500/10 text-purple-400' },
                { size: 'XL', title: 'Extra Large (XL)', desc: 'Complex enterprise automation', badgeColor: 'bg-amber-500/10 text-amber-400' },
              ].map((item) => {
                const sizeKey = item.size as keyof EffortRangesState;
                const range = ranges[sizeKey] || DEFAULT_RANGES[sizeKey];

                return (
                  <div key={item.size} className="p-6 rounded-2xl bg-[#0f0f1e] border border-[#1e1e3a]">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-bold text-white">{item.title}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.badgeColor}`}>
                        {range.min} – {range.max} hrs
                      </span>
                    </div>
                    <p className="text-xs text-[#6b7280] mb-4">{item.desc}</p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] text-[#9ca3af] mb-1">Min Hours</label>
                        <input
                          type="number"
                          value={range.min}
                          onChange={(e) => handleChange(sizeKey, 'min', parseInt(e.target.value, 10) || 0)}
                          className="w-full bg-[#1a1a2e] border border-[#2a2a4e] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#9ca3af] mb-1">Max Hours</label>
                        <input
                          type="number"
                          value={range.max}
                          onChange={(e) => handleChange(sizeKey, 'max', parseInt(e.target.value, 10) || 0)}
                          className="w-full bg-[#1a1a2e] border border-[#2a2a4e] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="
                  px-8 py-3 rounded-xl font-bold text-sm text-white
                  bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]
                  hover:from-[#5558e0] hover:to-[#7c4fdb]
                  disabled:opacity-40 disabled:cursor-not-allowed
                  shadow-lg shadow-[#6366f1]/30 transition-all duration-200
                  flex items-center gap-2
                "
              >
                {isSaving ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Saving Ranges…
                  </>
                ) : (
                  <>💾 Save Effort Configuration</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
