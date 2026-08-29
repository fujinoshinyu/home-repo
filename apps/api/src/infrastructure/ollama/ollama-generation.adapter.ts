import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { GenerationCommand } from '../../domain/ports';
import { ollamaConfig } from '../config';

@Injectable()
export class OllamaGenerationAdapter implements GenerationCommand {
  constructor(
    @Inject(ollamaConfig.KEY)
    private readonly config: ConfigType<typeof ollamaConfig>,
  ) {}

  async generate(prompt: string, context: string[]): Promise<string> {
    const response = await fetch(`${this.config.url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.generationModel,
        messages: [
          {
            role: 'system',
            content: this.buildSystemPrompt(context),
          },
          { role: 'user', content: prompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama generation failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { message: { content: string } };
    return data.message.content;
  }

  async *generateStream(prompt: string, context: string[]): AsyncGenerator<string> {
    const response = await fetch(`${this.config.url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.generationModel,
        messages: [
          {
            role: 'system',
            content: this.buildSystemPrompt(context),
          },
          { role: 'user', content: prompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama stream failed: ${response.status} ${response.statusText}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop()!;

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line) as { message?: { content?: string }; done?: boolean };
          if (parsed.message?.content) {
            yield parsed.message.content;
          }
          if (parsed.done) return;
        } catch {
          // skip malformed lines
        }
      }
    }
  }

  private buildSystemPrompt(context: string[]): string {
    return [
      '以下のコンテキストを参考にして、ユーザーの質問に回答してください。',
      'コンテキストに情報がない場合は、その旨を伝えてください。',
      '',
      '--- コンテキスト ---',
      ...context,
      '--- コンテキスト終了 ---',
    ].join('\n');
  }
}
