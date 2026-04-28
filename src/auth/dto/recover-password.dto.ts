import { IsString, MaxLength, MinLength } from 'class-validator';

export class RecoverPasswordDto {
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  password: string;
}
