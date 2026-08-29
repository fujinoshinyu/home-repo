export interface GenerationCommand {
  generate(prompt: string, context: string[]): Promise<string>;
  generateStream(prompt: string, context: string[]): AsyncGenerator<string>;
}
