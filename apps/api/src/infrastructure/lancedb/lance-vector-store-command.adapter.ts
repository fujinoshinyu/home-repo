import { Injectable } from '@nestjs/common';
import { VectorStoreCommand } from '../../domain/ports';
import { LanceConnection } from './lance-connection';

@Injectable()
export class LanceVectorStoreCommandAdapter implements VectorStoreCommand {
  constructor(private readonly connection: LanceConnection) {}

  async upsert(id: string, vector: number[], metadata: Record<string, unknown>): Promise<void> {
    const record = {
      id,
      vector,
      content: (metadata.content as string) ?? '',
      metadata: JSON.stringify(metadata),
    };

    await this.connection.table.add([record], { mode: 'overwrite' });
  }

  async delete(id: string): Promise<void> {
    await this.connection.table.delete(`id = '${id}'`);
  }

  async deleteByDocumentId(documentId: string): Promise<void> {
    await this.connection.table.delete(`metadata LIKE '%"documentId":"${documentId}"%'`);
  }
}
