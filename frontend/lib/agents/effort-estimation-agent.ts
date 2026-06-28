// Task 2.6 — Engineering Effort Estimation Agent
// Takes RequestSummary content and estimates build effort size + risk flags.

import { callLlm, parseJsonSafe } from './llm-client';

export type EffortSize = 'S' | 'M' | 'L' | 'XL';
export type EffortConfidence = 'low' | 'medium' | 'high';

export interface EffortEstimationResult {
  effortSize: EffortSize;
  riskFlags: string[];
  reasoning: string;
  confidence: EffortConfidence;
}

const SYSTEM_PROMPT = `You are an Engineering Effort Estimation Agent for an internal AI automation request platform.

Your job is to estimate the engineering build effort required to implement an automation based on a process summary.

Effort size definitions:
- S (Small): 20–40 engineer-hours. Simple integrations, rule-based automations, single-system scripts.
- M (Medium): 40–100 engineer-hours. Multi-step workflows, 2–3 system integrations, moderate complexity.
- L (Large): 100–250 engineer-hours. Complex data pipelines, AI/ML integrations, significant UI work.
- XL (Extra Large): 250–500+ engineer-hours. Full systems, multi-department workflows, deep integrations.

Confidence levels:
- high: Process is well-understood, requirements are clear, scope is well-defined.
- medium: Scope is somewhat clear but some ambiguity remains.
- low: Significant unknowns, vague requirements, or dependencies unclear.

Risk flags: Identify specific technical or organizational risks (e.g., "legacy system without API", "PII data involved", "high change frequency").

Respond with ONLY a valid JSON object. No text, no markdown.

{
  "effortSize": "S|M|L|XL",
  "riskFlags": ["array of specific risk strings"],
  "reasoning": "1–2 sentence explanation of the size estimate",
  "confidence": "low|medium|high"
}`;

/**
 * Run the Engineering Effort Estimation Agent.
 */
export async function runEffortEstimationAgent({
  processDescription,
  painPoints,
  toolsUsed,
  department,
  desiredOutcome,
}: {
  processDescription?: string;
  painPoints?: string[];
  toolsUsed?: string[];
  department: string;
  desiredOutcome?: string;
}): Promise<EffortEstimationResult> {
  const userPrompt = `DEPARTMENT: ${department}

PROCESS DESCRIPTION:
${processDescription || 'Not provided.'}

PAIN POINTS:
${painPoints?.length ? painPoints.map((p) => `- ${p}`).join('\n') : 'Not specified.'}

TOOLS CURRENTLY USED:
${toolsUsed?.length ? toolsUsed.join(', ') : 'Not specified.'}

DESIRED OUTCOME:
${desiredOutcome || 'Not specified.'}

Estimate the engineering effort required to automate this process.`;

  const raw = await callLlm(SYSTEM_PROMPT, [{ role: 'user', content: userPrompt }]);
  const parsed = parseJsonSafe<EffortEstimationResult>(raw);

  if (!parsed) {
    console.warn('[EffortEstimationAgent] Parse failed — defaulting to M/low');
    return {
      effortSize: 'M',
      riskFlags: ['Effort estimate unavailable — defaulted to Medium'],
      reasoning: 'Could not parse LLM response; defaulted to Medium effort.',
      confidence: 'low',
    };
  }

  // Validate effortSize is one of the known values
  if (!['S', 'M', 'L', 'XL'].includes(parsed.effortSize)) {
    parsed.effortSize = 'M';
  }

  return parsed;
}
