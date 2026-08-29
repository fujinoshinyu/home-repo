import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createProxyMiddleware, RequestHandler } from 'http-proxy-middleware';

@Injectable()
export class ApiProxyMiddleware implements NestMiddleware {
  private proxy: RequestHandler;

  constructor(private readonly configService: ConfigService) {
    const apiUrl = this.configService.get<string>('API_URL', 'http://localhost:3001');
    this.proxy = createProxyMiddleware({
      target: apiUrl,
      changeOrigin: true,
    });
  }

  use(req: unknown, res: unknown, next: () => void) {
    (this.proxy as (req: unknown, res: unknown, next: () => void) => void)(req, res, next);
  }
}
