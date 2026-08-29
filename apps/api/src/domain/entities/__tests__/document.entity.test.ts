import { describe, it, expect } from 'vitest';
import { Document } from '../document.entity';

describe('Document', () => {
  it('should create a Document with create()', () => {
    const doc = Document.create({
      id: 'doc-1',
      filename: 'test.md',
      mimeType: 'text/markdown',
      size: 1024,
    });

    expect(doc.id).toBe('doc-1');
    expect(doc.filename).toBe('test.md');
    expect(doc.mimeType).toBe('text/markdown');
    expect(doc.size).toBe(1024);
    expect(doc.chunkCount).toBe(0);
    expect(doc.createdAt).toBeInstanceOf(Date);
    expect(doc.updatedAt).toBeInstanceOf(Date);
  });

  it('should create a new Document with updated chunkCount via withChunkCount()', () => {
    const doc = Document.create({
      id: 'doc-1',
      filename: 'test.md',
      mimeType: 'text/markdown',
      size: 1024,
    });

    const updated = doc.withChunkCount(5);

    expect(updated.chunkCount).toBe(5);
    expect(updated.id).toBe('doc-1');
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(doc.updatedAt.getTime());
  });
});
