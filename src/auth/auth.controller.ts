import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { AuthService } from './auth.service';
import { UpdateUserDto } from '../account/dtos/update-user.dto';
import { AuthGuard } from './auth.guard';
import { ValidationPipe } from 'src/validation.pipe';
import { AccountService } from 'src/account/account.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private accountService: AccountService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body(new ValidationPipe()) loginUserDto: LoginUserDto) {
    return await this.authService.login(
      loginUserDto.email,
      loginUserDto.password,
    );
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  async register(@Body(new ValidationPipe()) registerUserDto: RegisterUserDto) {
    return await this.authService.register(registerUserDto);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Put('update')
  async update(
    @Body(new ValidationPipe()) updateUserDto: UpdateUserDto,
    @Request() req: Request,
  ) {
    const user = req['user'] as { sub: string };
    return await this.accountService.update(user.sub, updateUserDto);
  }

  @HttpCode(HttpStatus.OK)
  @Get('recovery-password')
  async recoveryPassword(@Body('email') email: string) {
    return await this.authService.recoveryPassword(email);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Delete('delete')
  async delete(@Request() req: Request) {
    const user = req['user'] as { sub: string };
    return await this.accountService.delete(user.sub);
  }
}
