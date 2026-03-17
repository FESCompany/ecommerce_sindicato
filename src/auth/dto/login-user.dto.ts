import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginUserDto {
  @IsEmail()
  @MinLength(6)
  @MaxLength(50)
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(20)
  password: string;
}
