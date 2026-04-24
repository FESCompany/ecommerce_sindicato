import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { ProductsModule } from './products/product.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { OrderModule } from './orders/orders.module';
import { PaymentProviderModule } from './payment-provider/payment-provider.module';
import { ConfigModule } from '@nestjs/config';
import { TokenModule } from './token/token.module';
import { UsersModule } from './users/user.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    TokenModule, // 👈 ISSO AQUI resolve
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    AuthModule,
    ProductsModule,
    SubscriptionModule,
    OrderModule,
    UsersModule,
    PaymentProviderModule,
    SubscriptionModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('auth');
  }
}
