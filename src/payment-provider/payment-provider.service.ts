import { Injectable } from '@nestjs/common';
import { CryptoService } from 'src/crypto/crypto.service';
import { PrismaService } from 'src/prisma.service';
import { SellerPaymentProvider } from './dtos/payment-provider.dto';

@Injectable()
export class PaymentProviderService {
  constructor(
    private cryptoService: CryptoService,
    private prismaService: PrismaService,
  ) {}
  async connect(
    userId: string,
    apiKey: string,
    provider: SellerPaymentProvider,
  ) {
    const encryptedApiKey = this.cryptoService.encrypt(apiKey);
    // using upsert to create or update the seller payment account for the user
    await this.prismaService.sellerPaymentAccount.upsert({
      where: {
        userId,
      },
      update: { encryptedApiKey },
      create: {
        userId,
        provider: provider,
        encryptedApiKey,
      },
    });
    await this.createWebhook(apiKey);
  }
  async disconnect(userId: string) {
    await this.prismaService.sellerPaymentAccount.update({
      where: {
        userId,
      },
      data: {
        isActive: false,
      },
    });
  }
  async getByUserId(userId: string) {
    return this.prismaService.sellerPaymentAccount.findUnique({
      where: {
        userId,
      },
    });
  }
  async getDecryptedApiKey(userId: string) {
    const account = await this.getByUserId(userId);
    if (!account || !account.isActive) {
      throw new Error('Seller payment account not connected');
    }
    return this.cryptoService.decrypt(account.encryptedApiKey);
  }
  async createWebhook(apiKey: string) {
    await fetch(`${process.env.ASAAS_API}/webhooks`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        access_token: apiKey,
      },
      body: JSON.stringify({
        url: `${process.env.API_URL}/webhook/asaas-order`,
        events: [
          'PAYMENT_CONFIRMED',
          'PAYMENT_RECEIVED',
          'PAYMENT_OVERDUE',
          'PAYMENT_FAILED',
          'PAYMENT_REFUNDED',
          'PAYMENT_CHARGEBACK_DONE',
        ],
        authToken: process.env.ASAAS_WEBHOOK_TOKEN,
      }),
    });
  }
}
