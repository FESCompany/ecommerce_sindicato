import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum BillingType {
  PIX = 'PIX',
  CREDIT_CARD = 'CREDIT_CARD',
}

export class RegisterUserDto {
  @IsString()
  @MinLength(6, { message: 'Username must be at least 6 characters long' })
  @MaxLength(20, { message: 'Username must be at most 20 characters long' })
  username: string;

  @IsEmail()
  @MinLength(6, { message: 'Email must be at least 6 characters long' })
  @MaxLength(50, { message: 'Email must be at most 50 characters long' })
  email: string;

  @IsString()
  @MinLength(11, { message: 'CPF or CNPJ must be at most 11 characters long' })
  @MaxLength(14, { message: 'CPF or CNPJ must be at least 14 characters long' })
  cpfCnpj: string;

  @IsString()
  @MinLength(8, { message: 'CPF or CNPJ must be at most 8 characters long' })
  @MaxLength(8, { message: 'CPF or CNPJ must be at least 8 characters long' })
  postalCode: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(20, { message: 'Password must be at most 20 characters long' })
  password: string;

  @IsString()
  @MinLength(6, { message: 'Store name must be at least 6 characters long' })
  @MaxLength(20, { message: 'Store name must be at most 20 characters long' })
  @IsOptional()
  storeName?: string;

  @IsEnum(BillingType)
  @IsOptional()
  billingType?: BillingType;

  @IsBoolean()
  isSelling: boolean;
}
