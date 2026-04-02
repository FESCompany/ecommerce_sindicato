import { Module } from '@nestjs/common';
import { ProductsService } from './product.service';
import { ProductController } from './product.controller';
import { PrismaService } from 'src/prisma.service';
import { CryptoService } from 'src/crypto/crypto.service';
import { PaymentProviderService } from 'src/payment-provider/payment-provider.service';
import { UsersService } from 'src/users/user.service';

@Module({
  imports: [],
  providers: [
    ProductsService,
    PrismaService,
    PaymentProviderService,
    UsersService,
    CryptoService,
  ],
  controllers: [ProductController],
  exports: [ProductsService],
})
export class ProductsModule {}
