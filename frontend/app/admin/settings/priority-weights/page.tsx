'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Target,
  Clock,
  Building,
  Wrench,
  Shield,
  Save,
  CheckCircle2,
} from 'lucide-react';

interface PriorityWeights {
  weightRoi: number;
  weightStrategicValue: number;
  weightUrgency: number;
  weightOrgImpact: number;
  weightEffort: number;
  weightRisk: number;
}

const SETTINGS_TABS = [
  { href: '/admin/settings/priority-weights', label: '⚖️ Priority Weights', active: true },
  { href: '/admin/settings/effort-ranges', label: '⏱️ Effort Ranges', active: false },
  { href: '/admin/settings/rates', label: '💵 Blended Rates', active: false },
];

export default function AdminPriorityWeightsPage() {
  const [weights, setWeights] = useState<PriorityWeights>({
    weightRoi: 0.35,
    weightStrategicValue: 0.15,
    weightUrgency: 0.15,
    weightOrgImpact: 0.10,
    weightEffort: 0.15,
    weightRisk: 0.10,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadWeights() {
      try {
        const res = await fetch('/api/admin/settings/priority-weights');
        if (res.ok) {
          const data = await res.json();
          if (data.config) {
            setWeights({
              weightRoi: data.config.weightRoi,
              weightStrategicValue: data.config.weightStrategicValue,
              weightUrgency: data.config.weightUrgency,
              weightOrgImpact: data.config.weightOrgImpact,
              weightEffort: data.config.weightEffort,
              weightRisk: data.config.weightRisk,
            });
          }
        }
      } catch {
        setError('Failed to load priority weights configuration.');
      } finally {
        setIsLoading(false);
      }
    }
    loadWeights();
  }, []);

  const totalSum = Math.round(
    (weights.weightRoi + weights.weightStrategicValue + weights.weightUrgency +
      weights.weightOrgImpact + weights.weightEffort + weights.weightRisk) * 100
  );
  const isSumValid = totalSum === 100;

  const handleChange = (field: keyof PriorityWeights, value: number) => {
    setWeights((prev) => ({ ...prev, [field]: value / 100 }));
    setMessage(''); setError('');
  };

  const handleSave = async () => {
    if (!isSumValid) { setError(`Weights must sum to 100%. Current total is ${totalSum}%.`); return; }
    setIsSaving(true); setMessage(''); setError('');
    try {
      const res = await fetch('/api/admin/settings/priority-weights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(weights),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save configuration.'); }
      else { setMessage('Priority weights updated successfully!'); }
    } catch { setError('An error occurred while saving.'); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-[#e0e0e0] font-sans">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Priority Algorithm Weights</h1>
            <p className="text-sm text-[#9ca3af] mt-1">
              Configure percentage weights used to compute Priority Scores (0–100). sys_admin / eng_admin only.
            </p>
          </div>
          <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold border w-fit ${
            isSumValid
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-300 border-rose-500/30 animate-pulse'
          }`}>
            Total: {totalSum}% / 100%
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
            <p className="text-[#6b7280] text-sm font-medium">Loading algorithm weights…</p>
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

            {/* Sliders */}
            <div className="bg-[#0f0f1e] border border-[#1e1e3a] rounded-2xl p-6 space-y-6 divide-y divide-[#1a1a2e]">
              {[
                { key: 'weightRoi', label: 'Financial Annual ROI', icon: DollarSign, desc: 'Weight assigned to calculated annual dollar savings.' },
                { key: 'weightStrategicValue', label: 'Strategic Alignment', icon: Target, desc: 'Alignment with executive OKRs and org strategy.' },
                { key: 'weightUrgency', label: 'Urgency & Time Sensitivity', icon: Clock, desc: 'Compliance deadlines, executive sponsorship, market urgency.' },
                { key: 'weightOrgImpact', label: 'Organizational Impact', icon: Building, desc: 'Breadth of affected headcount and cross-team workflows.' },
                { key: 'weightEffort', label: 'Engineering Effort Penalty', icon: Wrench, desc: 'Score penalty based on estimated build complexity (S/M/L/XL).' },
                { key: 'weightRisk', label: 'Technical & Security Risk', icon: Shield, desc: 'Score deduction for legacy integration risk or compliance flags.' },
              ].map((item, idx) => {
                const fieldKey = item.key as keyof PriorityWeights;
                const currentPct = Math.round(weights[fieldKey] * 100);
                const Icon = item.icon;
                return (
                  <div key={item.key} className={`space-y-3 ${idx > 0 ? 'pt-6' : ''}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-xl bg-[#6366f1]/10 border border-[#6366f1]/20 flex items-center justify-center text-[#818cf8] mt-0.5">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{item.label}</p>
                          <p className="text-xs text-[#6b7280] font-medium">{item.desc}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-[#818cf8] bg-[#6366f1]/15 px-3.5 py-1.5 rounded-xl border border-[#6366f1]/25">
                        {currentPct}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0" max="100" step="1"
                      value={currentPct}
                      onChange={(e) => handleChange(fieldKey, parseInt(e.target.value, 10))}
                      className="w-full accent-[#6366f1] bg-[#1a1a2e] h-2 rounded-lg cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={!isSumValid || isSaving}
                className="px-8 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5558e0] hover:to-[#7c4fdb] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#6366f1]/20 transition-all cursor-pointer flex items-center gap-2"
              >
                {isSaving ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Saving…</span></>
                ) : (
                  <><Save className="h-4 w-4" /><span>Save & Recalculate Algorithm</span></>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
