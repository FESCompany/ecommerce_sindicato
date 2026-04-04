import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ChargeResponse,
  CreateWebhookResponse,
  CustomerByExternalReference,
  CustomerResponse,
  listResponse,
  PaymentGateWayProvider,
  ValidatePaymentResponse,
} from 'src/payment-gateway/providers/payment-gateway.provider';
import { ConfigService } from '@nestjs/config';
import { CreateClientDto } from '../dtos/create-client.dto';
import { CreateChargeDto } from '../dtos/create-charge.dto';

type AsaasErrorResponse = {
  errors?: {
    code: string;
    description: string;
  }[];
};

export type AsaasChargeExternalReferenceResponse = {
  id: string;
  externalReference: string;
  status:
    | 'PENDING'
    | 'RECEIVED'
    | 'CONFIRMED'
    | 'OVERDUE'
    | 'FAILED'
    | 'REFUNDED'
    | 'CHARGEBACK';
  value: number;
  billingType: string;
  invoiceUrl: string;
  customer: string;
};

@Injectable()
export class AsaasProvider implements PaymentGateWayProvider {
  constructor(private configService: ConfigService) {}
  private getHeader(apiKeyParam?: string) {
    const apiKey =
      apiKeyParam ?? this.configService.get<string>('ASAAS_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('Missing ASAAS_API_KEY');
    }
    return {
      accept: 'application/json',
      'content-type': 'application/json',
      access_token: apiKey,
    };
  }
  private async handleResponse<T>(response: Response): Promise<T> {
    let data: T | AsaasErrorResponse;
    try {
      data = (await response.json()) as T | AsaasErrorResponse;
    } catch {
      throw new InternalServerErrorException(
        'Invalid JSON response from Asaas',
      );
    }

    if (!response.ok) {
      const errorMessage =
        (data as AsaasErrorResponse)?.errors
          ?.map((e) => e.description)
          .join(', ') || 'Asaas request failed';
      if (response.status === 400)
        throw new BadRequestException(errorMessage || 'Bad request to Asaas');
      if (response.status === 409)
        throw new ConflictException(
          errorMessage || 'Conflict with existing resource',
        );
      throw new InternalServerErrorException(errorMessage);
    }
    return data as T;
  }

  private async fetchWithTimetout(
    url: string,
    options: RequestInit,
    timeoutMs = 5000,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      return response;
    } catch (error: any) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new InternalServerErrorException('Request timeout');
      }
      throw new InternalServerErrorException('External request failed');
    } finally {
      clearTimeout(timeout);
    }
  }

  async findCustomerByExternalReference(
    externalReference: string,
    apiKey?: string,
  ): Promise<any> {
    const url = `${this.configService.get<string>('ASAAS_API')}/customers?externalReference=${externalReference}`;
    const response = await this.fetchWithTimetout(url, {
      method: 'GET',
      headers: this.getHeader(apiKey),
    });
    return this.handleResponse<CustomerByExternalReference>(response);
  }
  async findPaymentByExternalReference(
    externalReference: string,
    apiKey?: string,
  ): Promise<ChargeResponse | null> {
    const url = `${this.configService.get<string>('ASAAS_API')}/payments?externalReference=${externalReference}`;
    const response = await this.fetchWithTimetout(url, {
      method: 'GET',
      headers: this.getHeader(apiKey),
    });
    const result =
      await this.handleResponse<listResponse<ChargeResponse>>(response);
    if (!result.data || result.data.length === 0) {
      return null;
    }
    return result.data[0];
  }
  async client(
    clientRegisterDto: CreateClientDto,
    apiKey?: string,
  ): Promise<any> {
    const url = `${this.configService.get<string>('ASAAS_API')}/customers`;
    const response = await this.fetchWithTimetout(url, {
      method: 'POST',
      headers: this.getHeader(apiKey),
      body: JSON.stringify(clientRegisterDto),
    });
    return this.handleResponse<CustomerResponse>(response);
  }
  async charge(
    createChargeDto: CreateChargeDto,
    type: 'subscription' | 'payment',
    apiKey?: string,
  ): Promise<any> {
    const action = type === 'subscription' ? 'subscriptions' : 'payments';
    const url = `${this.configService.get<string>('ASAAS_API')}/${action}`;
    const response = await this.fetchWithTimetout(url, {
      method: 'POST',
      headers: this.getHeader(apiKey),
      body: JSON.stringify(createChargeDto),
    });
    return this.handleResponse<ChargeResponse>(response);
  }
  async createWebhook(apiKey: string): Promise<any> {
    const authToken = this.configService.get<string>('ASAAS_WEBHOOK_TOKEN');
    const url = `${this.configService.get<string>('ASAAS_API')}/webhooks`;
    const response = await this.fetchWithTimetout(url, {
      method: 'POST',
      headers: this.getHeader(apiKey),
      body: JSON.stringify({
        name: 'Payment Provider Webhook',
        url: `${this.configService.get<string>('API_URL')}/webhook/orders`,
        email: this.configService.get<string>('MAIL_USER'),
        enabled: true,
        interrupted: false,
        authToken,
        sendType: 'SEQUENTIALLY',
        events: [
          'PAYMENT_CREATED',
          'PAYMENT_CONFIRMED',
          'PAYMENT_RECEIVED',
          'PAYMENT_OVERDUE',
          'PAYMENT_DELETED',
          'PAYMENT_RESTORED',
          'PAYMENT_REFUNDED',
          'PAYMENT_CHARGEBACK_REQUESTED',
          'PAYMENT_CHARGEBACK_DISPUTE',
        ],
      }),
    });
    return this.handleResponse<CreateWebhookResponse>(response);
  }
  async validatePayment(paymentId: string, apiKey: string): Promise<any> {
    const url = `${this.configService.get<string>('ASAAS_API')}/payments/${paymentId}`;
    const response = await this.fetchWithTimetout(url, {
      method: 'GET',
      headers: this.getHeader(apiKey),
    });
    return this.handleResponse<ValidatePaymentResponse>(response);
  }
}
