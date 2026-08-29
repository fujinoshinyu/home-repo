import { describe, it, expect } from 'vitest';
import { Chunk } from '../chunk.entity';

describe('Chunk', () => {
  it('should create a Chunk with create()', () => {
    const chunk = Chunk.create({
      id: 'chunk-1',
      documentId: 'doc-1',
      content: 'Hello world',
    });

    expect(chunk.id).toBe('chunk-1');
    expect(chunk.documentId).toBe('doc-1');
    expect(chunk.content).toBe('Hello world');
    expect(chunk.metadata).toEqual({});
  });

  it('should create a Chunk with metadata', () => {
    const chunk = Chunk.create({
      id: 'chunk-2',
      documentId: 'doc-1',
      content: 'Content',
      metadata: { source: 'test.md', page: 1 },
    });

    expect(chunk.metadata).toEqual({ source: 'test.md', page: 1 });
  });
});
