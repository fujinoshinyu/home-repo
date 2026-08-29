import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ollamaConfig, lancedbConfig } from './config';
import { OllamaEmbeddingAdapter, OllamaGenerationAdapter } from './ollama';
import { LanceConnection, LanceVectorStoreCommandAdapter, LanceVectorStoreQueryAdapter } from './lancedb';
import { MarkdownLoader, PdfLoader } from './loaders';

// Command tokens
const EMBEDDING_COMMAND = 'EmbeddingCommand';
const GENERATION_COMMAND = 'GenerationCommand';
const VECTOR_STORE_COMMAND = 'VectorStoreCommand';
const DOCUMENT_COMMANDS = 'DocumentCommands';

// Query tokens
const VECTOR_STORE_QUERY = 'VectorStoreQuery';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [ollamaConfig, lancedbConfig],
    }),
  ],
  providers: [
    // Shared
    LanceConnection,
    // Adapters
    OllamaEmbeddingAdapter,
    OllamaGenerationAdapter,
    LanceVectorStoreCommandAdapter,
    LanceVectorStoreQueryAdapter,
    MarkdownLoader,
    PdfLoader,
    // Command bindings
    { provide: EMBEDDING_COMMAND, useExisting: OllamaEmbeddingAdapter },
    { provide: GENERATION_COMMAND, useExisting: OllamaGenerationAdapter },
    { provide: VECTOR_STORE_COMMAND, useExisting: LanceVectorStoreCommandAdapter },
    {
      provide: DOCUMENT_COMMANDS,
      useFactory: (markdown: MarkdownLoader, pdf: PdfLoader) => [markdown, pdf],
      inject: [MarkdownLoader, PdfLoader],
    },
    // Query bindings
    { provide: VECTOR_STORE_QUERY, useExisting: LanceVectorStoreQueryAdapter },
  ],
  exports: [
    EMBEDDING_COMMAND,
    GENERATION_COMMAND,
    VECTOR_STORE_COMMAND,
    DOCUMENT_COMMANDS,
    VECTOR_STORE_QUERY,
  ],
})
export class InfrastructureModule {}

export {
  EMBEDDING_COMMAND,
  GENERATION_COMMAND,
  VECTOR_STORE_COMMAND,
  DOCUMENT_COMMANDS,
  VECTOR_STORE_QUERY,
};
