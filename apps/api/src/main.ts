import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const config = new DocumentBuilder()
    .setTitle('RAG System API')
    .setDescription('自作 RAG システムの API ドキュメント')
    .setVersion('1.0')
    .addTag('RAG', '質問応答エンドポイント')
    .addTag('Documents', 'ドキュメント管理エンドポイント')
    .addTag('Health', 'ヘルスチェック')
    .addBasicAuth()
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.API_PORT ?? 3001);
}
bootstrap();
