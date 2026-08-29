import { DocumentChunk } from '../../value-objects/document-chunk.vo';

export interface DocumentCommand {
  load(file: Buffer, filename: string): Promise<DocumentChunk[]>;
  supports(mimeType: string): boolean;
}
