import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { RagQueryUseCase } from '../../application/usecases/rag-query.usecase';
import { QueryRagDto } from '../dto/query-rag.dto';

@Controller('rag')
export class RagController {
  constructor(private readonly ragQueryUseCase: RagQueryUseCase) {}

  @Post('query')
  async query(@Body() dto: QueryRagDto) {
    return this.ragQueryUseCase.execute(dto.question);
  }

  @Post('stream')
  async stream(@Body() dto: QueryRagDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Transfer-Encoding', 'chunked');

    for await (const chunk of this.ragQueryUseCase.executeStream(dto.question)) {
      res.write(JSON.stringify(chunk) + '\n');
    }
    res.end();
  }
}
