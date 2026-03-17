import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'Store name must be at least 6 characters long' })
  @MaxLength(20, { message: 'Store name must be at most 20 characters long' })
  username?: string;

  @IsEmail()
  @IsOptional()
  @MinLength(6)
  @MaxLength(50)
  email?: string;

  @IsString()
  @MinLength(11, { message: 'CPF or CNPJ must be at most 11 characters long' })
  @MaxLength(14, { message: 'CPF or CNPJ must be at least 14 characters long' })
  @IsOptional()
  cpfCnpj?: string;

  @IsString()
  @MinLength(8, { message: 'CPF or CNPJ must be at most 8 characters long' })
  @MaxLength(8, { message: 'CPF or CNPJ must be at least 8 characters long' })
  @IsOptional()
  postalCode?: string;

  @IsString()
  @MinLength(6, { message: 'Store name must be at least 6 characters long' })
  @MaxLength(20, { message: 'Store name must be at most 20 characters long' })
  @IsOptional()
  storeName?: string;
}
