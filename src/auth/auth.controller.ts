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
  Res,
  UseGuards,
} from '@nestjs/common';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { AuthService } from './auth.service';
import { UpdateUserDto } from '../account/dtos/update-user.dto';
import { AuthGuard } from './auth.guard';
import { ValidationPipe } from 'src/validation.pipe';
import { AccountService } from 'src/account/account.service';
import type { Response } from 'express';
import { RecoverPasswordDto } from './dto/recover-password.dto';
import { RecoverPasswordGuard } from './recover-password.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private accountService: AccountService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Get('me')
  async user(@Request() req: Request) {
    const user = req['user'] as { sub: string };
    return await this.accountService.user(user.sub);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body(new ValidationPipe()) loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(
      loginUserDto.email,
      loginUserDto.password,
    );

    res.cookie('access_token', result.access_token, {
      httpOnly: true, // js scripts has no access
      secure: false, // just https connections
      sameSite: 'lax', //  CSRF basic protection
      maxAge: 1000 * 60 * 60, // 1h
    });

    return {
      success: true,
      message: 'User logged in!',
    };
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  async register(
    @Body(new ValidationPipe()) registerUserDto: RegisterUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(registerUserDto);

    res.cookie('access_token', result.access_token, {
      httpOnly: true, // js scripts has no access
      secure: false, // just https connections
      sameSite: 'lax', //  CSRF basic protection
      maxAge: 1000 * 60 * 60, // 1h
    });

    return {
      success: true,
      message: 'User registered!',
      invoiceUrl: result.invoiceUrl,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Put('send-password-recovery-email')
  async sendPasswordRecoveryEmail(@Body('email') email: string) {
    return await this.authService.sendPasswordRecoveryEmail(email);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(RecoverPasswordGuard)
  @Put('recover-password')
  async recoverPassword(
    @Body(new ValidationPipe()) recoverPassword: RecoverPasswordDto,
    @Request() req: Request,
  ) {
    const user = req['user'] as { sub: string };
    return await this.authService.recoverPassword(
      user.sub,
      recoverPassword.password,
    );
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
  @UseGuards(AuthGuard)
  @Delete('delete')
  async delete(@Request() req: Request) {
    const user = req['user'] as { sub: string };
    return await this.accountService.delete(user.sub);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    return {
      success: true,
      message: 'User logged out!',
    };
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Get('payment')
  async payment(@Request() req: Request) {
    const user = req['user'] as { sub: string };
    return await this.accountService.payment(user.sub);
  }
}
