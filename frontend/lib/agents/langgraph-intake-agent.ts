// LangGraph & LangChain StateGraph Architecture for AI Intake Agent
// Uses @langchain/langgraph StateGraph and @langchain/groq ChatGroq with multi-key rotation and local fallback.

import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import { ChatGroq } from '@langchain/groq';
import { MongoDBChatMessageHistory } from '@langchain/mongodb';
import { BaseLanguageModel } from '@langchain/core/language_models/base';
import { SystemMessage, HumanMessage, AIMessage, BaseMessage } from '@langchain/core/messages';
import { INTAKE_STAGES } from '@/constants';
import clientPromise from '@/lib/mongodb-client';

/**
 * Utility to get LangChain MongoDBChatMessageHistory for a request session.
 */
export async function getMongoDBChatHistory(sessionId: string): Promise<MongoDBChatMessageHistory> {
  const client = await clientPromise;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const collection = client.db().collection('langchain_chat_histories') as any;
  return new MongoDBChatMessageHistory({
    collection,
    sessionId,
  });
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

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

// ─── Multi-Key Groq / Ollama Model Provider ───────────────────────────────────

const GROQ_MODEL = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';
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
 * Creates a LangChain Chat Model instance (Groq with rotation or Fallback).
 */
function createChatModel(apiKey?: string): BaseLanguageModel {
  if (apiKey) {
    return new ChatGroq({
      apiKey,
      model: GROQ_MODEL,
      temperature: 0.7,
      maxTokens: 1024,
    });
  }

  // Fallback direct raw invoke using fetch for Ollama if Groq is unconfigured
  return {
    async invoke(messages: BaseMessage[]) {
      const formatted = messages.map((m) => {
        if (m instanceof SystemMessage) return { role: 'system', content: m.content as string };
        if (m instanceof HumanMessage) return { role: 'user', content: m.content as string };
        return { role: 'assistant', content: m.content as string };
      });

      const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          stream: false,
          messages: formatted,
        }),
      });

      if (!res.ok) {
        throw new Error(`Ollama API error ${res.status}`);
      }

      const data = (await res.json()) as { message?: { content?: string } };
      return new AIMessage({ content: data.message?.content?.trim() ?? '' });
    },
  } as unknown as BaseLanguageModel;
}

// ─── LangGraph State Definition ──────────────────────────────────────────────

export const IntakeGraphState = Annotation.Root({
  stage: Annotation<number>(),
  department: Annotation<string>(),
  conversationHistory: Annotation<ConversationMessage[]>(),
  departmentQuestions: Annotation<DepartmentQuestionSet[]>(),
  slotFillState: Annotation<Record<string, unknown>>(),
  mode: Annotation<'opener' | 'turn'>(),
  
  // Pipeline State & Graph Outputs:
  systemPrompt: Annotation<string>(),
  formattedMessages: Annotation<BaseMessage[]>(),
  rawLlmOutput: Annotation<string>(),
  parsedResponse: Annotation<IntakeAgentResponse>(),
  openerQuestion: Annotation<string>(),
});

// ─── LangGraph Node Implementations ──────────────────────────────────────────

/**
 * Node 1: Prompt Builder Node
 * Formulates system prompt and maps conversation history to LangChain Message objects.
 */
async function promptBuilderNode(state: typeof IntakeGraphState.State) {
  const { stage, department, conversationHistory, departmentQuestions, slotFillState, mode } = state;
  const stageName = INTAKE_STAGES.find((s) => s.id === stage)?.name ?? `Stage ${stage}`;

  if (mode === 'opener') {
    const contextNote =
      Object.keys(slotFillState || {}).length > 0
        ? `\n\nContext already captured: ${JSON.stringify(slotFillState, null, 2)}`
        : '';

    const systemPrompt = `You are an AI Intake Agent conducting an automation intake interview.
Generate a single, warm and friendly opening question to begin Stage ${stage} ("${stageName}") of the interview for a ${department} department employee.
Be brief. Ask only ONE question. Reference previous context if available.${contextNote}
Respond with ONLY the question text — no JSON, no markdown, no preamble.`;

    const formattedMessages: BaseMessage[] = [
      new SystemMessage(systemPrompt),
      new HumanMessage(`Open Stage ${stage}: ${stageName}`),
    ];

    return { systemPrompt, formattedMessages };
  }

  // Turn mode
  const departmentQuestionsText =
    (departmentQuestions || []).length > 0
      ? `\n\nDEPARTMENT-SPECIFIC QUESTIONS FOR ${(department || '').toUpperCase()} (Stage ${stage}):\n${departmentQuestions
          .map((q, i) => `${i + 1}. [${q.key}] ${q.prompt}${q.helpText ? ` (Hint: ${q.helpText})` : ''}`)
          .join('\n')}`
      : '';

  const slotFillText =
    Object.keys(slotFillState || {}).length > 0
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

  const formattedMessages: BaseMessage[] = [
    new SystemMessage(systemPrompt),
    ...(conversationHistory || []).map((m) =>
      m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
    ),
  ];

  return { systemPrompt, formattedMessages };
}

