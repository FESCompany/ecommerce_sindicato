import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import { PaymentProviderService } from './payment-provider.service';

type AuthRequest = Request & {
  user: { sub: string };
};

@Injectable()
export class PaymentProviderGuard implements CanActivate {
  constructor(private paymentProviderService: PaymentProviderService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();

    const user = request.user;

    if (!user?.sub) {
      throw new UnauthorizedException();
    }

    const account = await this.paymentProviderService.getByUserId(user.sub);

    if (!account || !account.isActive) {
      throw new ForbiddenException('Payment account not connected');
    }

    return true;
  }
}
