import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreatePaymentDto } from './dtos/create-payment.dto';
import { Prisma, Subscription } from '@prisma/client';

@Injectable()
export class SubscriptionService {
  constructor(private prismaService: PrismaService) {}

  async create(createPaymentDto: CreatePaymentDto) {
    try {
      return await this.prismaService.subscription.create({
        data: createPaymentDto,
      });
    } catch (error) {
      if (error instanceof Error) throw new Error(error.message);
      throw new InternalServerErrorException('Failed to create subscription');
    }
  }

  async update(params: {
    where: Prisma.SubscriptionWhereUniqueInput;
    data: Prisma.SubscriptionUpdateInput;
  }): Promise<Subscription> {
    const { where, data } = params;

    try {
      return await this.prismaService.subscription.update({
        data,
        where,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ConflictException('User already exists');
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        throw new NotFoundException('User not found');
      if (error instanceof Error) throw new Error(error.message);
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  async getSubscriptionById(subscriptionId: string) {
    try {
      return await this.prismaService.subscription.findUnique({
        where: { id: subscriptionId },
      });
    } catch (error) {
      if (error instanceof Error) throw new Error(error.message);
      throw new InternalServerErrorException(
        'Failed to fetch subscription by id',
      );
    }
  }

  async paymentStatus(
    status: 'PAID' | 'EXPIRED' | 'PENDING',
    subscriptionId: string,
  ) {
    try {
      const payment = await this.prismaService.subscription.update({
        where: {
          id: subscriptionId,
        },
        data: {
          status,
        },
      });

      const hasValidPayment = await this.prismaService.subscription.findFirst({
        where: {
          userId: payment.userId,
          status: 'PAID',
        },
      });

      return await this.prismaService.user.update({
        where: { id: payment.userId },
        data: {
          active: !!hasValidPayment,
        },
      });
    } catch (error) {
      if (error instanceof Error) throw new Error(error.message);
      throw new InternalServerErrorException(
        'Failed to upload subscription payment status',
      );
    }
  }
}
