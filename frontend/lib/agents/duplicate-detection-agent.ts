// Task 8.1 — Duplicate Detection Agent
// Compares a newly submitted request against existing request summaries in MongoDB
// using Claude LLM to find semantic duplicates, persists candidates, and flags duplicates.

import { callLlm, parseJsonSafe } from './llm-client';
import { Request } from '@/models/Request';
import { RequestSummary } from '@/models/RequestSummary';
import { DuplicateCandidate } from '@/models/DuplicateCandidate';
import connectToDatabase from '@/lib/db';
import mongoose from 'mongoose';

export interface CandidateResult {
  candidateRequestId: string;
  similarityScore: number; // 0.00 to 1.00
  reason: string;
}

export interface DuplicateDetectionOutput {
  candidates: CandidateResult[];
  isDuplicateFlagged: boolean;
}

export async function runDuplicateDetectionAgent(
  newRequestId: string
): Promise<DuplicateDetectionOutput> {
  await connectToDatabase();

  const newRequest = await Request.findById(newRequestId).lean();
  const newSummary = await RequestSummary.findOne({ requestId: newRequestId }).lean();

  if (!newRequest || !newSummary) {
    return { candidates: [], isDuplicateFlagged: false };
  }

  // Load all existing submitted request summaries excluding the current one
  const existingRequests = await Request.find({
    _id: { $ne: newRequestId },
    deletedAt: null,
    status: { $nin: ['draft', 'ai_reviewing'] },
  })
    .select('_id title department status')
    .lean();

  if (existingRequests.length === 0) {
    return { candidates: [], isDuplicateFlagged: false };
  }

  const existingRequestIds = existingRequests.map((r) => r._id);
  const existingSummaries = await RequestSummary.find({
    requestId: { $in: existingRequestIds },
  }).lean();

  const summaryMap = new Map(existingSummaries.map((s) => [s.requestId.toString(), s]));

  // Build candidate list for LLM
  const existingItems = existingRequests.map((r) => {
    const s = summaryMap.get(r._id.toString());
    return {
      id: r._id.toString(),
      title: r.title,
      department: r.department,
      processDescription: s?.processDescription || '',
      painPoints: s?.painPoints || [],
      toolsUsed: s?.toolsUsed || [],
    };
  });

  const systemPrompt = `You are an AI Duplicate Detection Agent for an enterprise automation platform.
Compare the NEW automation request against the list of EXISTING requests.
Identify requests that address the same underlying business process, bottleneck, or workflow, even if described with different terminology.

Calculate a similarity score from 0.00 (completely distinct) to 1.00 (identical process & goals).
Return ONLY a valid JSON object matching this schema:
{
  "candidates": [
    {
      "candidateRequestId": "string (the matching existing request ID)",
      "similarityScore": number (between 0.0 and 1.0),
      "reason": "Clear 1-2 sentence explanation of the process overlap or why this is a duplicate"
    }
  ]
}

Rules:
- Include ONLY candidates with similarityScore >= 0.50.
- Return an empty candidates array if no strong matches exist.
- Return ONLY valid JSON. No markdown code blocks.`;

  const userPrompt = `NEW REQUEST:
ID: ${newRequestId}
Title: ${newRequest.title}
Department: ${newRequest.department}
Process: ${newSummary.processDescription || 'N/A'}
Pain Points: ${(newSummary.painPoints || []).join(', ')}
Tools: ${(newSummary.toolsUsed || []).join(', ')}

EXISTING REQUESTS TO COMPARE AGAINST:
${JSON.stringify(existingItems, null, 2)}`;

  try {
    const rawOutput = await callLlm(systemPrompt, [{ role: 'user', content: userPrompt }]);
    const parsed = parseJsonSafe<{ candidates?: CandidateResult[] }>(rawOutput);

    const candidates = parsed?.candidates || [];
    let isDuplicateFlagged = false;

    for (const c of candidates) {
      if (!c.candidateRequestId || typeof c.similarityScore !== 'number') continue;

      // Upsert candidate record
      await DuplicateCandidate.findOneAndUpdate(
        {
          requestId: new mongoose.Types.ObjectId(newRequestId),
          candidateRequestId: new mongoose.Types.ObjectId(c.candidateRequestId),
        },
        {
          $set: {
            similarityScore: c.similarityScore,
            reason: c.reason,
            resolution: 'pending',
          },
        },
        { upsert: true }
      );

      if (c.similarityScore >= 0.75) {
        isDuplicateFlagged = true;
      }
    }

    if (isDuplicateFlagged) {
      await Request.findByIdAndUpdate(newRequestId, { isDuplicateFlagged: true });
    }

    return { candidates, isDuplicateFlagged };
  } catch (err) {
    console.error('[Duplicate Detection Agent] Error:', err);
    return { candidates: [], isDuplicateFlagged: false };
  }
}
