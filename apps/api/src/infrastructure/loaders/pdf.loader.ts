import { Injectable } from '@nestjs/common';
import { DocumentCommand } from '../../domain/ports';
import { DocumentChunk } from '../../domain/value-objects';
import { CHUNK_DEFAULTS } from '@home-repo/shared';

@Injectable()
export class PdfLoader implements DocumentCommand {
  supports(mimeType: string): boolean {
    return mimeType === 'application/pdf';
  }

  async load(file: Buffer, filename: string): Promise<DocumentChunk[]> {
    // PDF parsing requires a library like pdf-parse
    // For now, return a placeholder that will be implemented when pdf-parse is added
    const content = file.toString('utf-8');
    const chunks = this.chunkText(content, CHUNK_DEFAULTS.MAX_SIZE, CHUNK_DEFAULTS.OVERLAP);

    return chunks.map(
      (chunk, i) =>
        new DocumentChunk(chunk, {
          source: filename,
          page: i + 1,
          chunkIndex: i,
        }),
    );
  }

  private chunkText(text: string, maxSize: number, overlap: number): string[] {
    if (text.length <= maxSize) return [text];

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + maxSize, text.length);
      chunks.push(text.slice(start, end));
      if (end === text.length) break;
      start = end - overlap;
    }

    return chunks;
  }
}
