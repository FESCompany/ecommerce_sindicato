import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, IsString } from 'class-validator';
import { BillingType } from 'src/auth/dto/register-user.dto';

export class CreatePaymentProviderOrderDto {
  @IsString()
  userId: string;

  @IsString()
  productId: string;

  @IsNumber()
  amount: number;

  @IsNumber()
  price: number;

  @IsEnum(BillingType)
  billingType: BillingType;

  @IsDate()
  @Type(() => Date)
  dueDate: Date;
}
