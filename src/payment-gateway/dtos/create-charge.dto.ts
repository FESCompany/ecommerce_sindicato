import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { BillingType } from 'src/auth/dto/register-user.dto';

export enum Cycle {
  MONTHLY = 'MONTHLY',
}

export class CreateChargeDto {
  @IsString()
  customer: string;

  @IsEnum(BillingType)
  billingType: BillingType;

  @IsNumber()
  value: number;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dueDate?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  nextDueDate?: Date;

  @IsEnum(Cycle)
  @IsOptional()
  cycle?: Cycle;
}
