import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async user(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: userWhereUniqueInput,
      });
    } catch (error) {
      if (error instanceof Error) throw new Error(error.message);
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  async users(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, cursor, where, orderBy } = params;

    try {
      return await this.prisma.user.findMany({
        skip,
        take,
        cursor,
        where,
        orderBy,
      });
    } catch (error) {
      if (error instanceof Error) throw new Error(error.message);
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  async clients(sellerId: string) {
    return this.prisma.user.findMany({
      where: {
        buyerOrders: {
          some: {
            sellerId: sellerId,
          },
        },
      },
      select: {
        id: true,
        username: true,
        email: true,
        buyerOrders: {
          where: {
            sellerId,
          },
          select: {
            id: true,
            total: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    try {
      return await this.prisma.user.create({
        data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('User already exists');
      }
      if (error instanceof Error) throw new Error(error.message);
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async updateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;

    try {
      return await this.prisma.user.update({
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

  async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    try {
      return await this.prisma.user.delete({
        where,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('User not found');
      }
      if (error instanceof Error) throw new Error(error.message);
      throw new InternalServerErrorException('Failed to delete user');
    }
  }
}
