import { ApiProperty } from '@nestjs/swagger';

export class DocumentResponseDto {
  @ApiProperty({ description: 'ドキュメント ID' })
  id: string;

  @ApiProperty({ description: 'ファイル名' })
  filename: string;

  @ApiProperty({ description: 'MIME タイプ' })
  mimeType: string;

  @ApiProperty({ description: 'ファイルサイズ (bytes)' })
  size: number;

  @ApiProperty({ description: 'チャンク数' })
  chunkCount: number;

  @ApiProperty({ description: '作成日時' })
  createdAt: string;

  @ApiProperty({ description: '更新日時' })
  updatedAt: string;
}

export class DocumentListResponseDto {
  @ApiProperty({ description: 'ドキュメント一覧', type: [DocumentResponseDto] })
  documents: DocumentResponseDto[];

  @ApiProperty({ description: '総件数' })
  total: number;
}
