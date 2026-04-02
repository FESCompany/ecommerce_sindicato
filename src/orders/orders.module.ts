import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from 'src/prisma.service';
import { OrdersController } from './orders.controller';
import { PaymentProviderService } from 'src/payment-provider/payment-provider.service';
import { CryptoService } from 'src/crypto/crypto.service';
import { ProductsService } from 'src/products/product.service';
import { BillingService } from 'src/billing/billing.service';
import { AsaasService } from 'src/asaas/asaas.service';

@Module({
  imports: [],
  providers: [
    OrdersService,
    PrismaService,
    PaymentProviderService,
    CryptoService,
    ProductsService,
    BillingService,
    AsaasService,
  ],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrderModule {}
