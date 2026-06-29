// Task 7.3 — LangChain Document Chunker & Vector Relevance Filter (RAG Chain)
// Splits large document text into vector-searchable text chunks and retrieves top-K relevant chunks
// to minimize token usage and maximize response precision.

import { Document } from '@langchain/core/documents';

export interface DocumentChunk {
  chunkIndex: number;
  text: string;
  tokenEstimate: number;
  score?: number;
}

export interface ChunkingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

/**
 * Split a raw text document into clean overlapping text chunks (LangChain Document style).
 */
export function chunkText(text: string, options: ChunkingOptions = {}): Document[] {
  const chunkSize = options.chunkSize || 600;
  const chunkOverlap = options.chunkOverlap || 100;

  if (!text || text.trim().length === 0) {
    return [];
  }

  const cleaned = text.replace(/\r\n/g, '\n').trim();
  const paragraphs = cleaned.split(/\n\n+/);
  const chunks: Document[] = [];
  let currentChunk = '';
  let chunkIdx = 0;

  for (const para of paragraphs) {
    if ((currentChunk + '\n\n' + para).length <= chunkSize) {
      currentChunk = currentChunk ? `${currentChunk}\n\n${para}` : para;
    } else {
      if (currentChunk.trim()) {
        chunks.push(
          new Document({
            pageContent: currentChunk.trim(),
            metadata: { chunkIndex: chunkIdx++ },
          })
        );
      }

      // If single paragraph is larger than chunkSize, hard split by sentences/lines
      if (para.length > chunkSize) {
        let start = 0;
        while (start < para.length) {
          const end = Math.min(start + chunkSize, para.length);
          const subText = para.slice(start, end);
          chunks.push(
            new Document({
              pageContent: subText.trim(),
              metadata: { chunkIndex: chunkIdx++ },
            })
          );
          start += chunkSize - chunkOverlap;
        }
        currentChunk = '';
      } else {
        currentChunk = para;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(
      new Document({
        pageContent: currentChunk.trim(),
        metadata: { chunkIndex: chunkIdx++ },
      })
    );
  }

  return chunks;
}

/**
 * Perform relevance scoring on document chunks against a query (e.g. Stage intent).
 * Selects top-K most relevant chunks to feed into LLM prompt with minimum token footprint.
 */
export function selectRelevantChunks(
  chunks: Document[],
  query: string,
  topK = 4
): Document[] {
  if (chunks.length <= topK) {
    return chunks;
  }

  const queryTerms = query.toLowerCase().split(/\W+/).filter((t) => t.length > 2);

  const scored = chunks.map((doc) => {
    const text = doc.pageContent.toLowerCase();
    let score = 0;

    for (const term of queryTerms) {
      const matches = (text.match(new RegExp(term, 'g')) || []).length;
      score += matches * 2;
    }

    // Boost chunks with numbers/metrics if query looks for ROI/metrics
    if (/hours|dollars|cost|people|frequency|time|percent|\$|\d+/i.test(query)) {
      const numberCount = (text.match(/\d+/g) || []).length;
      score += numberCount * 1.5;
    }

    return { doc, score };
  });

  // Sort descending by relevance score
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK).map((s) => s.doc);
}
