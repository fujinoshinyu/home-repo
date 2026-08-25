export class DocumentChunk {
  constructor(
    public readonly content: string,
    public readonly metadata: {
      source: string;
      page?: number;
      section?: string;
      chunkIndex: number;
    },
  ) {}
}
