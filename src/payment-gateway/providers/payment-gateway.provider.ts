import { PaymentStatus } from '@prisma/client';
import { CreateChargeDto } from 'src/payment-gateway/dtos/create-charge.dto';
import { CreateClientDto } from 'src/payment-gateway/dtos/create-client.dto';

export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'INACTIVE';
export type CustomerResponse = {
  id: string;
  name: string;
  email: string;
  postalCode: string;
  object: string;
  dateCreated: string;
};
export type ChargeResponse = {
  object?: string;
  id: string;
  status: PaymentStatus | SubscriptionStatus;
  invoiceUrl?: string;
};
export type CustomerByExternalReference = {
  id: string;
  externalReference: 'userId';
};
export type listResponse<T> = {
  object: 'list';
  data: T[];
  hasMore: boolean;
  totalCount: number;
};
export type CreateWebhookResponse = {
  id: string;
};
export type ValidatePaymentResponse = {
  id: string;
  status:
    | 'PENDING'
    | 'RECEIVED'
    | 'CONFIRMED'
    | 'OVERDUE'
    | 'FAILED'
    | 'REFUNDED'
    | 'CHARGEBACK';
  subscriptionId: string;
  value: number;
};

export interface PaymentGateWayProvider {
  findCustomerByExternalReference(
    externalReference: string,
    apiKey?: string,
  ): Promise<CustomerByExternalReference>;
  findPaymentByExternalReference(
    externalReference: string,
    apiKey?: string,
  ): Promise<ChargeResponse | null>;
  client(
    clientRegisterDto: CreateClientDto,
    apiKey?: string,
  ): Promise<CustomerResponse>;
  charge(
    createChargeDto: CreateChargeDto,
    type: 'subscription' | 'payment',
    apiKey?: string,
  ): Promise<ChargeResponse>;
  createWebhook(apiKey: string): Promise<CreateWebhookResponse>;
  validatePayment(
    paymentId: string,
    apiKey: string,
  ): Promise<ValidatePaymentResponse>;
}
