import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { SellerGuard } from 'src/auth/seller.guard';
import { SubscriptionGuard } from 'src/subscription/subscription.guard';
import { PaymentProviderGuard } from 'src/payment-provider/payment-provider.guard';

@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('products')
  @UseGuards(AuthGuard, SellerGuard, SubscriptionGuard, PaymentProviderGuard)
  async products(@Request() req: Request) {
    const user = req['user'] as { sub: string };
    return await this.dashboardService.products(user.sub);
  }

  @Get('orders')
  @UseGuards(AuthGuard, SellerGuard, SubscriptionGuard, PaymentProviderGuard)
  async orders(@Request() req: Request) {
    const user = req['user'] as { sub: string };
    return await this.dashboardService.products(user.sub);
  }
}
