import { registerAs } from '@nestjs/config';
import { OLLAMA_DEFAULTS } from '@home-repo/shared';

export const ollamaConfig = registerAs('ollama', () => ({
  url: process.env.OLLAMA_URL ?? OLLAMA_DEFAULTS.URL,
  embeddingModel: process.env.OLLAMA_EMBEDDING_MODEL ?? OLLAMA_DEFAULTS.EMBEDDING_MODEL,
  generationModel: process.env.OLLAMA_GENERATION_MODEL ?? OLLAMA_DEFAULTS.GENERATION_MODEL,
}));
