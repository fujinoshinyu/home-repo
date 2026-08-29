import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentUploadUseCase } from '../document-upload.usecase';
import type { EmbeddingCommand, VectorStoreCommand, DocumentCommand } from '../../../domain/ports';

describe('DocumentUploadUseCase', () => {
  let useCase: DocumentUploadUseCase;
  let mockEmbedding: EmbeddingCommand;
  let mockVectorStoreCommand: VectorStoreCommand;
  let mockLoaders: DocumentCommand[];

  beforeEach(() => {
    mockEmbedding = {
      embed: vi.fn(),
      embedBatch: vi.fn().mockResolvedValue([[0.1, 0.2], [0.3, 0.4]]),
    };
    mockVectorStoreCommand = {
      upsert: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
      deleteByDocumentId: vi.fn(),
    };
    mockLoaders = [
      {
        supports: vi.fn().mockImplementation((mime: string) => mime === 'text/markdown'),
        load: vi.fn().mockResolvedValue([
          { content: 'chunk 1 content', metadata: { source: 'test.md', chunkIndex: 0 } },
          { content: 'chunk 2 content', metadata: { source: 'test.md', chunkIndex: 1 } },
        ]),
      },
    ];

    useCase = new DocumentUploadUseCase(mockEmbedding, mockVectorStoreCommand, mockLoaders);
  });

  it('should upload document: parse → embed → store', async () => {
    const file = Buffer.from('# Test\nHello world');
    const result = await useCase.execute(file, 'test.md', 'text/markdown');

    expect(result.filename).toBe('test.md');
    expect(result.mimeType).toBe('text/markdown');
    expect(result.chunkCount).toBe(2);
    expect(mockEmbedding.embedBatch).toHaveBeenCalledWith(['chunk 1 content', 'chunk 2 content']);
    expect(mockVectorStoreCommand.upsert).toHaveBeenCalledTimes(2);
  });

  it('should throw BadRequestException for unsupported mime type', async () => {
    const file = Buffer.from('test');

    await expect(useCase.execute(file, 'test.exe', 'application/exe')).rejects.toThrow(
      'Unsupported file type',
    );
  });
});
