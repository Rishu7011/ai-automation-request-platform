'use client';

import React, { useState, useEffect } from 'react';
import { X, CopyCheck, AlertTriangle, Check, Layers, Loader2 } from 'lucide-react';

interface CandidateData {
  _id: string;
  similarityScore: number;
  reason: string;
  resolution: 'pending' | 'confirmed_duplicate' | 'related' | 'not_duplicate';
  candidateRequestId: {
    _id: string;
    title: string;
    department: string;
    status: string;
    priorityScore: number;
    requesterId?: { name?: string; username?: string; department?: string };
    createdAt: string;
  };
  candidateSummary?: {
    processDescription?: string;
    painPoints?: string[];
    toolsUsed?: string[];
  };
}

interface DuplicateComparisonModalProps {
  requestId: string;
  requestTitle: string;
  requestDepartment: string;
  onClose: () => void;
  onResolved: () => void;
}

export default function DuplicateComparisonModal({
  requestId,
  requestTitle,
  requestDepartment,
  onClose,
  onResolved,
}: DuplicateComparisonModalProps) {
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDuplicates() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/requests/${requestId}/duplicates`);
        if (!res.ok) throw new Error('Failed to load duplicate candidates');
        const data = await res.json();
        setCandidates(data.candidates || []);
        if (data.candidates?.length > 0) {
          setSelectedCandidateId(data.candidates[0]._id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading candidates');
      } finally {
        setIsLoading(false);
      }
    }
    loadDuplicates();
  }, [requestId]);

  const currentCandidate = candidates.find((c) => c._id === selectedCandidateId);

  const handleResolve = async (resolution: 'confirmed_duplicate' | 'related' | 'not_duplicate') => {
    if (!selectedCandidateId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/requests/${requestId}/duplicates`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: selectedCandidateId,
          resolution,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to update candidate resolution');
      }
      onResolved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resolution failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f0f1e] border border-[#2a2a4e] rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1e1e3a] flex items-center justify-between bg-[#16162a]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Duplicate Candidate Comparison</h2>
              <p className="text-xs text-gray-400">Comparing request with potential existing duplicate matches</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-16 text-center text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-400" />
              <p className="text-sm">Loading potential duplicate matches…</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Check className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm">No candidate duplicate matches found for this request.</p>
            </div>
          ) : (
            <>
              {/* Candidate selector tabs */}
              {candidates.length > 1 && (
                <div className="flex items-center space-x-2 border-b border-[#1e1e3a] pb-3 overflow-x-auto">
                  {candidates.map((cand, idx) => (
                    <button
                      key={cand._id}
                      onClick={() => setSelectedCandidateId(cand._id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedCandidateId === cand._id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-[#16162a] text-gray-400 hover:text-white'
                      }`}
                    >
                      Match #{idx + 1} ({(cand.similarityScore * 100).toFixed(0)}%)
                    </button>
                  ))}
                </div>
              )}

              {currentCandidate && (
                <>
                  {/* Match summary banner */}
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl font-bold text-amber-400 bg-amber-500/20 px-3 py-1 rounded-lg">
                        {(currentCandidate.similarityScore * 100).toFixed(0)}% Match
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-amber-300">AI Duplicate Detection Rationale</p>
                        <p className="text-xs text-gray-300">{currentCandidate.reason}</p>
                      </div>
                    </div>

                    <div className="text-xs text-gray-400">
                      Status: <span className="uppercase text-amber-400 font-semibold">{currentCandidate.resolution}</span>
                    </div>
                  </div>

                  {/* Side-by-Side Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Current Flagged Request */}
                    <div className="p-5 rounded-xl bg-[#141426] border border-[#2a2a4e] space-y-4">
                      <div className="border-b border-white/10 pb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Current Request</span>
                        <h3 className="text-sm font-semibold text-white mt-1">{requestTitle}</h3>
                        <p className="text-xs text-gray-400">{requestDepartment}</p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-300 mb-1">Target Process</p>
                        <p className="text-xs text-gray-400 bg-[#0f0f1e] p-3 rounded-lg border border-white/5">
                          {requestTitle} in {requestDepartment} department.
                        </p>
                      </div>
                    </div>

                    {/* Right: Candidate Match */}
                    <div className="p-5 rounded-xl bg-[#141426] border border-[#2a2a4e] space-y-4">
                      <div className="border-b border-white/10 pb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Existing Candidate Match</span>
                        <h3 className="text-sm font-semibold text-white mt-1">
                          {currentCandidate.candidateRequestId?.title || 'Existing Request'}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {currentCandidate.candidateRequestId?.department} · Status: {currentCandidate.candidateRequestId?.status}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-300 mb-1">Process Description</p>
                        <p className="text-xs text-gray-400 bg-[#0f0f1e] p-3 rounded-lg border border-white/5">
                          {currentCandidate.candidateSummary?.processDescription || 'No detailed process summary available.'}
                        </p>
                      </div>

                      {currentCandidate.candidateSummary?.painPoints && currentCandidate.candidateSummary.painPoints.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-300 mb-1">Pain Points</p>
                          <ul className="text-xs text-gray-400 list-disc list-inside space-y-1">
                            {currentCandidate.candidateSummary.painPoints.map((p, idx) => (
                              <li key={idx}>{p}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {currentCandidate && (
          <div className="px-6 py-4 border-t border-[#1e1e3a] bg-[#16162a] flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-gray-400">
              Select resolution option for this duplicate candidate:
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleResolve('not_duplicate')}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 text-xs font-medium transition-all"
              >
                Dismiss (Not Duplicate)
              </button>
              <button
                onClick={() => handleResolve('related')}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-medium transition-all"
              >
                <Layers className="w-3.5 h-3.5 inline mr-1" />
                Mark as Related
              </button>
              <button
                onClick={() => handleResolve('confirmed_duplicate')}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition-all flex items-center"
              >
                <CopyCheck className="w-3.5 h-3.5 inline mr-1.5" />
                Confirm Duplicate & Archive
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
