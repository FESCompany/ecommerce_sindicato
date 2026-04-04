import { PAYMENT_GATEWAY_PROVIDER } from './tokens/payment-gateway.token';
import { PaymentGatewayService } from './payment-gateway.service';
import { AsaasProvider } from './providers/asaas-gateway.provider';
import { Module } from '@nestjs/common';
import { MockGatewayProvider } from './providers/mock-gateway.provider';

@Module({
  providers: [
    PaymentGatewayService,
    {
      provide: PAYMENT_GATEWAY_PROVIDER,
      useClass:
        process.env.NODE_ENV === 'test' ? MockGatewayProvider : AsaasProvider,
    },
  ],
  exports: [PAYMENT_GATEWAY_PROVIDER, PaymentGatewayService],
})
export class PaymentGatewayModule {}
