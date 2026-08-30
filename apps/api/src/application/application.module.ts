import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { RagQueryUseCase } from './usecases/rag-query.usecase';
import { DocumentUploadUseCase } from './usecases/document-upload.usecase';
import { DocumentQueryUseCase } from './usecases/document-query.usecase';
import { UploadJobService } from './services/upload-job.service';

@Module({
  imports: [InfrastructureModule],
  providers: [RagQueryUseCase, DocumentUploadUseCase, DocumentQueryUseCase, UploadJobService],
  exports: [RagQueryUseCase, DocumentUploadUseCase, DocumentQueryUseCase, UploadJobService],
})
export class ApplicationModule {}
