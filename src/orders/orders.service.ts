import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { PaymentStatus } from 'src/generated/prisma/enums';
import { Prisma } from 'src/generated/prisma/client';
import { CreatePaymentProviderOrderDto } from './dtos/create-payment-provider-order.dto';
import { PaymentProviderService } from 'src/payment-provider/payment-provider.service';
import { OrderDto } from './dtos/order.dto';
import { BillingService } from 'src/billing/billing.service';

type AsaasPaymentStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'CONFIRMED'
  | 'OVERDUE'
  | 'FAILED'
  | 'REFUNDED'
  | 'CHARGEBACK';

@Injectable()
export class OrdersService {
  constructor(
    private prismaService: PrismaService,
    private paymentProviderService: PaymentProviderService,
    private billingService: BillingService,
  ) {}
  async order(userId: string, id: string) {
    const buyer = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!buyer) return null;

    return this.prismaService.product.findFirst({
      where: {
        id,
        userId: buyer.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        amount: true,
        price: true,
        createdAt: true,
        updatedAt: true,
        image: true,
      },
    });
  }

  async orders(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.OrderWhereUniqueInput;
    userId: string;
    orderBy?: Prisma.OrderOrderByWithRelationInput;
  }) {
    const buyer = await this.prismaService.user.findUnique({
      where: { id: params.userId },
      select: { id: true },
    });

    if (!buyer) return null;

    return this.prismaService.order.findMany({
      skip: params.skip,
      take: params.take,
      cursor: params.cursor,
      where: {
        buyerId: buyer.id,
      },
      orderBy: params.orderBy,
      select: {
        id: true,
        status: true,
        product: true,
        price: true,
        asaasPaymentId: true,
        buyer: true,
        seller: true,
        createdAt: true,
      },
    });
  }

  async createPaymentProviderOrder(
    createPaymentProviderOrderDto: CreatePaymentProviderOrderDto,
  ) {
    const buyer = await this.prismaService.user.findUnique({
      where: { id: createPaymentProviderOrderDto.userId },
    });

    if (!buyer) throw new Error('Buyer not found');

    const product = await this.prismaService.product.findUnique({
      where: { id: createPaymentProviderOrderDto.productId },
    });

    if (!product) throw new Error('Product not found');

    const sellerId = product.userId;

    // We don't want the user to buy their own product
    if (createPaymentProviderOrderDto.userId === sellerId)
      throw new Error('You cannot buy your own product');

    // We also want to make sure the product is in stock
    if (product.amount <= 0) throw new Error('Product is out of stock');

    // seller provider api key
    const apiKey =
      await this.paymentProviderService.getDecryptedApiKey(sellerId);

    const { charge } = await this.billingService.createCharge(
      {
        username: buyer.username,
        email: buyer.email,
        cpfCnpj: buyer.cpfCnpj,
        postalCode: buyer.postalCode,
        billingType: createPaymentProviderOrderDto.billingType,
        dueDate: createPaymentProviderOrderDto.dueDate,
        value:
          createPaymentProviderOrderDto.price *
          createPaymentProviderOrderDto.amount,
      },
      'payment',
      apiKey,
    );

    // save order in database
    await this.create({
      buyerId: createPaymentProviderOrderDto.userId,
      productId: createPaymentProviderOrderDto.productId,
      sellerId,
      asaasPaymentId: charge.id,
      price: createPaymentProviderOrderDto.price,
    });
    return {
      invoiceUrl: charge.invoiceUrl,
    };
  }

  async create(orderDto: OrderDto) {
    const order = await this.prismaService.order.create({
      data: {
        ...orderDto,
        status: 'PENDING',
      },
    });
    return order;
  }

  async updateStatus(id: string, status: PaymentStatus) {
    const order = await this.prismaService.order.findUnique({ where: { id } });
    // If the order is already paid, we don't want to update it again
    if (order?.status === 'PAID') return;
    await this.prismaService.order.update({
      where: { id },
      data: { status },
    });
  }

  async delete(userId: string, id: string) {
    return this.prismaService.order.delete({ where: { id, buyerId: userId } });
  }

  async findByPaymentId(paymentId: string) {
    return this.prismaService.order.findFirst({
      where: { asaasPaymentId: paymentId },
    });
  }

  async paymentStatus(
    status: 'PAID' | 'EXPIRED' | 'PENDING',
    asaasPaymentId: string,
  ) {
    await this.prismaService.order.update({
      where: {
        asaasPaymentId,
      },
      data: {
        status,
      },
    });
  }

  async validatePayment(paymentId: string, apiKey: string) {
    const response = await fetch(
      `${process.env.ASAAS_API}/payments/${paymentId}`,
      {
        headers: {
          access_token: apiKey,
        },
      },
    );
    const data = (await response.json()) as {
      id: string;
      status: AsaasPaymentStatus;
      subscriptionId: string;
      value: number;
    };

    return data;
  }
}
