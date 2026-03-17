import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { HashService } from 'src/crypto/hash.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { MailService } from './mail/mail.service';
import { MailModule } from './mail/mail.module';
import { UsersService } from 'src/users/user.service';
import { PrismaService } from 'src/prisma.service';
import { PaymentsService } from 'src/payments/payment.service';

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
    PaymentsService,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
