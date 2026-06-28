'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface PriorityWeights {
  weightRoi: number;
  weightStrategicValue: number;
  weightUrgency: number;
  weightOrgImpact: number;
  weightEffort: number;
  weightRisk: number;
}

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
    (weights.weightRoi +
      weights.weightStrategicValue +
      weights.weightUrgency +
      weights.weightOrgImpact +
      weights.weightEffort +
      weights.weightRisk) *
      100
  );

  const isSumValid = totalSum === 100;

  const handleChange = (field: keyof PriorityWeights, value: number) => {
    setWeights((prev) => ({
      ...prev,
      [field]: value / 100,
    }));
    setMessage('');
    setError('');
  };

  const handleSave = async () => {
    if (!isSumValid) {
      setError(`Weights must sum to 100%. Current total is ${totalSum}%.`);
      return;
    }

    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/admin/settings/priority-weights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(weights),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save configuration.');
      } else {
        setMessage('✅ Priority weights updated successfully!');
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
            <h1 className="text-xl font-bold text-white tracking-tight">⚖️ Priority Weights Config</h1>
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
              className="text-xs text-white bg-[#6366f1] px-3 py-1.5 rounded-lg font-semibold transition-colors"
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
        {/* Header Description */}
        <div className="mb-8 p-6 rounded-2xl bg-[#0f0f1e] border border-[#1e1e3a] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white mb-1">Priority Formula Scoring Weights</h2>
            <p className="text-xs text-[#9ca3af] max-w-xl">
              Configure the mathematical weights used to calculate the Priority Score for all automation requests.
              The total weight across all 6 factors must sum to exactly <strong className="text-white">100%</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-4 py-2 rounded-xl text-xs font-bold border ${
                isSumValid
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
              }`}
            >
              Total Weight: {totalSum}%
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#9ca3af] text-sm">Loading configuration…</p>
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

            {/* Sliders Grid */}
            <div className="bg-[#0f0f1e] border border-[#1e1e3a] rounded-2xl p-6 space-y-6">
              {[
                { key: 'weightRoi', label: '💰 ROI Weight', desc: 'Weight given to calculated annual financial ROI $' },
                { key: 'weightStrategicValue', label: '🎯 Strategic Value Weight', desc: 'Alignment with organizational OKRs and strategy (1–5 scale)' },
                { key: 'weightUrgency', label: '⚡ Urgency Weight', desc: 'Time sensitivity and executive sponsorship' },
                { key: 'weightOrgImpact', label: '🏢 Organizational Impact Weight', desc: 'Number of teams and headcount affected' },
                { key: 'weightEffort', label: '🛠️ Effort Penalty Weight', desc: 'Deduction penalty based on estimated engineering effort size (S/M/L/XL)' },
                { key: 'weightRisk', label: '⚠️ Technical Risk Penalty Weight', desc: 'Deduction penalty for high technical complexity or security risk' },
              ].map((item) => {
                const fieldKey = item.key as keyof PriorityWeights;
                const currentPct = Math.round(weights[fieldKey] * 100);

                return (
                  <div key={item.key} className="space-y-2 border-b border-[#1e1e3a] pb-6 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{item.label}</p>
                        <p className="text-xs text-[#6b7280]">{item.desc}</p>
                      </div>
                      <span className="text-sm font-mono font-bold text-[#818cf8] bg-[#1a1a2e] px-3 py-1 rounded-lg border border-[#2a2a4e]">
                        {currentPct}%
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={currentPct}
                        onChange={(e) => handleChange(fieldKey, parseInt(e.target.value, 10))}
                        className="w-full accent-[#6366f1] bg-[#1a1a2e] h-2 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSave}
                disabled={!isSumValid || isSaving}
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
                    Saving Weights…
                  </>
                ) : (
                  <>💾 Save Weight Configuration</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
