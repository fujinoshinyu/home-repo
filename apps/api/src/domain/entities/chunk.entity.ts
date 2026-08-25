export class Chunk {
  constructor(
    public readonly id: string,
    public readonly documentId: string,
    public readonly content: string,
    public readonly metadata: Record<string, unknown>,
  ) {}

  static create(params: {
    id: string;
    documentId: string;
    content: string;
    metadata?: Record<string, unknown>;
  }): Chunk {
    return new Chunk(params.id, params.documentId, params.content, params.metadata ?? {});
  }
}
