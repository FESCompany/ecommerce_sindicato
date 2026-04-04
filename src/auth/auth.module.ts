import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { HashService } from 'src/hash/hash.service';
import { JwtModule } from '@nestjs/jwt';
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
import { ConfigService } from '@nestjs/config';
import { TokenService } from 'src/token/token.service';
import { SlugService } from 'src/slug/slug.service';
import { PaymentGatewayModule } from 'src/payment-gateway/payment-gateway.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET')!,
        signOptions: {
          expiresIn: config.get('JWT_EXPIRES_IN')!,
        },
      }),
    }),
    MailModule,
    PaymentGatewayModule,
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
    PaymentGatewayService,
    RegisterService,
    AccountService,
    TokenService,
    SlugService,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
