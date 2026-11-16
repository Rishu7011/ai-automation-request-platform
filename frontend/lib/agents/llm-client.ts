// Shared LLM Client — used by all AI agents
// Groq multi-key round-robin + Ollama fallback + JSON extraction helper

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3.5:9b';

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

/**
 * Call the LLM with a system prompt + message history.
 * Tries all Groq keys in round-robin; falls back to local Ollama on failure.
 */
export async function callLlm(
  systemPrompt: string,
  messages: ConversationMessage[]
): Promise<string> {
  const groqKeys = getGroqKeys();

  if (groqKeys.length > 0) {
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
          temperature: 0.3, // Lower temp for structured extraction tasks
          max_completion_tokens: 2048,
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
          console.warn(`[LLM] Groq key failure (${res.status}): ${text}. Trying next key…`);
          lastError = new Error(`Groq API error ${res.status}: ${text}`);
          continue;
        }

        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) return content;
      } catch (err) {
        console.warn(`[LLM] Groq request failed with key …${apiKey.slice(-4)}:`, err);
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    console.warn('[LLM] All Groq keys exhausted. Falling back to local Ollama…', lastError);
  }

  // Ollama fallback
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

/**
 * Extract a JSON object from raw LLM output.
 * Handles: <think> blocks, markdown code fences, leading/trailing prose.
 */
export function extractJson(raw: string): string {
  // Strip <think>...</think> blocks (chain-of-thought models)
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

/**
 * Parse JSON from raw LLM output; returns null on parse failure.
 */
export function parseJsonSafe<T>(raw: string): T | null {
  try {
    return JSON.parse(extractJson(raw)) as T;
  } catch {
    console.warn('[LLM] JSON parse failed. Raw output:', raw.slice(0, 300));
    return null;
  }
}
