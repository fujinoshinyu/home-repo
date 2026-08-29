import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { RagQueryUseCase } from './usecases/rag-query.usecase';
import { DocumentUploadUseCase } from './usecases/document-upload.usecase';
import { DocumentQueryUseCase } from './usecases/document-query.usecase';

@Module({
  imports: [InfrastructureModule],
  providers: [RagQueryUseCase, DocumentUploadUseCase, DocumentQueryUseCase],
  exports: [RagQueryUseCase, DocumentUploadUseCase, DocumentQueryUseCase],
})
export class ApplicationModule {}
