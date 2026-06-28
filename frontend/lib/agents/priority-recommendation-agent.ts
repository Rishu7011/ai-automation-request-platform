// Task 2.8 — Priority Recommendation Agent
// Extracts qualitative priority signals from the full conversation.

import { callLlm, parseJsonSafe, ConversationMessage } from './llm-client';

export interface PriorityRecommendationResult {
  urgencySignals: string[];
  executiveMentions: boolean;
  complianceDeadline: boolean;
  strategicValue: number; // 1–5
  urgency: number;        // 1–5
  orgImpact: number;      // 1–5
  riskLevel: number;      // 1–5 (higher = more risk)
  rationale: string;
}

const SYSTEM_PROMPT = `You are a Priority Recommendation Agent for an internal AI automation request platform.

Your job is to analyze a full intake conversation and extract qualitative priority signals to help engineering teams prioritize automation requests.

Scoring guide (1 = very low, 5 = very high):
- strategicValue: How aligned is this with company strategy? (e.g., revenue-generating, core operations vs. minor convenience)
- urgency: How time-sensitive is this? (e.g., regulatory deadline next month = 5, nice-to-have with no deadline = 1)
- orgImpact: How many people / departments are positively affected?
- riskLevel: How risky is NOT automating this? (e.g., manual errors causing compliance issues = 5)

executiveMentions: true if the requester mentions a specific executive, C-suite, or board-level mandate.
complianceDeadline: true if a regulatory, audit, or legal deadline is mentioned.
urgencySignals: Specific phrases or facts from the conversation that indicate urgency.

Respond with ONLY a valid JSON object. No text, no markdown.

{
  "urgencySignals": ["array of specific urgency indicators quoted or paraphrased from the conversation"],
  "executiveMentions": true|false,
  "complianceDeadline": true|false,
  "strategicValue": 1-5,
  "urgency": 1-5,
  "orgImpact": 1-5,
  "riskLevel": 1-5,
  "rationale": "1–2 sentence summary of the overall priority assessment"
}`;

/**
 * Run the Priority Recommendation Agent on the full intake conversation.
 */
export async function runPriorityRecommendationAgent({
  department,
  conversationHistory,
  processDescription,
}: {
  department: string;
  conversationHistory: ConversationMessage[];
  processDescription?: string;
}): Promise<PriorityRecommendationResult> {
  const userPrompt = `DEPARTMENT: ${department}

PROCESS DESCRIPTION:
${processDescription || 'Not separately provided — see conversation below.'}

FULL INTAKE CONVERSATION:
${conversationHistory
  .map((t) => `[${t.role === 'user' ? 'Requester' : 'AI'}]: ${t.content}`)
  .join('\n')}

Extract priority signals and assign scores.`;

  const raw = await callLlm(SYSTEM_PROMPT, [{ role: 'user', content: userPrompt }]);
  const parsed = parseJsonSafe<PriorityRecommendationResult>(raw);

  if (!parsed) {
    console.warn('[PriorityRecommendationAgent] Parse failed — returning neutral defaults');
    return {
      urgencySignals: [],
      executiveMentions: false,
      complianceDeadline: false,
      strategicValue: 3,
      urgency: 3,
      orgImpact: 3,
      riskLevel: 2,
      rationale: 'Priority assessment unavailable — defaults applied.',
    };
  }

  // Clamp numeric scores to 1–5
  const clamp = (n: number) => Math.max(1, Math.min(5, Math.round(n)));
  parsed.strategicValue = clamp(parsed.strategicValue ?? 3);
  parsed.urgency = clamp(parsed.urgency ?? 3);
  parsed.orgImpact = clamp(parsed.orgImpact ?? 3);
  parsed.riskLevel = clamp(parsed.riskLevel ?? 2);

  return parsed;
}
