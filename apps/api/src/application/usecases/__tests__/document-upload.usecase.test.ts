import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentUploadUseCase } from '../document-upload.usecase';
import { DocumentQueryUseCase } from '../document-query.usecase';
import { UploadJobService } from '../../services/upload-job.service';
import type { EmbeddingCommand, VectorStoreCommand, DocumentCommand } from '../../../domain/ports';

describe('DocumentUploadUseCase', () => {
  let useCase: DocumentUploadUseCase;
  let mockEmbedding: EmbeddingCommand;
  let mockVectorStoreCommand: VectorStoreCommand;
  let mockLoaders: DocumentCommand[];
  let jobService: UploadJobService;
  let documentQueryUseCase: DocumentQueryUseCase;

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
    jobService = new UploadJobService();
    documentQueryUseCase = new DocumentQueryUseCase();

    useCase = new DocumentUploadUseCase(mockEmbedding, mockVectorStoreCommand, mockLoaders, jobService, documentQueryUseCase);
  });

  it('should create job and process upload in background', async () => {
    const file = Buffer.from('# Test\nHello world');
    const jobId = useCase.createJob(file, 'test.md', 'text/markdown');

    expect(jobId).toBeTruthy();
    expect(jobService.get(jobId)).toBeTruthy();

    // Wait for background processing
    await vi.waitFor(() => {
      const job = jobService.get(jobId);
      expect(job?.status).toBe('completed');
    });

    const job = jobService.get(jobId)!;
    expect(job.document?.filename).toBe('test.md');
    expect(job.document?.mimeType).toBe('text/markdown');
    expect(job.document?.chunkCount).toBe(2);
    expect(mockEmbedding.embedBatch).toHaveBeenCalledWith(['chunk 1 content', 'chunk 2 content']);
    expect(mockVectorStoreCommand.upsert).toHaveBeenCalledTimes(2);

    // Verify document is registered in query use case
    const docs = await documentQueryUseCase.list();
    expect(docs).toHaveLength(1);
    expect(docs[0].filename).toBe('test.md');
  });

  it('should throw BadRequestException for unsupported mime type', () => {
    const file = Buffer.from('test');
    expect(() => useCase.createJob(file, 'test.exe', 'application/exe')).toThrow(
      'Unsupported file type',
    );
  });
});
