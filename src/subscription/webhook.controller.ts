import {
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { ConfigService } from '@nestjs/config';
import { PaymentGatewayService } from 'src/payment-gateway/payment-gateway.service';

type Webhook = {
  payment: {
    id: string;
    externalReference: string;
  };
};

@Controller('webhook/subscription')
export class WebhookController {
  constructor(
    private subscriptionService: SubscriptionService,
    private configService: ConfigService,
    private paymentGatewayService: PaymentGatewayService,
  ) {}
  @Post()
  async handle(
    @Body()
    body: Webhook,
    @Headers('asaas-access-token') token: string,
  ) {
    if (token !== this.configService.get<string>('ASAAS_WEBHOOK_TOKEN'))
      throw new UnauthorizedException('Invalid webhook token');

    const { payment } = body;

    // search subscription
    const subscription = await this.subscriptionService.getSubscriptionById(
      payment.externalReference,
    );

    if (!subscription)
      throw new UnauthorizedException('Subscription not found');

    // if the subscription is already paid, we don't need to validate it again
    if (subscription.status === 'PAID')
      return {
        received: true,
      };

    // validate real payment status with asaas api
    const realPayment = await this.paymentGatewayService.validatePayment(
      payment.id,
      this.configService.get<string>('ASAAS_API_KEY')!,
    );

    if (realPayment.externalReference !== subscription.id)
      throw new UnauthorizedException('Payment mismatch');

    // if the payment is pending, we don't need to update the subscription status
    if (realPayment.status === 'PENDING') return { received: true };

    // real status can be CONFIRMED, RECEIVED, OVERDUE, FAILED, REFUNDED or CHARGEBACK
    if (
      realPayment.status === 'CONFIRMED' ||
      realPayment.status === 'RECEIVED'
    ) {
      await this.subscriptionService.paymentStatus('PAID', subscription.id);
    }

    if (
      realPayment.status === 'OVERDUE' ||
      realPayment.status === 'FAILED' ||
      realPayment.status === 'REFUNDED' ||
      realPayment.status === 'CHARGEBACK'
    ) {
      await this.subscriptionService.paymentStatus('EXPIRED', subscription.id);
    }
  }
}
