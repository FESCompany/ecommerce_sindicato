import { Inject, Injectable, Logger } from '@nestjs/common';
import { type MailProvider } from './providers/mail-provider.provider';
import { MAIL_PROVIDER } from './tokens/mail.token';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  constructor(@Inject(MAIL_PROVIDER) private mailProvider: MailProvider) {}
  async sendRecoveryPasswordEmail(to: string, token: string) {
    try {
      return await this.mailProvider.sendRecoveryPasswordEmail(to, token);
    } catch (error) {
      this.logger.error('Error sending recovery password email', error);
      throw new Error('Failed to send recovery password email');
    }
  }
}
