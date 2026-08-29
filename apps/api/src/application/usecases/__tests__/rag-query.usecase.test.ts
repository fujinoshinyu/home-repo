import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RagQueryUseCase } from '../rag-query.usecase';
import type { EmbeddingCommand, GenerationCommand, VectorStoreQuery } from '../../../domain/ports';

describe('RagQueryUseCase', () => {
  let useCase: RagQueryUseCase;
  let mockEmbedding: EmbeddingCommand;
  let mockGeneration: GenerationCommand;
  let mockVectorStore: VectorStoreQuery;

  beforeEach(() => {
    mockEmbedding = {
      embed: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
      embedBatch: vi.fn().mockResolvedValue([[0.1, 0.2]]),
    };
    mockGeneration = {
      generate: vi.fn().mockResolvedValue('This is the answer'),
      generateStream: vi.fn(),
    };
    mockVectorStore = {
      search: vi.fn().mockResolvedValue([
        { id: 'chunk-1', vector: [0.1], metadata: { content: 'context 1', source: 'doc.md' }, score: 0.95 },
        { id: 'chunk-2', vector: [0.2], metadata: { content: 'context 2', source: 'doc.md' }, score: 0.85 },
      ]),
    };

    useCase = new RagQueryUseCase(mockEmbedding, mockGeneration, mockVectorStore);
  });

  it('should execute query flow: embed → search → generate', async () => {
    const result = await useCase.execute('What is RAG?');

    expect(mockEmbedding.embed).toHaveBeenCalledWith('What is RAG?');
    expect(mockVectorStore.search).toHaveBeenCalledWith([0.1, 0.2, 0.3], 5);
    expect(mockGeneration.generate).toHaveBeenCalledWith('What is RAG?', ['context 1', 'context 2']);
    expect(result.answer).toBe('This is the answer');
    expect(result.sources).toHaveLength(2);
    expect(result.sources[0].source).toBe('doc.md');
  });

  it('should return sources with scores', async () => {
    const result = await useCase.execute('test');

    expect(result.sources[0].score).toBe(0.95);
    expect(result.sources[1].score).toBe(0.85);
  });
});
