import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { HashService } from 'src/hash/hash.service';
import { UsersService } from 'src/users/user.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { RegisterService } from './register.service';
import { TokenService } from 'src/token/token.service';
import { MailService } from 'src/mail/mail.service';

type RegisterResponse = {
  access_token: string;
  invoiceUrl: string | undefined;
};

type LoginResponse = {
  access_token: string;
};

@Injectable()
export class AuthService {
  constructor(
    private hashService: HashService,
    private mailService: MailService,
    private usersService: UsersService,
    private registerService: RegisterService,
    private tokenService: TokenService,
  ) {}

  async register(data: RegisterUserDto): Promise<RegisterResponse> {
    const result = await this.registerService.execute(data);
    const payload = {
      sub: result.user.id,
      email: result.user.email,
      username: result.user.username,
      isSelling: result.user.isSelling,
    };
    return {
      access_token: await this.tokenService.generateToken(payload),
      invoiceUrl: result.invoiceUrl,
    };
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const foundUser = await this.usersService.user({ email });
    if (!foundUser) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await this.hashService.compare(
      password,
      foundUser.password,
    );
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = {
      sub: foundUser.id,
      email: foundUser.email,
      username: foundUser.username,
      isSelling: foundUser.isSelling,
    };
    return {
      access_token: await this.tokenService.generateToken(payload),
    };
  }

  async sendPasswordRecoveryEmail(email: string) {
    const foundUser = await this.usersService.user({ email });
    if (!foundUser) throw new NotFoundException('User not found');

    const token = await this.tokenService.generateToken(
      {
        sub: foundUser.id,
        email: foundUser.email,
        username: foundUser.username,
      },
      {
        expiresIn: '15m',
      },
    );
    await this.mailService.sendRecoveryPasswordEmail(foundUser.email, token);
    // returning success true since sendRecoveryPasswordEmail is void
    return { success: true };
  }

  async recoverPassword(id: string, password: string) {
    const foundUser = await this.usersService.user({ id });
    if (!foundUser) throw new NotFoundException('User not found');
    const hashedPassword = await this.hashService.hash(password);
    await this.usersService.updateUser({
      where: { id },
      data: { password: hashedPassword },
    });
  }
}
