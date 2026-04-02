import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { HashService } from 'src/hash/hash.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { MailService } from './mail/mail.service';
import { MailModule } from './mail/mail.module';
import { UsersService } from 'src/users/user.service';
import { PrismaService } from 'src/prisma.service';
import { BillingService } from 'src/billing/billing.service';
import { OrdersService } from 'src/orders/orders.service';
import { CryptoService } from 'src/crypto/crypto.service';
import { PaymentProviderService } from 'src/payment-provider/payment-provider.service';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { AsaasService } from 'src/asaas/asaas.service';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1d' },
    }),
    MailModule,
  ],
  providers: [
    AuthService,
    HashService,
    MailService,
    UsersService,
    PrismaService,
    SubscriptionService,
    BillingService,
    PaymentProviderService,
    OrdersService,
    CryptoService,
    AsaasService,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
