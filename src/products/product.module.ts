import { Module } from '@nestjs/common';
import { ProductsService } from './product.service';
import { ProductController } from './product.controller';
import { PrismaService } from 'src/prisma.service';
import { CryptoService } from 'src/crypto/crypto.service';
import { PaymentProviderService } from 'src/payment-provider/payment-provider.service';
import { UsersService } from 'src/users/user.service';
import { PaymentGatewayService } from 'src/payment-gateway/payment-gateway.service';
import { PaymentGatewayModule } from 'src/payment-gateway/payment-gateway.module';

@Module({
  imports: [PaymentGatewayModule],
  providers: [
    ProductsService,
    PrismaService,
    PaymentProviderService,
    UsersService,
    CryptoService,
    PaymentGatewayService,
  ],
  controllers: [ProductController],
  exports: [ProductsService],
})
export class ProductsModule {}
