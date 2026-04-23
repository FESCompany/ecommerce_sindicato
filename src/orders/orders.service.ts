import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreatePaymentProviderOrderDto } from './dtos/create-payment-provider-order.dto';
import { PaymentProviderService } from 'src/payment-provider/payment-provider.service';
import { BillingService } from 'src/billing/billing.service';
import { PaymentStatus, Prisma } from '@prisma/client';

type ItemData = {
  productId: string;
  price: number;
  quantity: number;
};

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

    if (!buyer) throw new NotFoundException('User not found');

    try {
      return this.prismaService.order.findFirst({
        where: {
          id,
          buyerId: buyer.id,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    } catch {
      throw new InternalServerErrorException('Failed to fetch order');
    }
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

    if (!buyer) throw new NotFoundException('User not found');

    try {
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
          total: true,
          asaasPaymentId: true,
          buyer: true,
          seller: true,
          createdAt: true,
          items: {
            select: {
              productId: true,
              quantity: true,
              price: true,
              product: true, // opcional (join)
            },
          },
        },
      });
    } catch {
      throw new InternalServerErrorException('Failed to fetch orders');
    }
  }

  async sellerOrders(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.OrderWhereUniqueInput;
    userId: string;
    orderBy?: Prisma.OrderOrderByWithRelationInput;
  }) {
    const seller = await this.prismaService.user.findUnique({
      where: { id: params.userId },
      select: { id: true },
    });

    if (!seller) throw new NotFoundException('Seller not found');

    try {
      return this.prismaService.order.findMany({
        skip: params.skip,
        take: params.take,
        cursor: params.cursor,
        where: {
          sellerId: seller.id,
        },
        orderBy: params.orderBy,
        select: {
          id: true,
          status: true,
          total: true,
          asaasPaymentId: true,
          buyer: {
            select: {
              username: true,
              email: true,
            },
          },
          createdAt: true,
          items: {
            select: {
              productId: true,
              quantity: true,
              price: true,
              product: true, // opcional (join)
            },
          },
        },
      });
    } catch {
      throw new InternalServerErrorException('Failed to fetch orders');
    }
  }

  async sellerOrder(userId: string, id: string) {
    const seller = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!seller) throw new NotFoundException('User not found');

    try {
      return this.prismaService.order.findFirst({
        where: {
          id,
          sellerId: seller.id,
        },
        select: {
          id: true,
          status: true,
          total: true,
          buyer: {
            select: {
              username: true,
              email: true,
            },
          },
          createdAt: true,
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  image: true,
                },
              },
            },
          },
        },
      });
    } catch {
      throw new InternalServerErrorException('Failed to fetch order');
    }
  }

  async createPaymentProviderOrder(
    createPaymentProviderOrderDto: CreatePaymentProviderOrderDto,
  ) {
    const buyer = await this.prismaService.user.findUnique({
      where: { id: createPaymentProviderOrderDto.userId },
    });

    if (!buyer) throw new NotFoundException('User not found');

    // search all products at once (perfomance)
    const products = await this.prismaService.product.findMany({
      where: {
        id: {
          in: createPaymentProviderOrderDto.items.map((i) => i.productId),
        },
      },
    });

    if (products.length !== createPaymentProviderOrderDto.items.length)
      throw new NotFoundException('One or more products not found');

    let total = 0;
    const itemsData: ItemData[] = [];

    for (const item of createPaymentProviderOrderDto.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new NotFoundException('Product not found');
      if (product.userId === createPaymentProviderOrderDto.userId)
        throw new BadRequestException('You cannot buy your own product');
      if (product.stock < item.quantity)
        throw new BadRequestException(
          `Insufficient stock for product ${product.name}`,
        );
      total += product.price * item.quantity;
      itemsData.push({
        productId: product.id,
        price: product.price,
        quantity: item.quantity,
      });
    }

    // seller id
    const sellerId = products[0].userId;

    try {
      // create order + items
      const order = await this.prismaService.order.create({
        data: {
          buyerId: createPaymentProviderOrderDto.userId,
          sellerId,
          total,
          items: {
            create: itemsData,
          },
        },
      });

      // seller provider api key
      const apiKey =
        await this.paymentProviderService.getDecryptedApiKey(sellerId);

      // create charge
      const { charge } = await this.billingService.createCustomerWithCharge(
        {
          username: buyer.username,
          email: buyer.email,
          cpfCnpj: buyer.cpfCnpj,
          postalCode: buyer.postalCode,
          billingType: createPaymentProviderOrderDto.billingType,
          dueDate: createPaymentProviderOrderDto.dueDate,
          value: total,
          customerExternalReference: buyer.id,
          chargeExternalReference: order.id,
        },
        'payment',
        apiKey,
      );

      // save paymentId
      await this.prismaService.order.update({
        data: {
          asaasPaymentId: charge.id,
        },
        where: {
          id: order.id,
        },
      });

      return {
        invoiceUrl: charge.invoiceUrl,
      };
    } catch (error) {
      if (error instanceof Error) throw new Error(error.message);
      throw new InternalServerErrorException(
        'Failed to create payment provider order',
      );
    }
  }

  async updateStatus(paymentId: string, status: PaymentStatus) {
    try {
      const order = await this.prismaService.order.findUnique({
        where: { asaasPaymentId: paymentId },
        include: { items: true },
      });
      if (!order) return;
      // if the order has the same status, nothing needs to be done
      if (order.status === status) return;
      // If the order is already paid, we don't want to update it again
      if (order?.status === 'PAID') return;

      await this.prismaService.$transaction(async (tx) => {
        await tx.order.update({
          where: {
            id: order.id,
          },
          data: {
            status,
          },
        });
        if (status === 'PAID') {
          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  decrement: item.quantity,
                },
                soldCount: {
                  increment: item.quantity,
                },
              },
            });
          }
        }
      });

      return await this.prismaService.order.update({
        where: { asaasPaymentId: paymentId },
        data: { status },
      });
    } catch (error) {
      if (error instanceof Error) throw new Error(error.message);
      throw new InternalServerErrorException('Failed to update order status');
    }
  }

  async delete(userId: string, id: string) {
    try {
      return this.prismaService.order.delete({
        where: { id, buyerId: userId },
      });
    } catch (error) {
      if (error instanceof Error) throw new Error(error.message);
      throw new InternalServerErrorException('Failed to delete order');
    }
  }

  async findByPaymentId(paymentId: string) {
    try {
      return this.prismaService.order.findFirst({
        where: { asaasPaymentId: paymentId },
      });
    } catch (error) {
      if (error instanceof Error) throw new Error(error.message);
      throw new InternalServerErrorException(
        'Failed to find order by payment id',
      );
    }
  }
}