/**
 * Node 2: LLM Execution Node
 * Executes the model using LangChain with multi-key Groq rotation and failover.
 */
async function llmExecutionNode(state: typeof IntakeGraphState.State) {
  const { formattedMessages } = state;
  const groqKeys = getGroqKeys();

  let rawLlmOutput = '';

  if (groqKeys.length > 0) {
    const attempts = groqKeys.length;
    for (let i = 0; i < attempts; i++) {
      const apiKey = getNextGroqKey(groqKeys);
      try {
        const model = createChatModel(apiKey);
        const response = await model.invoke(formattedMessages);
        rawLlmOutput = (response.content as string).trim();
        if (rawLlmOutput) break;
      } catch (err) {
        console.warn(`LangGraph: Groq key attempt ${i + 1} failed:`, err);
      }
    }
  }

  // Fallback to Ollama if Groq keys weren't available or failed
  if (!rawLlmOutput) {
    const fallbackModel = createChatModel();
    const response = await fallbackModel.invoke(formattedMessages);
    rawLlmOutput = (response.content as string).trim();
  }

  return { rawLlmOutput };
}

/**
 * Node 3: JSON Parser & Output Format Node
 * Extracts and cleans output, parsing JSON for turn mode or text for opener mode.
 */
async function jsonParserNode(state: typeof IntakeGraphState.State) {
  const { rawLlmOutput, mode } = state;

  // Clean thinking blocks & code fences
  let cleaned = rawLlmOutput.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }

  if (mode === 'opener') {
    return { openerQuestion: cleaned };
  }

  // Turn mode: extract JSON object
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }

  let parsedResponse: IntakeAgentResponse;
  try {
    parsedResponse = JSON.parse(cleaned) as IntakeAgentResponse;
  } catch {
    parsedResponse = {
      next_question:
        rawLlmOutput.replace(/<think>[\s\S]*?<\/think>/gi, '').trim().slice(0, 500) ||
        'Could you tell me more about that?',
      stage_complete: false,
      slot_fill_update: {},
    };
  }

  return { parsedResponse };
}

// ─── Build LangGraph StateGraph Workflow ──────────────────────────────────────

const workflow = new StateGraph(IntakeGraphState)
  .addNode('buildPrompt', promptBuilderNode)
  .addNode('executeLlm', llmExecutionNode)
  .addNode('parseJson', jsonParserNode)
  .addEdge(START, 'buildPrompt')
  .addEdge('buildPrompt', 'executeLlm')
  .addEdge('executeLlm', 'parseJson')
  .addEdge('parseJson', END);

export const langGraphIntakeApp = workflow.compile();

// ─── Exported Wrappers ────────────────────────────────────────────────────────

export async function runIntakeAgentWithLangGraph(params: {
  stage: number;
  department: string;
  conversationHistory: ConversationMessage[];
  departmentQuestions: DepartmentQuestionSet[];
  slotFillState: Record<string, unknown>;
}): Promise<IntakeAgentResponse> {
  const graphResult = await langGraphIntakeApp.invoke({
    stage: params.stage,
    department: params.department,
    conversationHistory: params.conversationHistory,
    departmentQuestions: params.departmentQuestions,
    slotFillState: params.slotFillState,
    mode: 'turn',
  });

  return (
    graphResult.parsedResponse ?? {
      next_question: 'Could you elaborate on that?',
      stage_complete: false,
      slot_fill_update: {},
    }
  );
}

export async function generateStageOpenerWithLangGraph(params: {
  stage: number;
  department: string;
  slotFillState: Record<string, unknown>;
}): Promise<string> {
  const graphResult = await langGraphIntakeApp.invoke({
    stage: params.stage,
    department: params.department,
    conversationHistory: [],
    departmentQuestions: [],
    slotFillState: params.slotFillState,
    mode: 'opener',
  });

  return (
    graphResult.openerQuestion ||
    `Let's move on to Stage ${params.stage}. Could you walk me through this part of your process?`
  );
}
