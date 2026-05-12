import { Injectable } from '@nestjs/common';
import {
  PaymentGateWayProvider,
  CustomerByExternalReference,
  CustomerResponse,
  ChargeResponse,
  CreateWebhookResponse,
  ValidatePaymentResponse,
} from './payment-gateway.provider';
import { CreateClientDto } from '../dtos/create-client.dto';
import { CreateChargeDto } from '../dtos/create-charge.dto';

@Injectable()
export class MockGatewayProvider implements PaymentGateWayProvider {
  private customers = new Map<string, CustomerResponse>();
  private payments = new Map<string, ChargeResponse>();

  async findCustomerByExternalReference(
    externalReference: string,
  ): Promise<CustomerByExternalReference> {
    return new Promise((resolve) =>
      resolve({
        id: externalReference,
        externalReference: 'userId',
      }),
    );
  }

  async findPaymentByExternalReference(
    externalReference: string,
  ): Promise<ChargeResponse | null> {
    return new Promise((resolve) =>
      resolve(this.payments.get(externalReference) || null),
    );
  }

  async findPaymentBySubscriptionId(
    externalReference: string,
  ): Promise<ChargeResponse | null> {
    return new Promise((resolve) =>
      resolve(this.payments.get(externalReference) || null),
    );
  }

  async client(clientRegisterDto: CreateClientDto): Promise<CustomerResponse> {
    const id = `mock_cust_${Date.now()}`;

    const customer: CustomerResponse = {
      id,
      name: clientRegisterDto.name,
      email: clientRegisterDto.email,
      postalCode: clientRegisterDto.postalCode,
      object: 'customer',
      dateCreated: new Date().toISOString(),
    };

    this.customers.set(clientRegisterDto.email, customer);
    return new Promise((resolve) => resolve(customer));
  }

  async charge(
    createChargeDto: CreateChargeDto,
    type: 'subscription' | 'payment',
  ): Promise<ChargeResponse> {
    const id = `mock_charge_${Date.now()}`;

    const charge: ChargeResponse = {
      id,
      status: type === 'subscription' ? 'ACTIVE' : 'PENDING',
      invoiceUrl: `https://mock-payment.com/invoice/${id}`,
      object: type,
    };

    this.payments.set(createChargeDto.customer, charge);

    return new Promise((resolve) => resolve(charge));
  }

  async createWebhook(): Promise<CreateWebhookResponse> {
    return new Promise((resolve) =>
      resolve({
        id: `mock_webhook_${Date.now()}`,
      }),
    );
  }

  async validatePayment(paymentId: string): Promise<ValidatePaymentResponse> {
    return new Promise((resolve) =>
      resolve({
        id: paymentId,
        status: 'CONFIRMED',
        externalReference: 'mock_subscription_id',
        value: 100,
      }),
    );
  }
}
