// Task 2.5 — ROI Extraction Agent
// Reads Stages 5 & 6 conversation to extract ROI inputs with confidence per field.

import { callLlm, parseJsonSafe, ConversationMessage } from './llm-client';

export type FieldConfidence = 'confirmed' | 'estimated' | 'defaulted';

export interface ROIExtractionResult {
  hoursPerOccurrence: number;
  frequencyPerYear: number;
  peopleInvolved: number;
  blendedHourlyCost: number;
  confidencePerField: {
    hoursPerOccurrence: FieldConfidence;
    frequencyPerYear: FieldConfidence;
    peopleInvolved: FieldConfidence;
    blendedHourlyCost: FieldConfidence;
  };
  overallConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  notes?: string;
}

const SYSTEM_PROMPT = `You are an ROI Extraction Agent for an internal AI automation request platform.

Your job is to extract ROI-related numerical inputs from a conversation transcript covering Stage 5 (Metrics) and Stage 6 (ROI Inputs) of an intake interview.

Rules:
- Extract numbers the requester explicitly stated. Mark these as "confirmed".
- If you compute or infer a number from stated information, mark it as "estimated".
- If the requester gave no information and you must use a plausible default, mark it as "defaulted".
- Use a blendedHourlyCost of 75 as the default if no cost information was given.
- Overall confidence: HIGH if all 4 core fields are "confirmed", MEDIUM if at least 2 are "confirmed", LOW otherwise.

Respond with ONLY a valid JSON object. No text, no markdown.

{
  "hoursPerOccurrence": <number — hours to complete this task once>,
  "frequencyPerYear": <integer — how many times per year>,
  "peopleInvolved": <integer — number of people performing this task>,
  "blendedHourlyCost": <number — blended hourly rate in USD>,
  "confidencePerField": {
    "hoursPerOccurrence": "confirmed|estimated|defaulted",
    "frequencyPerYear": "confirmed|estimated|defaulted",
    "peopleInvolved": "confirmed|estimated|defaulted",
    "blendedHourlyCost": "confirmed|estimated|defaulted"
  },
  "overallConfidence": "HIGH|MEDIUM|LOW",
  "notes": "Optional explanation of assumptions made"
}`;

/**
 * Run the ROI Extraction Agent on Stages 5 & 6 conversation.
 */
export async function runROIExtractionAgent({
  department,
  metricsConversation,
  roiConversation,
}: {
  department: string;
  metricsConversation: ConversationMessage[];
  roiConversation: ConversationMessage[];
}): Promise<ROIExtractionResult> {
  const combined = [
    ...metricsConversation.map((t) => ({ ...t, stage: 'Stage 5 (Metrics)' })),
    ...roiConversation.map((t) => ({ ...t, stage: 'Stage 6 (ROI Inputs)' })),
  ];

  const userPrompt = `DEPARTMENT: ${department}

CONVERSATION TRANSCRIPT (Stages 5 & 6):
${combined
  .map((t) => `[${t.stage}] [${t.role === 'user' ? 'Requester' : 'AI'}]: ${t.content}`)
  .join('\n')}

Extract all ROI inputs. Apply confidence labels per field as instructed.`;

  const raw = await callLlm(SYSTEM_PROMPT, [{ role: 'user', content: userPrompt }]);
  const parsed = parseJsonSafe<ROIExtractionResult>(raw);

  if (!parsed) {
    console.warn('[ROIExtractionAgent] Parse failed — returning safe defaults');
    return {
      hoursPerOccurrence: 1,
      frequencyPerYear: 12,
      peopleInvolved: 1,
      blendedHourlyCost: 75,
      confidencePerField: {
        hoursPerOccurrence: 'defaulted',
        frequencyPerYear: 'defaulted',
        peopleInvolved: 'defaulted',
        blendedHourlyCost: 'defaulted',
      },
      overallConfidence: 'LOW',
      notes: 'Extraction failed; all values are system defaults.',
    };
  }

  return parsed;
}
