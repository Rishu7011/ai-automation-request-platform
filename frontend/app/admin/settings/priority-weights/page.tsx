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
    <div className="min-h-screen bg-[#13131b] text-[#e4e1ed] font-inter">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#464554]/30 pb-6">
          <div>
            <h1 className="text-2xl font-bold font-outfit text-[#c0c1ff] tracking-tight">Priority Algorithm Weights</h1>
            <p className="text-xs text-[#908fa0] mt-1">
              Configure percentage weights used to compute Priority Scores (0–100).
            </p>
          </div>
          <span className={`px-3.5 py-1.5 rounded-md text-xs font-bold font-outfit border w-fit ${
            isSumValid
              ? 'bg-[#00a572]/15 text-[#4edea3] border-[#00a572]/30'
              : 'bg-[#93000a]/20 text-[#ffb4ab] border-[#ffb4ab]/30 animate-pulse'
          }`}>
            Total: {totalSum}% / 100%
          </span>
        </div>

        {/* Settings sub-navigation */}
        <div className="flex items-center gap-2 border-b border-[#464554]/30 pb-3">
          {SETTINGS_TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab.active
                  ? 'bg-[#6366f1] text-white shadow-sm shadow-[#6366f1]/20'
                  : 'text-[#908fa0] hover:text-white hover:bg-[#34343d]/40 border border-[#464554]/30'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[#908fa0] text-xs font-medium">Loading algorithm weights…</p>
          </div>
        ) : (
          <div className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-[#93000a]/20 border border-[#ffb4ab]/30 text-[#ffb4ab] text-xs font-bold text-center">{error}</div>
            )}
            {message && (
              <div className="p-4 rounded-xl bg-[#00a572]/15 border border-[#00a572]/30 text-[#4edea3] text-xs font-bold text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#4edea3]" /> {message}
              </div>
            )}

            {/* Sliders */}
            <div className="glass-panel border border-[#464554]/30 rounded-xl p-6 space-y-6 divide-y divide-[#464554]/20">
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
                        <div className="h-9 w-9 rounded-lg bg-[#6366f1]/15 border border-[#6366f1]/30 flex items-center justify-center text-[#c0c1ff] mt-0.5 shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white font-outfit">{item.label}</p>
                          <p className="text-[11px] text-[#908fa0] font-medium">{item.desc}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#c0c1ff] bg-[#6366f1]/15 px-3 py-1 rounded-md border border-[#6366f1]/30 font-mono-code">
                        {currentPct}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0" max="100" step="1"
                      value={currentPct}
                      onChange={(e) => handleChange(fieldKey, parseInt(e.target.value, 10))}
                      className="w-full accent-[#6366f1] bg-[#1f1f27] h-2 rounded-lg cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={!isSumValid || isSaving}
                className="px-6 py-2.5 rounded-lg font-semibold text-xs text-white bg-[#6366f1] hover:bg-[#8083ff] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#6366f1]/20 transition-all cursor-pointer flex items-center gap-2"
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

