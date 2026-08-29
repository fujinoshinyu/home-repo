import { SearchResult } from '../../value-objects/search-result.vo';

export interface VectorStoreQuery {
  search(vector: number[], topK: number, filter?: Record<string, unknown>): Promise<SearchResult[]>;
}
