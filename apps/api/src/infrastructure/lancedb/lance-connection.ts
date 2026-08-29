import { Injectable, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { connect, Connection, Table } from '@lancedb/lancedb';
import { lancedbConfig } from '../config';

@Injectable()
export class LanceConnection implements OnModuleInit, OnModuleDestroy {
  private db!: Connection;
  private _table!: Table;

  constructor(
    @Inject(lancedbConfig.KEY)
    private readonly config: ConfigType<typeof lancedbConfig>,
  ) {}

  async onModuleInit() {
    this.db = await connect(this.config.dbPath);
    this._table = await this.db.openTable('chunks').catch(() =>
      this.db.createTable('chunks', [
        { id: '__init__', vector: new Array(768).fill(0), content: '', metadata: '{}' },
      ]),
    );
  }

  async onModuleDestroy() {
    await this.db.close();
  }

  get table(): Table {
    return this._table;
  }
}
