import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';

@Injectable()
export class ApiProxyMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ApiProxyMiddleware.name);
  private proxy;

  constructor(private readonly configService: ConfigService) {
    const apiUrl = this.configService.get<string>('API_URL', 'http://localhost:3001');
    this.logger.log(`Proxy target: ${apiUrl}`);

    this.proxy = createProxyMiddleware({
      target: apiUrl,
      changeOrigin: true,
      proxyTimeout: 300_000,
      timeout: 300_000,
      on: {
        proxyReq: fixRequestBody,
      },
    });
  }

  use(req: Request, res: Response, next: () => void) {
    req.url = req.originalUrl;
    this.proxy(req, res, next);
  }
}
