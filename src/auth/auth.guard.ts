import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { TokenService } from 'src/token/token.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const token = this.extractTokenFromCookie(request);

    if (!token) throw new UnauthorizedException();

    try {
      const payload: { sub: string } = await this.tokenService.verify(token);

      request['user'] = payload;

      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }

  private extractTokenFromCookie(request: Request): string | undefined {
    const cookies = request.cookies as { access_token?: string } | undefined;
    return cookies?.access_token;
  }
}
