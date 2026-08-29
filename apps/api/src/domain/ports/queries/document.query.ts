import { Document } from '../../entities/document.entity';
import { Chunk } from '../../entities/chunk.entity';

export interface DocumentQuery {
  list(): Promise<Document[]>;
  getById(id: string): Promise<Document | null>;
  getChunks(documentId: string): Promise<Chunk[]>;
}
