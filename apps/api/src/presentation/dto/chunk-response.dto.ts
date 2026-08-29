import { ApiProperty } from '@nestjs/swagger';

export class ChunkResponseDto {
  @ApiProperty({ description: 'チャンク ID' })
  id: string;

  @ApiProperty({ description: 'ドキュメント ID' })
  documentId: string;

  @ApiProperty({ description: 'チャンク内容' })
  content: string;

  @ApiProperty({ description: 'メタデータ' })
  metadata: Record<string, unknown>;
}

export class ChunkListResponseDto {
  @ApiProperty({ description: 'チャンク一覧', type: [ChunkResponseDto] })
  chunks: ChunkResponseDto[];

  @ApiProperty({ description: '総件数' })
  total: number;
}
