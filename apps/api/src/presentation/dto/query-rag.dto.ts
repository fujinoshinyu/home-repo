import { createZodDto } from 'nestjs-zod';
import { RagQueryRequestSchema } from '@home-repo/swagger';

export class QueryRagDto extends createZodDto(RagQueryRequestSchema) {}
