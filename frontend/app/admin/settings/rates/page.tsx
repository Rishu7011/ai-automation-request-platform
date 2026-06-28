'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DEPARTMENTS } from '@/constants';

const DEFAULT_RATES: Record<string, number> = {
  Recruitment: 45,
  HR: 45,
  Finance: 55,
  Compliance: 65,
  IT: 60,
  Operations: 50,
  Engineering: 75,
  Legal: 85,
  Sales: 50,
  Marketing: 45,
};

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

export default function AdminBlendedRatesPage() {
  const [rates, setRates] = useState<Record<string, number>>(DEFAULT_RATES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadRates() {
      try {
        const res = await fetch('/api/admin/settings/system?key=blendedRates');
        if (res.ok) {
          const data = await res.json();
          if (data.setting?.value) {
            setRates(data.setting.value as Record<string, number>);
          }
        }
      } catch {
        setError('Failed to load blended rates configuration.');
      } finally {
        setIsLoading(false);
      }
    }
    loadRates();
  }, []);

  const handleChange = (dept: string, val: number) => {
    setRates((prev) => ({
      ...prev,
      [dept]: Math.max(0, val),
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
        body: JSON.stringify({ key: 'blendedRates', value: rates }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save configuration.');
      } else {
        setMessage('✅ Department blended rates updated successfully!');
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
            <h1 className="text-xl font-bold text-white tracking-tight">💵 Blended Hourly Rates Config</h1>
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
              className="text-xs text-[#9ca3af] hover:text-white px-3 py-1.5 rounded-lg border border-[#2a2a4e] transition-colors"
            >
              ⏱️ Effort
            </Link>
            <Link
              href="/admin/settings/rates"
              className="text-xs text-white bg-[#6366f1] px-3 py-1.5 rounded-lg font-semibold transition-colors"
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
        {/* Header */}
        <div className="mb-8 p-6 rounded-2xl bg-[#0f0f1e] border border-[#1e1e3a]">
          <h2 className="text-base font-semibold text-white mb-1">Departmental Blended Hourly Rates ($/hr)</h2>
          <p className="text-xs text-[#9ca3af]">
            Configure the baseline blended hourly labor cost for each department.
            These figures are used in ROI calculations to convert hours saved into annual dollar savings ($).
          </p>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#9ca3af] text-sm">Loading rate configurations…</p>
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
              {DEPARTMENTS.map((dept) => {
                const icon = DEPARTMENT_ICONS[dept] || '💼';
                const rateVal = rates[dept] ?? DEFAULT_RATES[dept] ?? 50;

                return (
                  <div
                    key={dept}
                    className="p-5 rounded-2xl bg-[#0f0f1e] border border-[#1e1e3a] flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{icon}</span>
                      <div>
                        <p className="text-sm font-bold text-white">{dept}</p>
                        <p className="text-[11px] text-[#6b7280]">Blended labor cost</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#9ca3af] font-mono">$</span>
                      <input
                        type="number"
                        value={rateVal}
                        onChange={(e) => handleChange(dept, parseInt(e.target.value, 10) || 0)}
                        className="w-24 bg-[#1a1a2e] border border-[#2a2a4e] rounded-xl px-3 py-2 text-xs font-mono font-bold text-white text-right focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                      />
                      <span className="text-xs text-[#6b7280] font-mono">/hr</span>
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
                    Saving Rates…
                  </>
                ) : (
                  <>💾 Save Rates Configuration</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
