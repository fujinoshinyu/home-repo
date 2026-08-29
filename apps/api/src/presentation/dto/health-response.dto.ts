import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ description: 'ヘルスステータス', enum: ['ok', 'error'] })
  status: 'ok' | 'error';

  @ApiProperty({ description: 'タイムスタンプ' })
  timestamp: string;

  @ApiProperty({ description: 'サービス接続状態' })
  services: {
    ollama: 'connected' | 'disconnected';
    lancedb: 'connected' | 'disconnected';
  };
}
