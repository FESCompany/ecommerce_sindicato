import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CryptoService } from 'src/crypto/crypto.service';
import { PaymentProviderService } from 'src/payment-provider/payment-provider.service';
import { UsersService } from 'src/users/user.service';
import { PaymentGatewayService } from 'src/payment-gateway/payment-gateway.service';
import { ProductsService } from 'src/products/product.service';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [],
  providers: [
    DashboardService,
    ProductsService,
    PrismaService,
    PaymentProviderService,
    UsersService,
    CryptoService,
    PaymentGatewayService,
  ],
  controllers: [DashboardController],
  exports: [DashboardService],
})
export class DashboardModule {}
