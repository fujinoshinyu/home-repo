import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { RATE_LIMITS } from '@home-repo/shared';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'general',
        ttl: RATE_LIMITS.GENERAL.window,
        limit: RATE_LIMITS.GENERAL.limit,
      },
    ]),
  ],
})
export class RateLimitModule {}
