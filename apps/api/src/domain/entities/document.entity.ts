export class Document {
  constructor(
    public readonly id: string,
    public readonly filename: string,
    public readonly mimeType: string,
    public readonly size: number,
    public readonly chunkCount: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(params: { id: string; filename: string; mimeType: string; size: number }): Document {
    const now = new Date();
    return new Document(params.id, params.filename, params.mimeType, params.size, 0, now, now);
  }

  withChunkCount(count: number): Document {
    return new Document(
      this.id,
      this.filename,
      this.mimeType,
      this.size,
      count,
      this.createdAt,
      new Date(),
    );
  }
}
