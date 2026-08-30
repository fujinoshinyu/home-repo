import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  EmbeddingCommand,
  VectorStoreCommand,
  DocumentCommand,
} from '../../domain/ports';
import { Document } from '../../domain/entities';
import {
  EMBEDDING_COMMAND,
  VECTOR_STORE_COMMAND,
  DOCUMENT_COMMANDS,
} from '../../infrastructure/infrastructure.module';
import { SUPPORTED_MIME_TYPES } from '@home-repo/shared';
import { UploadJobService } from '../services/upload-job.service';

@Injectable()
export class DocumentUploadUseCase {
  constructor(
    @Inject(EMBEDDING_COMMAND)
    private readonly embedding: EmbeddingCommand,
    @Inject(VECTOR_STORE_COMMAND)
    private readonly vectorStoreCommand: VectorStoreCommand,
    @Inject(DOCUMENT_COMMANDS)
    private readonly loaders: DocumentCommand[],
    private readonly uploadJobService: UploadJobService,
  ) {}

  createJob(file: Buffer, filename: string, mimeType: string): string {
    if (!SUPPORTED_MIME_TYPES.includes(mimeType as (typeof SUPPORTED_MIME_TYPES)[number])) {
      throw new BadRequestException(`Unsupported file type: ${mimeType}`);
    }

    const loader = this.loaders.find((l) => l.supports(mimeType));
    if (!loader) {
      throw new BadRequestException(`No loader available for: ${mimeType}`);
    }

    const jobId = randomUUID();
    this.uploadJobService.create(jobId, 0);

    this.processJob(jobId, file, filename, mimeType).catch((err) => {
      this.uploadJobService.markFailed(jobId, err.message);
    });

    return jobId;
  }

  private async processJob(jobId: string, file: Buffer, filename: string, mimeType: string): Promise<void> {
    const loader = this.loaders.find((l) => l.supports(mimeType))!;

    const docId = randomUUID();
    const chunks = await loader.load(file, filename);

    this.uploadJobService.markProcessing(jobId, chunks.length);

    const batchSize = 5;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const vectors = await this.embedding.embedBatch(batch.map((c) => c.content));

      for (let j = 0; j < batch.length; j++) {
        const chunkId = `${docId}-chunk-${i + j}`;
        await this.vectorStoreCommand.upsert(chunkId, vectors[j], {
          documentId: docId,
          content: batch[j].content,
          ...batch[j].metadata,
        });
        this.uploadJobService.incrementProgress(jobId);
      }
    }

    const doc = Document.create({ id: docId, filename, mimeType, size: file.length });
    this.uploadJobService.markCompleted(jobId, doc.withChunkCount(chunks.length));
  }
}
