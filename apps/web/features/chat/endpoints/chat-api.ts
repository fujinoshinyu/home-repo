import { createJsonClient } from '@/lib/api/factory';

const client = createJsonClient();

export interface RagQueryResponse {
  answer: string;
  sources: Array<{ id: string; source: string; score: number }>;
}

export interface RagStreamChunk {
  type: 'token' | 'sources' | 'done';
  token?: string;
  sources?: Array<{ id: string; source: string; score: number }>;
}

export async function queryRag(question: string): Promise<RagQueryResponse> {
  return client.post<RagQueryResponse>('/rag/query', { question });
}

export async function streamRag(question: string) {
  const reader = await client.postStream('/rag/stream', { question });
  const decoder = new TextDecoder();

  return {
    async *[Symbol.asyncIterator]() {
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop()!;
        for (const line of lines) {
          if (line.trim()) yield JSON.parse(line) as RagStreamChunk;
        }
      }
    },
  };
}
