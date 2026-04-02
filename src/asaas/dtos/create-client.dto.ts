import { IsEmail, IsString } from 'class-validator';

export class CreateClientDto {
  @IsString()
  name: string;

  @IsString()
  cpfCnpj: string;

  @IsEmail()
  email: string;

  @IsString()
  postalCode: string;
}
