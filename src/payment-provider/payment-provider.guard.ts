import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PaymentProviderService } from './payment-provider.service';

@Injectable()
export class PaymentProviderGuard implements CanActivate {
  constructor(private paymentProviderService: PaymentProviderService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request['user'] as { sub: string };
    if (!user?.sub) {
      throw new UnauthorizedException();
    }
    const account = await this.paymentProviderService.getByUserId(user.sub);
    if (!account || !account.isActive) {
      throw new UnauthorizedException('Payment account not connected');
    }
    return true;
  }
}
