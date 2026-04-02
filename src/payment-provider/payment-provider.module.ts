import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { PaymentProviderService } from './payment-provider.service';
import { PaymentProviderController } from './payment-provider.controller';
import { CryptoService } from 'src/crypto/crypto.service';
import { UsersService } from 'src/users/user.service';

@Module({
  imports: [],
  providers: [
    PaymentProviderService,
    PrismaService,
    CryptoService,
    UsersService,
  ],
  controllers: [PaymentProviderController],
  exports: [PaymentProviderService],
})
export class PaymentProviderModule {}
