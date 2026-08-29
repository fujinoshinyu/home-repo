import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { generateOpenAPIDocument } from './registry';

const document = generateOpenAPIDocument();
const outputPath = resolve(__dirname, '../openapi.json');

writeFileSync(outputPath, JSON.stringify(document, null, 2), 'utf-8');
console.log(`OpenAPI spec generated: ${outputPath}`);
