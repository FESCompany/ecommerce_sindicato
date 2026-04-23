import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { HashService } from 'src/hash/hash.service';
import { MailModule } from '../mail/mail.module';
import { UsersService } from 'src/users/user.service';
import { PrismaService } from 'src/prisma.service';
import { BillingService } from 'src/billing/billing.service';
import { OrdersService } from 'src/orders/orders.service';
import { CryptoService } from 'src/crypto/crypto.service';
import { PaymentProviderService } from 'src/payment-provider/payment-provider.service';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { PaymentGatewayService } from 'src/payment-gateway/payment-gateway.service';
import { RegisterService } from './register.service';
import { MailService } from 'src/mail/mail.service';
import { AccountService } from 'src/account/account.service';
import { SlugService } from 'src/slug/slug.service';
import { PaymentGatewayModule } from 'src/payment-gateway/payment-gateway.module';
import { TokenModule } from 'src/token/token.module';

@Module({
  imports: [TokenModule, MailModule, PaymentGatewayModule],
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
    PaymentGatewayService,
    RegisterService,
    AccountService,
    SlugService,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
