import { IsEnum, IsNumber, IsString } from 'class-validator';
import { BillingType } from 'src/auth/dto/register-user.dto';

export class CreateOrderDto {
  @IsString()
  productId: string;

  @IsNumber()
  amount: number;

  @IsString()
  slug: string;

  @IsEnum(BillingType)
  billingType: BillingType;
}
