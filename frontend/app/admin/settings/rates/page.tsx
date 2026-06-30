'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DEPARTMENTS } from '@/constants';
import { Save, CheckCircle2 } from 'lucide-react';

const DEFAULT_RATES: Record<string, number> = {
  Recruitment: 45, HR: 45, Finance: 55, Compliance: 65,
  IT: 60, Operations: 50, Engineering: 75, Legal: 85,
  Sales: 50, Marketing: 45,
};

const DEPARTMENT_ICONS: Record<string, string> = {
  Recruitment: '🤝', HR: '🧑‍💼', Finance: '💵', Compliance: '⚖️',
  IT: '💻', Operations: '⚙️', Engineering: '🔧', Legal: '📜',
  Sales: '📈', Marketing: '🎯',
};

const SETTINGS_TABS = [
  { href: '/admin/settings/priority-weights', label: '⚖️ Priority Weights', active: false },
  { href: '/admin/settings/effort-ranges',    label: '⏱️ Effort Ranges',    active: false },
  { href: '/admin/settings/rates',            label: '💵 Blended Rates',    active: true  },
];

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
          if (data.setting?.value) setRates(data.setting.value as Record<string, number>);
        }
      } catch { setError('Failed to load blended rates configuration.'); }
      finally { setIsLoading(false); }
    }
    loadRates();
  }, []);

  const handleChange = (dept: string, val: number) => {
    setRates((prev) => ({ ...prev, [dept]: Math.max(0, val) }));
    setMessage(''); setError('');
  };

  const handleSave = async () => {
    setIsSaving(true); setMessage(''); setError('');
    try {
      const res = await fetch('/api/admin/settings/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'blendedRates', value: rates }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Failed to save configuration.');
      else setMessage('Department blended rates updated successfully!');
    } catch { setError('An error occurred while saving.'); }
    finally { setIsSaving(false); }
  };

  const rateValues = Object.values(rates);
  const avgRate = rateValues.length > 0
    ? (rateValues.reduce((a, b) => a + b, 0) / rateValues.length).toFixed(2)
    : '55.00';

  return (
    <div className="min-h-screen bg-[#0a0a12] text-[#e0e0e0] font-sans">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Departmental Loaded Hourly Rates</h1>
            <p className="text-sm text-[#9ca3af] mt-1">
              Configure fully-loaded labor rates ($/hr) per department for ROI dollar calculations.
            </p>
          </div>
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#6366f1]/15 text-[#818cf8] border border-[#6366f1]/25 w-fit">
            Avg: ${avgRate} / hr
          </span>
        </div>

        {/* Settings sub-navigation */}
        <div className="flex items-center gap-2 border-b border-[#1e1e3a] pb-3">
          {SETTINGS_TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                tab.active
                  ? 'bg-[#6366f1] text-white shadow-sm'
                  : 'text-[#9ca3af] hover:text-white hover:bg-[#1a1a2e] border border-[#2a2a4e]'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[#6b7280] text-sm font-medium">Loading rate configurations…</p>
          </div>
        ) : (
          <div className="space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-bold text-center">{error}</div>
            )}
            {message && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-bold text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> {message}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEPARTMENTS.map((dept) => {
                const icon = DEPARTMENT_ICONS[dept] || '💼';
                const rateVal = rates[dept] ?? DEFAULT_RATES[dept] ?? 50;
                return (
                  <div key={dept} className="p-5 rounded-2xl bg-[#0f0f1e] border border-[#1e1e3a] flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{icon}</span>
                      <div>
                        <p className="text-sm font-bold text-white">{dept}</p>
                        <p className="text-[11px] text-[#4b5563] font-semibold">Loaded labor rate</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-[#6b7280] font-bold">$</span>
                      <input
                        type="number"
                        value={rateVal}
                        onChange={(e) => handleChange(dept, parseInt(e.target.value, 10) || 0)}
                        className="w-20 bg-[#0a0a12] border border-[#2a2a4e] rounded-xl px-3 py-2 text-xs font-mono font-bold text-white text-right focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                      />
                      <span className="text-xs text-[#6b7280] font-bold">/hr</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5558e0] hover:to-[#7c4fdb] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#6366f1]/20 transition-all cursor-pointer flex items-center gap-2"
              >
                {isSaving ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Saving…</span></>
                ) : (
                  <><Save className="h-4 w-4" /><span>Save Blended Rates</span></>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
