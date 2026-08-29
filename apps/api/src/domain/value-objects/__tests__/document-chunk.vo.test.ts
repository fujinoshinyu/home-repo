import { describe, it, expect } from 'vitest';
import { DocumentChunk } from '../document-chunk.vo';

describe('DocumentChunk', () => {
  it('should create a DocumentChunk with content and metadata', () => {
    const chunk = new DocumentChunk('Hello world', {
      source: 'test.md',
      section: 'Introduction',
      chunkIndex: 0,
    });

    expect(chunk.content).toBe('Hello world');
    expect(chunk.metadata.source).toBe('test.md');
    expect(chunk.metadata.section).toBe('Introduction');
    expect(chunk.metadata.chunkIndex).toBe(0);
  });

  it('should handle optional page and section', () => {
    const chunk = new DocumentChunk('Content', {
      source: 'doc.pdf',
      chunkIndex: 3,
    });

    expect(chunk.metadata.page).toBeUndefined();
    expect(chunk.metadata.section).toBeUndefined();
    expect(chunk.metadata.chunkIndex).toBe(3);
  });
});
