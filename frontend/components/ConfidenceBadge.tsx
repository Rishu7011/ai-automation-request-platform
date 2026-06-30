'use client';

import React, { useState } from 'react';
import { Info } from 'lucide-react';

export interface ConfidenceBadgeProps {
  level: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  reasons?: string[];
  size?: 'sm' | 'md' | 'lg';
}

const LEVEL_STYLES: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
  HIGH: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
    label: 'High Confidence',
  },
  MEDIUM: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
    label: 'Medium Confidence',
  },
  LOW: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    dot: 'bg-rose-400',
    label: 'Low Confidence',
  },
};

export default function ConfidenceBadge({ level, reasons = [], size = 'md' }: ConfidenceBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const normalizedLevel = (level || 'LOW').toUpperCase();
  const style = LEVEL_STYLES[normalizedLevel] || LEVEL_STYLES.LOW;

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px]'
      : size === 'lg'
      ? 'px-3.5 py-1.5 text-sm'
      : 'px-2.5 py-1 text-xs';

  return (
    <div className="relative inline-flex items-center">
      <span
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${style.bg} ${style.text} ${style.border} ${sizeClasses} cursor-help transition-all`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${style.dot} animate-pulse`} />
        <span>{style.label}</span>
        <Info className="w-3 h-3 opacity-60 ml-0.5" />
      </span>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 w-64 p-3 bg-[#16162a] border border-[#2a2a4e] rounded-xl shadow-2xl text-xs text-gray-200 pointer-events-none">
          <p className="font-semibold text-white mb-1">Confidence Score Factor:</p>
          {normalizedLevel === 'HIGH' && (
            <p className="text-emerald-400 text-[11px]">Inputs were explicitly confirmed by requester with full process details.</p>
          )}
          {normalizedLevel === 'MEDIUM' && (
            <p className="text-amber-400 text-[11px]">Mix of user-confirmed data and AI estimated metrics.</p>
          )}
          {normalizedLevel === 'LOW' && (
            <p className="text-rose-400 text-[11px]">Inputs rely heavily on AI defaults and require engineering review before ROI confirmation.</p>
          )}

          {reasons.length > 0 && (
            <ul className="mt-2 border-t border-white/10 pt-1.5 list-disc list-inside text-[10px] text-gray-400 space-y-0.5">
              {reasons.map((r, idx) => (
                <li key={idx}>{r}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
