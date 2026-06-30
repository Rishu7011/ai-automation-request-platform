'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Save, CheckCircle2 } from 'lucide-react';

interface EffortRange { min: number; max: number; }
interface EffortRangesState { S: EffortRange; M: EffortRange; L: EffortRange; XL: EffortRange; }

const DEFAULT_RANGES: EffortRangesState = {
  S: { min: 20,  max: 40  },
  M: { min: 40,  max: 100 },
  L: { min: 100, max: 250 },
  XL: { min: 250, max: 500 },
};

const SIZE_META = [
  { size: 'S',  title: 'Small (S)',       desc: 'Low-complexity automation, minor webhook or UI update.',             badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  { size: 'M',  title: 'Medium (M)',      desc: 'Standard multi-step workflow automation & API integration.',        badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  { size: 'L',  title: 'Large (L)',       desc: 'Complex AI pipeline, custom model or multi-system integration.',   badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  { size: 'XL', title: 'Extra Large (XL)', desc: 'Enterprise-wide process automation or legacy migration.',         badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
];

const SETTINGS_TABS = [
  { href: '/admin/settings/priority-weights', label: '⚖️ Priority Weights', active: false },
  { href: '/admin/settings/effort-ranges',    label: '⏱️ Effort Ranges',    active: true  },
  { href: '/admin/settings/rates',            label: '💵 Blended Rates',    active: false },
];

const inputClass =
  'w-full bg-[#0a0a12] border border-[#2a2a4e] rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-white text-right focus:outline-none focus:ring-2 focus:ring-[#6366f1]';

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
          if (data.setting?.value) setRanges(data.setting.value as EffortRangesState);
        }
      } catch { setError('Failed to load effort ranges configuration.'); }
      finally { setIsLoading(false); }
    }
    loadEffortRanges();
  }, []);

  const handleChange = (size: keyof EffortRangesState, bound: 'min' | 'max', val: number) => {
    setRanges((prev) => ({ ...prev, [size]: { ...prev[size], [bound]: Math.max(0, val) } }));
    setMessage(''); setError('');
  };

  const handleSave = async () => {
    setIsSaving(true); setMessage(''); setError('');
    try {
      const res = await fetch('/api/admin/settings/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'effortRanges', value: ranges }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Failed to save configuration.');
      else setMessage('Effort ranges updated successfully!');
    } catch { setError('An error occurred while saving.'); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-[#e0e0e0] font-sans">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">T-Shirt Size Build Hour Ranges</h1>
          <p className="text-sm text-[#9ca3af] mt-1">
            Configure min/max engineering hours for each T-shirt size tier used in ROI build-cost calculations.
          </p>
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
            <p className="text-[#6b7280] text-sm font-medium">Loading effort configurations…</p>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SIZE_META.map((item) => {
                const sizeKey = item.size as keyof EffortRangesState;
                const range = ranges[sizeKey] || DEFAULT_RANGES[sizeKey];
                return (
                  <div key={item.size} className="p-6 rounded-2xl bg-[#0f0f1e] border border-[#1e1e3a] space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-white">{item.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${item.badge}`}>
                        {range.min} – {range.max} hrs
                      </span>
                    </div>
                    <p className="text-xs text-[#6b7280] font-medium leading-relaxed">{item.desc}</p>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b7280] mb-1.5">Min Hours</label>
                        <input
                          type="number"
                          value={range.min}
                          onChange={(e) => handleChange(sizeKey, 'min', parseInt(e.target.value, 10) || 0)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b7280] mb-1.5">Max Hours</label>
                        <input
                          type="number"
                          value={range.max}
                          onChange={(e) => handleChange(sizeKey, 'max', parseInt(e.target.value, 10) || 0)}
                          className={inputClass}
                        />
                      </div>
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
                  <><Save className="h-4 w-4" /><span>Save Effort Bounds</span></>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
