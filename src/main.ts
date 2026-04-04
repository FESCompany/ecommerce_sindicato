import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ServiceAccount } from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService: ConfigService = app.get(ConfigService);

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

  app.enableCors();
  await app.listen(configService.get<string>('PORT') ?? 3000);
}
bootstrap();
