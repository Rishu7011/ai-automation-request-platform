// Groq / Ollama AI Intake Agent
// Supports multiple Groq API keys with round-robin load balancing, rate-limit failover, and local Ollama fallback.

import { INTAKE_STAGES } from '@/constants';

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3.5:9b';

// Parse Groq keys from process.env (supports GROQ_API_KEYS or GROQ_API_KEY)
function getGroqKeys(): string[] {
  const keysString = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '';
  return keysString
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k && k !== 'your_groq_api_key_here');
}

let currentKeyIndex = 0;

function getNextGroqKey(keys: string[]): string {
  if (keys.length === 0) return '';
  const key = keys[currentKeyIndex % keys.length];
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  return key;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface IntakeAgentResponse {
  next_question: string;
  stage_complete: boolean;
  slot_fill_update: Record<string, unknown>;
  reasoning?: string;
}

export interface DepartmentQuestionSet {
  key: string;
  prompt: string;
  helpText?: string;
  focusArea?: string;
}

// ─── Core LLM Call (Groq Multi-key with Ollama Fallback) ──────────────────────

async function callLlm(
  systemPrompt: string,
  messages: ConversationMessage[]
): Promise<string> {
  const groqKeys = getGroqKeys();

  if (groqKeys.length > 0) {
    // Try keys sequentially in case one is rate limited or fails
    const attempts = groqKeys.length;
    let lastError: Error | null = null;

    for (let i = 0; i < attempts; i++) {
      const apiKey = getNextGroqKey(groqKeys);
      try {
        const body = {
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
          temperature: 0.7,
          max_completion_tokens: 1024,
        };

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const text = await res.text();
          console.warn(`Groq key failure (${res.status}): ${text}. Trying next key...`);
          lastError = new Error(`Groq API error ${res.status}: ${text}`);
          continue; // Try next key
        }

        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) return content;
      } catch (err) {
        console.warn(`Groq request failed with key ending in ...${apiKey.slice(-4)}:`, err);
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    console.warn('All Groq keys failed. Falling back to local Ollama...');
  }

  // Fallback to local Ollama
  const body = {
    model: OLLAMA_MODEL,
    stream: false,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  };

  const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama API error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { message?: { content?: string } };
  return data.message?.content?.trim() ?? '';
}

// ─── Strip JSON from model output ────────────────────────────────────────────

function extractJson(raw: string): string {
  // Strip <think>...</think> blocks if present
  let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Strip markdown code fences
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }

  // Find first { ... } JSON object
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }

  return cleaned;
}

// ─── AI Intake Agent ──────────────────────────────────────────────────────────

/**
 * AI Intake Agent — drives the multi-stage conversational interview.
 * Decides the next question within the current stage based on conversation history
 * and department-specific question templates.
 */
export async function runIntakeAgent({
  stage,
  department,
  conversationHistory,
  departmentQuestions,
  slotFillState,
}: {
  stage: number;
  department: string;
  conversationHistory: ConversationMessage[];
  departmentQuestions: DepartmentQuestionSet[];
  slotFillState: Record<string, unknown>;
}): Promise<IntakeAgentResponse> {
  const stageName = INTAKE_STAGES.find((s) => s.id === stage)?.name ?? `Stage ${stage}`;

  const departmentQuestionsText =
    departmentQuestions.length > 0
      ? `\n\nDEPARTMENT-SPECIFIC QUESTIONS FOR ${department.toUpperCase()} (Stage ${stage}):\n${departmentQuestions
          .map((q, i) => `${i + 1}. [${q.key}] ${q.prompt}${q.helpText ? ` (Hint: ${q.helpText})` : ''}`)
          .join('\n')}`
      : '';

  const slotFillText =
    Object.keys(slotFillState).length > 0
      ? `\n\nCURRENT SLOT-FILL STATE (already captured):\n${JSON.stringify(slotFillState, null, 2)}`
      : '';

  const systemPrompt = `You are an AI Intake Agent for an internal AI automation request platform. Your job is to conduct a friendly, conversational interview to help employees articulate their automation ideas clearly.

You are currently on STAGE ${stage}: "${stageName}" of an 8-stage intake flow.

STAGE DESCRIPTIONS:
1. Business Problem — Understand the core "what" and "why"
2. Current Workflow — Reconstruct the as-is process step by step
3. Existing Tools — Identify systems/tools currently involved
4. Pain Points — Surface friction, error rates, bottlenecks
5. Metrics — Quantify volume and time (feeds ROI inputs)
6. ROI Inputs — Confirm/refine cost basis and headcount
7. Compliance & Security — Flag data sensitivity, regulatory concerns
8. Review & Confirmation — Show summary for requester confirmation

CURRENT STAGE: ${stage} — "${stageName}"
DEPARTMENT: ${department}${departmentQuestionsText}${slotFillText}

RULES:
- Stay focused on the current stage only. Do not jump ahead to other stages.
- Ask ONE question at a time. Never overwhelm the requester with multiple questions.
- Be conversational, warm, and encouraging — not robotic or formal.
- Probe vague answers (e.g. "a lot of time" → "roughly how many hours per week would you estimate?")
- Adapt question order based on what the requester has already shared.
- Mark stage as complete when you have sufficient information for this stage (usually 3-5 meaningful exchanges).
- For Stage 8 (Review & Confirmation), always mark stage_complete: true after presenting the summary.
- Update slot_fill_update with any new structured information extracted from the last user message.

CRITICAL: You MUST respond with ONLY a valid JSON object. No text before or after. No markdown.

Response format:
{
  "next_question": "The single question to ask the requester next",
  "stage_complete": false,
  "slot_fill_update": {},
  "reasoning": "Brief internal note on why you chose this question"
}`;

  const raw = await callLlm(systemPrompt, conversationHistory);
  const jsonText = extractJson(raw);

  let parsed: IntakeAgentResponse;
  try {
    parsed = JSON.parse(jsonText) as IntakeAgentResponse;
  } catch {
    // Graceful fallback if model doesn't output valid JSON
    parsed = {
      next_question:
        raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim().slice(0, 500) ||
        'Could you tell me more about that?',
      stage_complete: false,
      slot_fill_update: {},
    };
  }

  return parsed;
}

// ─── Stage Opener ─────────────────────────────────────────────────────────────

/**
 * Generate the initial greeting question for a given stage.
 */
export async function generateStageOpener({
  stage,
  department,
  slotFillState,
}: {
  stage: number;
  department: string;
  slotFillState: Record<string, unknown>;
}): Promise<string> {
  const stageName = INTAKE_STAGES.find((s) => s.id === stage)?.name ?? `Stage ${stage}`;

  const contextNote =
    Object.keys(slotFillState).length > 0
      ? `\n\nContext already captured: ${JSON.stringify(slotFillState, null, 2)}`
      : '';

  const systemPrompt = `You are an AI Intake Agent conducting an automation intake interview.
Generate a single, warm and friendly opening question to begin Stage ${stage} ("${stageName}") of the interview for a ${department} department employee.
Be brief. Ask only ONE question. Reference previous context if available.${contextNote}
Respond with ONLY the question text — no JSON, no markdown, no preamble.`;

  const raw = await callLlm(systemPrompt, [
    { role: 'user', content: `Open Stage ${stage}: ${stageName}` },
  ]);

  const cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  return (
    cleaned ||
    `Let's move on to "${stageName}". Could you walk me through what happens in this part of your process?`
  );
}
