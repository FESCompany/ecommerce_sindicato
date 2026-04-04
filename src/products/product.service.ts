import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import * as admin from 'firebase-admin';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prismaService: PrismaService) {}

  async product(slug: string, id: string): Promise<ProductResponseDto | null> {
    try {
      const store = await this.prismaService.user.findUnique({
        where: { storeSlug: slug },
        select: { id: true },
      });

      if (!store) throw new NotFoundException('Seller not found');

      return this.prismaService.product.findFirst({
        where: {
          id,
          userId: store.id,
        },
        select: {
          id: true,
          name: true,
          description: true,
          stock: true,
          soldCount: true,
          price: true,
          createdAt: true,
          updatedAt: true,
          image: true,
          userId: true,
        },
      });
    } catch (error) {
      if (error instanceof Error) throw new Error(error.message);
      throw new InternalServerErrorException('Failed to fetch product');
    }
  }
  async products(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ProductWhereUniqueInput;
    slug: string;
    orderBy?: Prisma.ProductOrderByWithRelationInput;
  }): Promise<ProductResponseDto[] | null> {
    try {
      const store = await this.prismaService.user.findUnique({
        where: { storeSlug: params.slug },
        select: { id: true },
      });

      if (!store) return null;

      return this.prismaService.product.findMany({
        skip: params.skip,
        take: params.take,
        cursor: params.cursor,
        where: {
          userId: store.id,
        },
        orderBy: params.orderBy,
        select: {
          id: true,
          name: true,
          description: true,
          stock: true,
          soldCount: true,
          price: true,
          createdAt: true,
          updatedAt: true,
          image: true,
          userId: true,
        },
      });
    } catch (error) {
      if (error instanceof Error) throw new Error(error.message);
      throw new InternalServerErrorException('Failed to fetch products');
    }
  }

  async createProduct(
    data: CreateProductDto,
    userId: string,
  ): Promise<ProductResponseDto> {
    try {
      return this.prismaService.product.create({
        data: {
          ...data,
          userId,
          soldCount: 0,
        },
        select: {
          id: true,
          name: true,
          description: true,
          stock: true,
          soldCount: true,
          price: true,
          createdAt: true,
          updatedAt: true,
          image: true,
          userId: true,
        },
      });
    } catch (error) {
      if (error instanceof Error) throw new Error(error.message);
      throw new InternalServerErrorException('Failed to create product');
    }
  }

  async updateProduct(params: {
    where: Prisma.ProductWhereUniqueInput;
    data: Prisma.ProductUpdateInput;
  }): Promise<ProductResponseDto> {
    try {
      return this.prismaService.product.update({
        where: params.where,
        data: params.data,
        select: {
          id: true,
          name: true,
          description: true,
          stock: true,
          soldCount: true,
          price: true,
          createdAt: true,
          updatedAt: true,
          image: true,
          userId: true,
        },
      });
    } catch (error) {
      if (error instanceof Error) throw new Error(error.message);
      throw new InternalServerErrorException('Failed to update product');
    }
  }

  async upload(file: Express.Multer.File, userId: string, productId: string) {
    try {
      const store = await this.prismaService.user.findUnique({
        where: {
          id: userId,
        },
      });
      const product = await this.prismaService.product.findFirst({
        where: {
          id: productId,
          userId,
        },
      });

      if (!store || !product) return null;

      const bucket = admin.storage().bucket();
      const fileName = `images/${store.storeSlug}/${Date.now()}-${file.originalname}`;
      const fileUpload = bucket.file(fileName);

      // if there is an existing image, we just delete it, and upload the new one
      if (product.image) {
        await bucket.file(product.image).delete();
      }

      await fileUpload.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
        },
      });
      const [url] = await fileUpload.getSignedUrl({
        action: 'read',
        expires: '03-09-2491',
      });
      await this.prismaService.product.update({
        where: {
          id: productId,
          userId,
        },
        data: {
          image: fileName,
        },
      });
      return { url };
    } catch (error) {
      if (error instanceof Error) throw new Error(error.message);
      throw new InternalServerErrorException('Failed to upload product image');
    }
  }

  async deleteProduct(
    where: Prisma.ProductWhereUniqueInput,
  ): Promise<ProductResponseDto> {
    try {
      return this.prismaService.product.delete({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          stock: true,
          soldCount: true,
          price: true,
          createdAt: true,
          updatedAt: true,
          image: true,
          userId: true,
        },
      });
    } catch (error) {
      if (error instanceof Error) throw new Error(error.message);
      throw new InternalServerErrorException('Failed to delete product');
    }
  }
}
