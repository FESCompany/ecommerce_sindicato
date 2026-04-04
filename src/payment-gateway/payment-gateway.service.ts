import { Inject, Injectable } from '@nestjs/common';

import { type PaymentGateWayProvider } from 'src/payment-gateway/providers/payment-gateway.provider';
import { CreateClientDto } from './dtos/create-client.dto';
import { CreateChargeDto } from './dtos/create-charge.dto';
import { PAYMENT_GATEWAY_PROVIDER } from './tokens/payment-gateway.token';

@Injectable()
export class PaymentGatewayService {
  constructor(
    @Inject(PAYMENT_GATEWAY_PROVIDER)
    private paymentGatewayProvider: PaymentGateWayProvider,
  ) {}

  async findCustomerByExternalReference(
    externalReference: string,
    apiKey?: string,
  ) {
    return await this.paymentGatewayProvider.findCustomerByExternalReference(
      externalReference,
      apiKey,
    );
  }

  async findPaymentByExternalReference(
    externalReference: string,
    apiKey?: string,
  ) {
    return await this.paymentGatewayProvider.findPaymentByExternalReference(
      externalReference,
      apiKey,
    );
  }

  async client(clientRegisterDto: CreateClientDto, apiKey?: string) {
    return await this.paymentGatewayProvider.client(clientRegisterDto, apiKey);
  }

  async charge(
    createChargeDto: CreateChargeDto,
    type: 'subscription' | 'payment',
    apiKey?: string,
  ) {
    return await this.paymentGatewayProvider.charge(
      createChargeDto,
      type,
      apiKey,
    );
  }

  async createWebhook(apiKey: string) {
    return await this.paymentGatewayProvider.createWebhook(apiKey);
  }

  async validatePayment(paymentId: string, apiKey: string) {
    return await this.paymentGatewayProvider.validatePayment(paymentId, apiKey);
  }
}
