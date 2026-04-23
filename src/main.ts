import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ServiceAccount } from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService: ConfigService = app.get(ConfigService);
  app.use(cookieParser());
  app.enableCors({
    origin: 'http://localhost:5173', // frontend
    credentials: true,
  });
  const adminConfig: ServiceAccount = {
    projectId: configService.get<string>('FIREBASE_PROJECT_ID'),
    privateKey: configService
      .get<string>('FIREBASE_PRIVATE_KEY')
      ?.replace(/\\n/g, '\n'),
    clientEmail: configService.get<string>('FIREBASE_CLIENT_EMAIL'),
  };
  admin.initializeApp({
    credential: admin.credential.cert(adminConfig),
    storageBucket: `${configService.get<string>('FIREBASE_PROJECT_ID')}.firebasestorage.app`,
  });

  await app.listen(configService.get<string>('PORT') ?? 3000);
}
bootstrap();
