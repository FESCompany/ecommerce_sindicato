import {
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { OrdersService } from 'src/orders/orders.service';
import { PaymentProviderService } from 'src/payment-provider/payment-provider.service';

type Webhook = {
  payment: {
    id: string;
  };
};

@Controller('webhook/orders')
export class AsaasWebhook {
  constructor(
    private orderService: OrdersService,
    private paymentProviderService: PaymentProviderService,
  ) {}
  @Post()
  async handle(
    @Body()
    body: Webhook,
    @Headers('asaas-access-token') token: string,
  ) {
    if (token !== process.env.ASAAS_WEBHOOK_TOKEN)
      throw new UnauthorizedException('Invalid webhook token');

    const { payment } = body;

    // search order
    const order = await this.orderService.findByPaymentId(payment.id);
    if (!order) throw new UnauthorizedException('Order not found');

    // if the order is already paid, we don't need to validate it again
    if (order.status === 'PAID')
      return {
        received: true,
      };

    // seller api key
    const apiKey = await this.paymentProviderService.getDecryptedApiKey(
      order.sellerId,
    );
    if (!apiKey) throw new UnauthorizedException('Seller API key not found');

    // validate real payment status with asaas api
    const realPayment = await this.orderService.validatePayment(
      payment.id,
      apiKey,
    );

    if (realPayment.id !== order.asaasPaymentId)
      throw new UnauthorizedException('Payment mismatch');

    if (realPayment.value !== order.price)
      throw new UnauthorizedException('Payment amount mismatch');

    if (realPayment.status === 'PENDING') return { received: true };

    // real status can be CONFIRMED, RECEIVED, OVERDUE, FAILED, REFUNDED or CHARGEBACK
    if (
      realPayment.status === 'CONFIRMED' ||
      realPayment.status === 'RECEIVED'
    ) {
      await this.orderService.updateStatus(payment.id, 'PAID');
    }

    if (
      realPayment.status === 'OVERDUE' ||
      realPayment.status === 'FAILED' ||
      realPayment.status === 'REFUNDED' ||
      realPayment.status === 'CHARGEBACK'
    ) {
      await this.orderService.updateStatus(payment.id, 'EXPIRED');
    }
  }
}
