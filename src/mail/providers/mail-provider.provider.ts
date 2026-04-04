export type MailResponse = {
  success: boolean;
  messageId?: string;
  provider: 'smtp' | 'mock' | 'sandbox';
  to: string;
  subject?: string;
  error?: string;
};

export interface MailProvider {
  sendRecoveryPasswordEmail(
    email: string,
    token: string,
  ): Promise<MailResponse>;
}
