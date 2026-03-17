import { ConflictException, Injectable } from '@nestjs/common';
import { HashService } from 'src/crypto/hash.service';
import { JwtService } from '@nestjs/jwt';
import { UpdateUserDto } from './dto/update-user.dto';
import { MailService } from './mail/mail.service';
import { UsersService } from 'src/users/user.service';
import { Prisma } from 'src/generated/prisma/client';
import { generateSlug } from 'src/common/utils/slug.util';
import { PaymentsService } from 'src/payments/payment.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { PaymentStatus } from 'src/payments/dtos/create-payment.dto';
import { Cicly } from 'src/payments/dtos/subscription-register.dto';

@Injectable()
export class AuthService {
  constructor(
    private hashService: HashService,
    private jwtService: JwtService,
    private mailService: MailService,
    private usersService: UsersService,
    private paymentsService: PaymentsService,
  ) {}

  async register(data: RegisterUserDto) {
    try {
      // 1. creating asaas (payment service) client
      const costumer = await this.paymentsService.client({
        name: data.username,
        email: data.email,
        postalCode: data.postalCode,
        cpfCnpj: data.cpfCnpj,
      });

      // 2. create charge
      const payment = await this.paymentsService.subscription({
        customer: costumer.id,
        billingType: data.billingType,
        value: 400,
        cicly: Cicly.MONTHLY,
        nextDueDate: new Date(),
      });

      const hashedPassword = await this.hashService.hash(data.password);
      data.password = hashedPassword;

      let storeSlug: string | undefined;

      if (data.storeName)
        storeSlug = await this.generateUniqueSlug(data.storeName);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { billingType, ...rest } = data;

      const createdUser = await this.usersService.createUser({
        ...rest,
        active: false,
        asaasCustomerId: costumer.id,
        storeSlug,
      });

      await this.paymentsService.create({
        userId: createdUser.id,
        asaasPaymentId: payment.id,
        dueDate: new Date(),
        status: PaymentStatus.PENDING,
      });

      const payload = {
        username: createdUser.username,
        email: createdUser.email,
        cpfCnpj: createdUser.cpfCnpj,
        postalCode: createdUser.postalCode,
        isSelling: createdUser.isSelling,
        storeName: createdUser.storeName,
        storeSlug,
      };
      return {
        ...payload,
        access_token: await this.jwtService.signAsync({
          ...payload,
          sub: createdUser.id,
        }),
        invoiceUrl: payment.invoiceUrl,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ConflictException('Email already exist');
      throw error;
    }
  }
  async login(
    email: string,
    password: string,
  ): Promise<{
    username: string;
    email: string;
    access_token: string;
    isSelling: boolean;
  }> {
    const foundUser = await this.usersService.user({ email });
    if (!foundUser) throw new Error('User not found');

    const isMatch = await this.hashService.compare(
      password,
      foundUser.password,
    );
    if (!isMatch) throw new Error('Invalid password');

    const payload = {
      email: foundUser.email,
      username: foundUser.username,
      isSelling: foundUser.isSelling,
    };
    return {
      ...payload,
      access_token: await this.jwtService.signAsync({
        ...payload,
        sub: foundUser.id,
      }),
    };
  }
  async update(
    email: string,
    data: UpdateUserDto,
  ): Promise<{ username: string; email: string; isSelling: boolean }> {
    try {
      const foundUser = await this.usersService.user({ email });
      if (!foundUser) {
        throw new Error('User not found');
      }

      let storeSlug: string | undefined;

      if (data.storeName)
        storeSlug = await this.generateUniqueSlug(data.storeName);

      const updatedUser = await this.usersService.updateUser({
        where: { email },
        data: {
          ...data,
          storeSlug,
        },
      });

      return {
        username: updatedUser.username,
        email: updatedUser.email,
        isSelling: updatedUser.isSelling,
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
      isSelling: foundUser.isSelling,
    };
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });
    await this.mailService.sendRecoveryPasswordEmail(foundUser.email, token);
  }

  async delete(email: string) {
    const foundUser = await this.usersService.user({ email });
    if (!foundUser) {
      throw new Error('User not found');
    }
    await this.usersService.deleteUser({ email });
  }

  private async generateUniqueSlug(storeName: string): Promise<string> {
    const baseSlug = generateSlug(storeName);
    let slug = baseSlug;
    let counter = 2;

    while (true) {
      const existing = await this.usersService.user({
        storeSlug: slug,
      });

      if (!existing) return slug;

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
}
