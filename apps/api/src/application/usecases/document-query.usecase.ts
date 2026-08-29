import { Injectable, NotFoundException } from '@nestjs/common';
import { Document, Chunk } from '../../domain/entities';

@Injectable()
export class DocumentQueryUseCase {
  private documents = new Map<string, Document>();

  async list(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  async getById(id: string): Promise<Document> {
    const doc = this.documents.get(id);
    if (!doc) {
      throw new NotFoundException(`Document not found: ${id}`);
    }
    return doc;
  }

  async getChunks(documentId: string): Promise<Chunk[]> {
    const doc = this.documents.get(documentId);
    if (!doc) {
      throw new NotFoundException(`Document not found: ${documentId}`);
    }

    // TODO: LanceDB から documentId でチャンクを直接取得する Query を実装する
    return [];
  }

  registerDocument(doc: Document): void {
    this.documents.set(doc.id, doc);
  }
}
