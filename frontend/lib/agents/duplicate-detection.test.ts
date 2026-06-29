import { describe, it, expect } from 'vitest';
import { chunkText, selectRelevantChunks } from '../rag/document-chunker';

describe('LangChain Document Chunker & Vector Relevance Filter', () => {
  it('should split long document text into clean overlapping chunks', () => {
    const longText = Array.from({ length: 50 }, (_, i) => `Paragraph ${i + 1}: Detailed SOP workflow step for processing automated user intake.`).join('\n\n');

    const chunks = chunkText(longText, { chunkSize: 300, chunkOverlap: 50 });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].pageContent).toContain('Paragraph 1');
  });

  it('should select top-K relevant chunks based on query intent', () => {
    const text = `
    Section A: General company background and team introduction.
    Section B: Current manual process takes 15 hours per week across 4 headcount.
    Section C: Tools used include Salesforce CRM and Excel macros.
    Section D: Expected annual ROI savings estimated at $45,000.
    `;

    const chunks = chunkText(text, { chunkSize: 150, chunkOverlap: 20 });
    const relevantROI = selectRelevantChunks(chunks, 'ROI savings cost dollars hours', 2);

    expect(relevantROI.length).toBeLessThanOrEqual(2);
    const combinedContent = relevantROI.map((c) => c.pageContent).join(' ');
    expect(combinedContent).toMatch(/ROI|\$45,000|hours/i);
  });

  it('should return empty chunks for empty input', () => {
    const chunks = chunkText('');
    expect(chunks).toEqual([]);
  });
});
