import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BasicAuthGuard } from './auth/basic-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  app.useGlobalGuards(app.get(BasicAuthGuard));

  const port = process.env.GATEWAY_PORT ?? 3000;
  await app.listen(port);
  console.log(`Gateway running on http://localhost:${port}`);
}
bootstrap();
