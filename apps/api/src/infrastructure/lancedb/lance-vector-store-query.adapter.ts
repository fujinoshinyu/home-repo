import { Injectable } from '@nestjs/common';
import { VectorStoreQuery } from '../../domain/ports';
import { SearchResult } from '../../domain/value-objects';
import { LanceConnection } from './lance-connection';

@Injectable()
export class LanceVectorStoreQueryAdapter implements VectorStoreQuery {
  constructor(private readonly connection: LanceConnection) {}

  async search(vector: number[], topK: number, filter?: Record<string, unknown>): Promise<SearchResult[]> {
    let query = this.connection.table.query().nearestTo(vector).limit(topK);

    if (filter) {
      const filterStr = Object.entries(filter)
        .map(([key, value]) => `${key} = '${value}'`)
        .join(' AND ');
      query = query.where(filterStr);
    }

    const results = await query.toArray();

    return results.map(
      (row: Record<string, unknown>) =>
        new SearchResult(
          row.id as string,
          row.vector as number[],
          JSON.parse(row.metadata as string),
          (row._distance as number) ?? 0,
        ),
    );
  }
}
