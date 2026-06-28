// Task 2.10 — Summary Generation Agent
// Produces two human-readable narratives from the populated RequestSummary + RequestEstimate.

import { callLlm, parseJsonSafe } from './llm-client';

export interface SummaryGenerationResult {
  requesterNarrative: string;
  engineeringNarrative: string;
}

const SYSTEM_PROMPT = `You are a Summary Generation Agent for an internal AI automation request platform.

Your job is to produce two clear, professional narrative summaries of an automation request:

1. requesterNarrative — Written FOR the requester (employee who submitted the request).
   - Confirm what was captured about their process and what the automation would achieve.
   - Mention the estimated annual savings and ROI confidence level.
   - Tone: warm, encouraging, plain language. Max 3 sentences.

2. engineeringNarrative — Written FOR the engineering team reviewing the request.
   - Describe the automation scope, systems involved, effort estimate, and risk flags.
   - Include the priority score context and confidence level.
   - Tone: concise, technical, factual. Max 4 sentences.

Respond with ONLY a valid JSON object. No text, no markdown.

{
  "requesterNarrative": "...",
  "engineeringNarrative": "..."
}`;

/**
 * Run the Summary Generation Agent.
 */
export async function runSummaryGenerationAgent({
  department,
  processDescription,
  painPoints,
  toolsUsed,
  desiredOutcome,
  annualHoursSaved,
  annualDollarsSaved,
  effortSize,
  riskFlags,
  roiConfidence,
  effortConfidence,
  priorityScore,
  automationType,
  systemsTouched,
}: {
  department: string;
  processDescription?: string;
  painPoints?: string[];
  toolsUsed?: string[];
  desiredOutcome?: string;
  annualHoursSaved: number;
  annualDollarsSaved: number;
  effortSize: string;
  riskFlags: string[];
  roiConfidence: string;
  effortConfidence: string;
  priorityScore: number;
  automationType?: string;
  systemsTouched?: string[];
}): Promise<SummaryGenerationResult> {
  const userPrompt = `DEPARTMENT: ${department}
AUTOMATION TYPE: ${automationType || 'Not categorized'}

PROCESS DESCRIPTION:
${processDescription || 'Not provided.'}

PAIN POINTS:
${painPoints?.length ? painPoints.map((p) => `- ${p}`).join('\n') : 'Not specified.'}

CURRENT TOOLS:
${toolsUsed?.length ? toolsUsed.join(', ') : 'Not specified.'}

SYSTEMS TO BE TOUCHED:
${systemsTouched?.length ? systemsTouched.join(', ') : 'Not specified.'}

DESIRED OUTCOME:
${desiredOutcome || 'Not specified.'}

ESTIMATES:
- Annual Hours Saved: ${annualHoursSaved.toLocaleString()} hours
- Annual $ Saved: $${annualDollarsSaved.toLocaleString()}
- Build Effort: ${effortSize}
- ROI Confidence: ${roiConfidence}
- Effort Confidence: ${effortConfidence}
- Priority Score: ${priorityScore}/100
- Risk Flags: ${riskFlags.length > 0 ? riskFlags.join('; ') : 'None identified'}

Generate both narratives now.`;

  const raw = await callLlm(SYSTEM_PROMPT, [{ role: 'user', content: userPrompt }]);
  const parsed = parseJsonSafe<SummaryGenerationResult>(raw);

  if (!parsed) {
    console.warn('[SummaryGenerationAgent] Parse failed — returning placeholder narratives');
    return {
      requesterNarrative: `Your automation request for the ${department} department has been captured. The estimated annual savings are $${annualDollarsSaved.toLocaleString()} with a ${roiConfidence.toLowerCase()} confidence level. Your request has been submitted for engineering review.`,
      engineeringNarrative: `${department} automation request — ${automationType || 'type unclassified'}. Effort estimate: ${effortSize}. Annual savings estimate: $${annualDollarsSaved.toLocaleString()} (${roiConfidence} confidence). Priority score: ${priorityScore}/100. Risk flags: ${riskFlags.length > 0 ? riskFlags.join('; ') : 'none'}.`,
    };
  }

  return parsed;
}
