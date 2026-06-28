// Task 2.4 — Information Extraction Agent
// Called after each intake stage completes to extract structured data into RequestSummary.

import { callLlm, parseJsonSafe, ConversationMessage } from './llm-client';

export interface ExtractionResult {
  processDescription?: string;
  painPoints?: string[];
  peopleInvolved?: number;
  hoursPerOccurrence?: number;
  frequencyPerYear?: number;
  toolsUsed?: string[];
  risks?: string[];
  desiredOutcome?: string;
  departmentSpecificFields?: Record<string, unknown>;
}

const SYSTEM_PROMPT = `You are an Information Extraction Agent for an internal AI automation request platform.

Your job is to read a conversation transcript from ONE stage of an intake interview and extract structured information from it.

Extract ONLY information that was clearly stated by the requester. Do not infer or fabricate values.
If a field is not mentioned, omit it from your response (do not include null or empty values).

Respond with ONLY a valid JSON object — no text before or after, no markdown fences.

Available fields to extract:
{
  "processDescription": "A 1–3 sentence description of the process being automated",
  "painPoints": ["array of specific pain points or friction areas mentioned"],
  "peopleInvolved": <number of people who perform this task — integer>,
  "hoursPerOccurrence": <hours per single occurrence of the task — number>,
  "frequencyPerYear": <how many times per year this task occurs — integer>,
  "toolsUsed": ["array of software tools, systems, or platforms currently used"],
  "risks": ["array of compliance, data, or operational risks mentioned"],
  "desiredOutcome": "What the requester wants the automation to achieve",
  "departmentSpecificFields": { "key": "any other relevant structured info specific to this department/stage" }
}

Only include fields for which you found clear evidence in the transcript.`;

/**
 * Run the Information Extraction Agent on a single stage's conversation.
 * Returns partial RequestSummary fields found in that stage.
 */
export async function runExtractionAgent({
  stageNumber,
  stageName,
  department,
  conversationTurns,
}: {
  stageNumber: number;
  stageName: string;
  department: string;
  conversationTurns: ConversationMessage[];
}): Promise<ExtractionResult> {
  const userPrompt = `DEPARTMENT: ${department}
STAGE ${stageNumber}: ${stageName}

CONVERSATION TRANSCRIPT:
${conversationTurns
  .map((t) => `[${t.role === 'user' ? 'Requester' : 'AI'}]: ${t.content}`)
  .join('\n')}

Extract all structured information from this stage transcript.`;

  const raw = await callLlm(SYSTEM_PROMPT, [{ role: 'user', content: userPrompt }]);
  const parsed = parseJsonSafe<ExtractionResult>(raw);

  if (!parsed) {
    console.warn(`[ExtractionAgent] Stage ${stageNumber} parse failed — returning empty result`);
    return {};
  }

  return parsed;
}
