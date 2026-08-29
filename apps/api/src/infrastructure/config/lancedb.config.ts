import { registerAs } from '@nestjs/config';

export const lancedbConfig = registerAs('lancedb', () => ({
  dbPath: process.env.LANCE_DB_PATH ?? './data/lancedb',
}));
