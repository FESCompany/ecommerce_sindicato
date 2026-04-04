import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  EXPIRED = 'EXPIRED',
}

export class CreatePaymentDto {
  @IsString()
  userId: string;

  @IsString()
  @IsOptional()
  asaasSubscriptionId?: string;

  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @IsDate()
  @Type(() => Date)
  dueDate: Date;
}
