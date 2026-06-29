// Task 7.3 — Document Analysis Agent with LangChain Chunker Chain
// Analyzes uploaded SOPs, spreadsheets, images, or documents.
// Uses LangChain text chunking + vector relevance scoring to send only relevant context chunks
// to the LLM for token-efficient, high-precision extractions.

import { callLlm, parseJsonSafe } from './llm-client';
import { chunkText, selectRelevantChunks } from '../rag/document-chunker';

export interface DocumentAnalysisInput {
  filename: string;
  mimeType: string;
  stage: number;
  department: string;
  fileTextContent?: string;
}

export interface DocumentAnalysisResult {
  summary: string;
  extractedFields: Record<string, unknown>;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  suggestedMessage?: string;
  chunksProcessed?: number;
}

const STAGE_QUERIES: Record<number, string> = {
  1: 'business problem goals outcome objective',
  2: 'workflow step process current bottleneck manual procedure',
  3: 'existing tools software apps systems CRM ERP database',
  4: 'pain points friction delays errors manual effort frustration',
  5: 'metrics KPI hours frequency occurrence volume time',
  6: 'ROI salary cost dollars rate people headcount savings',
  7: 'compliance security risk PII GDPR regulation audit',
  8: 'summary review confirmation final details',
};

export async function runDocumentAnalysisAgent(
  input: DocumentAnalysisInput
): Promise<DocumentAnalysisResult> {
  const { filename, mimeType, stage, department, fileTextContent } = input;

  let selectedContent = '';
  let chunksProcessed = 0;

  if (fileTextContent && fileTextContent.trim().length > 0) {
    // ── LangChain Chunking & Vector Relevance Retrieval Chain ──
    const allChunks = chunkText(fileTextContent, { chunkSize: 600, chunkOverlap: 100 });
    const query = STAGE_QUERIES[stage] || 'process workflow metrics tools';
    const topChunks = selectRelevantChunks(allChunks, query, 4);

    chunksProcessed = topChunks.length;
    selectedContent = topChunks.map((doc, idx) => `--- Chunk ${idx + 1} ---\n${doc.pageContent}`).join('\n\n');
  }

  const systemPrompt = `You are an expert Enterprise Automation Document Analysis Agent using a LangChain RAG vector retrieval chain.
Your job is to analyze uploaded documentation (SOPs, process specs, spreadsheet dumps, or text extracts) for a request from the "${department}" department during Stage ${stage} of the intake process.

Extract actionable insights from the provided document chunks and return structured JSON matching this schema:
{
  "summary": "Brief 1-2 sentence overview of what this file describes",
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "suggestedMessage": "Friendly message summarizing what was extracted for the intake interview",
  "extractedFields": {
    "processDescription": "Extracted process steps or workflow details if applicable",
    "toolsUsed": ["List", "of", "software", "tools"],
    "painPoints": ["List", "of", "inefficiencies", "or", "bottlenecks"],
    "peopleInvolved": number or null,
    "hoursPerOccurrence": number or null,
    "frequencyPerYear": number or null,
    "desiredOutcome": "Extracted goals or expected benefits"
  }
}

Guidelines:
- Base analysis on the selected relevant chunks.
- If content is missing or low-quality, set confidence to "LOW".
- Return ONLY valid JSON matching the schema. No markdown formatting.`;

  const contentPrompt = `File Name: ${filename}
MIME Type: ${mimeType}
Current Intake Stage: ${stage}
Relevant Vector Document Chunks (Token-Optimized Context):
${selectedContent || '[No raw text extracted. Base analysis on filename and context.]'}`;

  try {
    const rawOutput = await callLlm(systemPrompt, [
      { role: 'user', content: contentPrompt },
    ]);
    const parsed = parseJsonSafe<DocumentAnalysisResult>(rawOutput);

    if (parsed && parsed.summary) {
      return {
        summary: parsed.summary,
        extractedFields: parsed.extractedFields || {},
        confidence: parsed.confidence || 'MEDIUM',
        suggestedMessage: parsed.suggestedMessage || `I analyzed "${filename}" using vector document chunking and extracted key details.`,
        chunksProcessed,
      };
    }
  } catch (err) {
    console.error('[Document Analysis Agent] Failed:', err);
  }

  return {
    summary: `Uploaded document "${filename}" attached.`,
    extractedFields: {},
    confidence: 'LOW',
    suggestedMessage: `Uploaded document "${filename}" was attached to stage ${stage}.`,
    chunksProcessed,
  };
}
