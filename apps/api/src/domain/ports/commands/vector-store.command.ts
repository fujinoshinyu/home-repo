export interface VectorStoreCommand {
  upsert(id: string, vector: number[], metadata: Record<string, unknown>): Promise<void>;
  delete(id: string): Promise<void>;
  deleteByDocumentId(documentId: string): Promise<void>;
}
