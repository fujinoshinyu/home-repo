import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { EmbeddingCommand } from '../../domain/ports';
import { ollamaConfig } from '../config';

@Injectable()
export class OllamaEmbeddingAdapter implements EmbeddingCommand {
  constructor(
    @Inject(ollamaConfig.KEY)
    private readonly config: ConfigType<typeof ollamaConfig>,
  ) {}

  async embed(text: string): Promise<number[]> {
    const response = await fetch(`${this.config.url}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.embeddingModel,
        prompt: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama embedding failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { embedding: number[] };
    return data.embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const batchSize = 5;
    const results: number[][] = [];
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map((text) => this.embed(text)));
      results.push(...batchResults);
    }
    return results;
  }
}
