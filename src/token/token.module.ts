import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from './token.service';
import { ConfigService } from '@nestjs/config';

@Global()
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
  ],
  providers: [TokenService],
  exports: [
    TokenService,
    JwtModule, // 🔥 ESSA LINHA RESOLVE
  ],
})
export class TokenModule {}
