import { Module } from '@nestjs/common';
import { UsersService } from './user.service';
import { UsersController } from './user.controller';
import { PrismaService } from 'src/prisma.service';
import { PaymentGatewayModule } from 'src/payment-gateway/payment-gateway.module';
import { PaymentProviderService } from 'src/payment-provider/payment-provider.service';
import { CryptoService } from 'src/crypto/crypto.service';

@Module({
  imports: [PaymentGatewayModule],
  providers: [
    UsersService,
    PrismaService,
    PaymentProviderService,
    CryptoService,
  ],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
