import { Injectable } from '@nestjs/common';
import { MailProvider, MailResponse } from './mail-provider.provider';

@Injectable()
export class MockMailProvider implements MailProvider {
  async sendRecoveryPasswordEmail(
    to: string,
    token: string,
  ): Promise<MailResponse> {
    console.log('[MOCK EAMIL]', { to, token });
    return await new Promise((resolve) =>
      resolve({
        success: true,
        provider: 'mock',
        to,
      }),
    );
  }
}
