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

@Injectable()
export class DocumentUploadUseCase {
  constructor(
    @Inject(EMBEDDING_COMMAND)
    private readonly embedding: EmbeddingCommand,
    @Inject(VECTOR_STORE_COMMAND)
    private readonly vectorStoreCommand: VectorStoreCommand,
    @Inject(DOCUMENT_COMMANDS)
    private readonly loaders: DocumentCommand[],
  ) {}

  async execute(file: Buffer, filename: string, mimeType: string): Promise<Document> {
    if (!SUPPORTED_MIME_TYPES.includes(mimeType as (typeof SUPPORTED_MIME_TYPES)[number])) {
      throw new BadRequestException(`Unsupported file type: ${mimeType}`);
    }

    const loader = this.loaders.find((l) => l.supports(mimeType));
    if (!loader) {
      throw new BadRequestException(`No loader available for: ${mimeType}`);
    }

    const docId = randomUUID();
    const chunks = await loader.load(file, filename);
    const vectors = await this.embedding.embedBatch(chunks.map((c) => c.content));

    for (let i = 0; i < chunks.length; i++) {
      const chunkId = `${docId}-chunk-${i}`;
      await this.vectorStoreCommand.upsert(chunkId, vectors[i], {
        documentId: docId,
        content: chunks[i].content,
        ...chunks[i].metadata,
      });
    }

    const doc = Document.create({ id: docId, filename, mimeType, size: file.length });
    return doc.withChunkCount(chunks.length);
  }
}
