import { Injectable } from '@nestjs/common';
import { DocumentCommand } from '../../domain/ports';
import { DocumentChunk } from '../../domain/value-objects';
import { CHUNK_DEFAULTS } from '@home-repo/shared';

@Injectable()
export class MarkdownLoader implements DocumentCommand {
  supports(mimeType: string): boolean {
    return mimeType === 'text/markdown' || mimeType === 'text/plain';
  }

  async load(file: Buffer, filename: string): Promise<DocumentChunk[]> {
    const content = file.toString('utf-8');
    const sections = this.splitByHeadings(content);
    const chunks: DocumentChunk[] = [];

    for (const section of sections) {
      const sectionChunks = this.chunkText(section.content, CHUNK_DEFAULTS.MAX_SIZE, CHUNK_DEFAULTS.OVERLAP);
      for (let i = 0; i < sectionChunks.length; i++) {
        chunks.push(
          new DocumentChunk(sectionChunks[i], {
            source: filename,
            section: section.heading,
            chunkIndex: chunks.length,
          }),
        );
      }
    }

    return chunks;
  }

  private splitByHeadings(content: string): Array<{ heading: string; content: string }> {
    const lines = content.split('\n');
    const sections: Array<{ heading: string; content: string }> = [];
    let currentHeading = '';
    let currentContent: string[] = [];

    for (const line of lines) {
      if (line.startsWith('#')) {
        if (currentContent.length > 0) {
          sections.push({ heading: currentHeading, content: currentContent.join('\n').trim() });
        }
        currentHeading = line.replace(/^#+\s*/, '');
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }

    if (currentContent.length > 0) {
      sections.push({ heading: currentHeading, content: currentContent.join('\n').trim() });
    }

    return sections.filter((s) => s.content.length > 0);
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
