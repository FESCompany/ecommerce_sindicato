import { IsNumber, IsString } from 'class-validator';

export class OrderDto {
  @IsString()
  buyerId: string;

  @IsString()
  sellerId: string;

  @IsString()
  productId: string;

  @IsString()
  asaasPaymentId: string;

  @IsNumber()
  price: number;
}
