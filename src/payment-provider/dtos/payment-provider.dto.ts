import { IsEnum, IsString } from 'class-validator';

export enum SellerPaymentProvider {
  ASAASTransfer = 'ASAASTransfer',
}

export class PaymentProviderDto {
  @IsEnum(SellerPaymentProvider)
  provider: SellerPaymentProvider;

  @IsString()
  apiKey: string;
}
