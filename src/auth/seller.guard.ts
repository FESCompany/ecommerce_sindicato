import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

type AuthRequest = Request & {
  user: { sub: string; isSelling?: boolean };
};

@Injectable()
export class SellerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthRequest>();

    const user = request.user;

    if (!user?.sub) {
      throw new UnauthorizedException();
    }

    if (!user.isSelling) {
      throw new UnauthorizedException('User is not a seller');
    }

    return true;
  }
}
