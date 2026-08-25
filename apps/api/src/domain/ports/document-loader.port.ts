import { DocumentChunk } from '../value-objects/document-chunk.vo';

export interface DocumentLoaderPort {
  load(file: Buffer, filename: string): Promise<DocumentChunk[]>;
  supports(mimeType: string): boolean;
}
