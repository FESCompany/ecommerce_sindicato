import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { PrismaService } from 'src/prisma.service';
import { WebhookController } from './webhook.controller';
import { PaymentGatewayModule } from 'src/payment-gateway/payment-gateway.module';

@Module({
  imports: [PaymentGatewayModule],
  providers: [SubscriptionService, PrismaService],
  controllers: [SubscriptionController, WebhookController],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
