import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BasicAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      throw new UnauthorizedException('Missing Basic Authentication header');
    }

    const expectedUser = this.configService.get<string>('BASIC_AUTH_USER', 'admin');
    const expectedPass = this.configService.get<string>('BASIC_AUTH_PASS', 'password');

    const decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8');
    const [user, pass] = decoded.split(':');

    if (user !== expectedUser || pass !== expectedPass) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return true;
  }
}
