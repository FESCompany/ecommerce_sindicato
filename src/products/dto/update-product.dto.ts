import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  price?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  amount?: number;
}
