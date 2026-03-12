import { ConflictException, Injectable } from '@nestjs/common';
import { User } from './interfaces/user.interface';
import { HashService } from 'src/crypto/hash.service';
import { JwtService } from '@nestjs/jwt';
import { UpdateUserDto } from './dto/update-user.dto';
import { MailService } from './mail/mail.service';
import { UsersService } from 'src/users/user.service';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private hashService: HashService,
    private jwtService: JwtService,
    private mailService: MailService,
    private usersService: UsersService,
  ) {}

  async register(
    data: User,
  ): Promise<{ username: string; email: string; access_token: string }> {
    try {
      const hashedPassword = await this.hashService.hash(data.password);
      data.password = hashedPassword;
      const createdUser = await this.usersService.createUser(data);
      const payload = {
        sub: createdUser.id,
        email: createdUser.email,
        username: createdUser.username,
      };
      return {
        username: createdUser.username,
        email: createdUser.email,
        access_token: await this.jwtService.signAsync(payload),
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ConflictException('Email already exists');
      throw error;
    }
  }
  async login(
    email: string,
    password: string,
  ): Promise<{ username: string; email: string; access_token: string }> {
    const foundUser = await this.usersService.user({ email });
    if (!foundUser) throw new Error('User not found');

    const isMatch = await this.hashService.compare(
      password,
      foundUser.password,
    );
    if (!isMatch) throw new Error('Invalid password');

    const payload = {
      sub: foundUser.id,
      email: foundUser.email,
      username: foundUser.username,
    };
    return {
      username: foundUser.username,
      email: foundUser.email,
      access_token: await this.jwtService.signAsync(payload),
    };
  }
  async update(
    email: string,
    data: UpdateUserDto,
  ): Promise<{ username: string; email: string }> {
    try {
      const foundUser = await this.usersService.user({ email });
      if (!foundUser) {
        throw new Error('User not found');
      }

      const updatedUser = await this.usersService.updateUser({
        where: { email },
        data,
      });

      return {
        username: updatedUser.username,
        email: updatedUser.email,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ConflictException('Email already exists');
      throw error;
    }
  }
  async recoveryPassword(email: string) {
    const foundUser = await this.usersService.user({ email });
    if (!foundUser) {
      throw new Error('User not found');
    }
    const payload = {
      sub: foundUser.id,
      email: foundUser.email,
      username: foundUser.username,
    };
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });
    await this.mailService.sendRecoveryPasswordEmail(foundUser.email, token);
  }
}
