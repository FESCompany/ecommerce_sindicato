import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { PaymentProviderService } from './payment-provider.service';
import { PaymentProviderController } from './payment-provider.controller';
import { CryptoService } from 'src/crypto/crypto.service';
import { UsersService } from 'src/users/user.service';
import { PaymentGatewayService } from 'src/payment-gateway/payment-gateway.service';
import { PaymentGatewayModule } from 'src/payment-gateway/payment-gateway.module';

@Module({
  imports: [PaymentGatewayModule],
  providers: [
    PaymentProviderService,
    PrismaService,
    CryptoService,
    UsersService,
    PaymentGatewayService,
  ],
  controllers: [PaymentProviderController],
  exports: [PaymentProviderService],
})
export class PaymentProviderModule {}
