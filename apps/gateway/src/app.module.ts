import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { BasicAuthGuard } from './auth/basic-auth.guard';
import { RateLimitModule } from './rate-limit/rate-limit.module';
import { ApiProxyMiddleware } from './proxy/api-proxy.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RateLimitModule,
  ],
  providers: [
    BasicAuthGuard,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ApiProxyMiddleware)
      .forRoutes('*');
  }
}
