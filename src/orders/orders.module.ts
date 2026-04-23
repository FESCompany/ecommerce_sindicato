import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from 'src/prisma.service';
import { OrdersController } from './orders.controller';
import { PaymentProviderService } from 'src/payment-provider/payment-provider.service';
import { CryptoService } from 'src/crypto/crypto.service';
import { ProductsService } from 'src/products/product.service';
import { BillingService } from 'src/billing/billing.service';
import { PaymentGatewayService } from 'src/payment-gateway/payment-gateway.service';
import { UsersService } from 'src/users/user.service';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { WebhookController } from './webhook.controller';
import { PaymentGatewayModule } from 'src/payment-gateway/payment-gateway.module';

@Module({
  imports: [PaymentGatewayModule],
  providers: [
    OrdersService,
    PrismaService,
    PaymentProviderService,
    CryptoService,
    ProductsService,
    BillingService,
    PaymentGatewayService,
    UsersService,
    SubscriptionService,
  ],
  controllers: [OrdersController, WebhookController],
  exports: [OrdersService],
})
export class OrderModule {}
