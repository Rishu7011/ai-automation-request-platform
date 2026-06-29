// AI Intake Agent (LangGraph & LangChain StateGraph Orchestration)
// Wraps the LangGraph StateGraph pipeline for multi-key Groq Cloud API execution and Ollama fallback.

import {
  runIntakeAgentWithLangGraph,
  generateStageOpenerWithLangGraph,
  ConversationMessage,
  IntakeAgentResponse,
  DepartmentQuestionSet,
} from './langgraph-intake-agent';

export type { ConversationMessage, IntakeAgentResponse, DepartmentQuestionSet };

/**
 * AI Intake Agent — drives the multi-stage conversational interview using LangGraph.
 */
export async function runIntakeAgent(params: {
  stage: number;
  department: string;
  conversationHistory: ConversationMessage[];
  departmentQuestions: DepartmentQuestionSet[];
  slotFillState: Record<string, unknown>;
}): Promise<IntakeAgentResponse> {
  return runIntakeAgentWithLangGraph(params);
}

/**
 * Generate stage opener greeting question using LangGraph.
 */
export async function generateStageOpener(params: {
  stage: number;
  department: string;
  slotFillState: Record<string, unknown>;
}): Promise<string> {
  return generateStageOpenerWithLangGraph(params);
}
