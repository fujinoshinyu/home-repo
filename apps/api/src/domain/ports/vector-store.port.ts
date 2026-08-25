import { SearchResult } from '../value-objects/search-result.vo';

export interface VectorStorePort {
  upsert(id: string, vector: number[], metadata: Record<string, unknown>): Promise<void>;
  search(vector: number[], topK: number, filter?: Record<string, unknown>): Promise<SearchResult[]>;
  delete(id: string): Promise<void>;
  deleteByDocumentId(documentId: string): Promise<void>;
}
