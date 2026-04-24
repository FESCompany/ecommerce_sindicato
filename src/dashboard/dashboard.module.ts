import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { UsersService } from 'src/users/user.service';
import { PaymentProviderService } from 'src/payment-provider/payment-provider.service';
import { CryptoService } from 'src/crypto/crypto.service';
import { PaymentGatewayService } from 'src/payment-gateway/payment-gateway.service';
import { PaymentGatewayModule } from 'src/payment-gateway/payment-gateway.module';

@Module({
  imports: [PaymentGatewayModule],
  providers: [
    DashboardService,
    PrismaService,
    UsersService,
    PaymentProviderService,
    CryptoService,
    PaymentGatewayService,
  ],
  controllers: [DashboardController],
  exports: [DashboardService],
})
export class DashboardModule {}
