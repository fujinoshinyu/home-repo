export class SearchResult {
  constructor(
    public readonly id: string,
    public readonly vector: number[],
    public readonly metadata: Record<string, unknown>,
    public readonly score: number,
  ) {}
}
