import { Module } from '@nestjs/common';
import { ApplicationModule } from '../application/application.module';
import { RagController } from './controllers/rag.controller';
import { DocumentController } from './controllers/document.controller';
import { HealthController } from './controllers/health.controller';

@Module({
  imports: [ApplicationModule],
  controllers: [RagController, DocumentController, HealthController],
})
export class PresentationModule {}
