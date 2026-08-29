import { ApiProperty } from '@nestjs/swagger';

export class ChunkMetadataDto {
  @ApiProperty({ description: 'チャンク ID' })
  id: string;

  @ApiProperty({ description: '参照元ファイル名' })
  source: string;

  @ApiProperty({ description: '類似度スコア' })
  score: number;
}

export class RagResponseDto {
  @ApiProperty({ description: '生成された回答' })
  answer: string;

  @ApiProperty({ description: '参照元チャンク一覧', type: [ChunkMetadataDto] })
  sources: ChunkMetadataDto[];
}

export class RagStreamChunkDto {
  @ApiProperty({ description: 'チャンクタイプ', enum: ['token', 'sources', 'done'] })
  type: string;

  @ApiProperty({ description: 'トークン（type=token の場合）', required: false })
  token?: string;

  @ApiProperty({ description: '参照元一覧（type=sources の場合）', type: [ChunkMetadataDto], required: false })
  sources?: ChunkMetadataDto[];
}
