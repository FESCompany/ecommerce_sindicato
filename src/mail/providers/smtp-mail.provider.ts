import { MailerService } from '@nestjs-modules/mailer';
import { MailProvider } from './mail-provider.provider';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SmtpMailProvider implements MailProvider {
  constructor(private readonly mailerService: MailerService) {}
  async sendRecoveryPasswordEmail(to: string, token: string): Promise<any> {
    return this.mailerService.sendMail({
      to,
      subject: 'Recover Password',
      template: 'recovery-password',
      context: { token },
    });
  }
}
