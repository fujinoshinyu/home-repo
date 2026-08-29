import { Injectable, Inject } from '@nestjs/common';
import {
  EmbeddingCommand,
  GenerationCommand,
  VectorStoreQuery,
} from '../../domain/ports';
import {
  EMBEDDING_COMMAND,
  GENERATION_COMMAND,
  VECTOR_STORE_QUERY,
} from '../../infrastructure/infrastructure.module';

@Injectable()
export class RagQueryUseCase {
  constructor(
    @Inject(EMBEDDING_COMMAND)
    private readonly embedding: EmbeddingCommand,
    @Inject(GENERATION_COMMAND)
    private readonly generation: GenerationCommand,
    @Inject(VECTOR_STORE_QUERY)
    private readonly vectorStore: VectorStoreQuery,
  ) {}

  async execute(question: string): Promise<{ answer: string; sources: Array<{ id: string; source: string; score: number }> }> {
    const questionVector = await this.embedding.embed(question);
    const searchResults = await this.vectorStore.search(questionVector, 5);

    const contexts = searchResults.map((r) => r.metadata.content as string ?? '');
    const answer = await this.generation.generate(question, contexts);

    return {
      answer,
      sources: searchResults.map((r) => ({
        id: r.id,
        source: (r.metadata.source as string) ?? 'unknown',
        score: r.score,
      })),
    };
  }

  async *executeStream(question: string): AsyncGenerator<{ type: string; token?: string; sources?: Array<{ id: string; source: string; score: number }> }> {
    const questionVector = await this.embedding.embed(question);
    const searchResults = await this.vectorStore.search(questionVector, 5);

    const contexts = searchResults.map((r) => r.metadata.content as string ?? '');

    for await (const token of this.generation.generateStream(question, contexts)) {
      yield { type: 'token', token };
    }

    yield {
      type: 'sources',
      sources: searchResults.map((r) => ({
        id: r.id,
        source: (r.metadata.source as string) ?? 'unknown',
        score: r.score,
      })),
    };

    yield { type: 'done' };
  }
}
