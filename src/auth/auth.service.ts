import { ConflictException, Injectable } from '@nestjs/common';
import { HashService } from 'src/hash/hash.service';
import { JwtService } from '@nestjs/jwt';
import { UpdateUserDto } from './dto/update-user.dto';
import { MailService } from './mail/mail.service';
import { UsersService } from 'src/users/user.service';
import { Prisma } from 'src/generated/prisma/client';
import { generateSlug } from 'src/common/utils/slug.util';
import { RegisterUserDto } from './dto/register-user.dto';
import { PaymentStatus } from 'src/subscription/dtos/create-payment.dto';
import { BillingService } from 'src/billing/billing.service';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { Cycle } from 'src/asaas/dtos/create-charge.dto';

@Injectable()
export class AuthService {
  constructor(
    private hashService: HashService,
    private jwtService: JwtService,
    private mailService: MailService,
    private usersService: UsersService,
    private subscriptionService: SubscriptionService,
    private billingService: BillingService,
  ) {}

  async register(data: RegisterUserDto) {
    try {
      const hashedPassword = await this.hashService.hash(data.password);
      data.password = hashedPassword;

      let storeSlug: string | undefined;

      if (data.storeName)
        storeSlug = await this.generateUniqueSlug(data.storeName);

      const { billingType, ...rest } = data;

      if (!data.isSelling) {
        const createdUser = await this.usersService.createUser({
          ...rest,
          active: true, // já pode ativar direto
          storeSlug,
        });

        const payload = {
          username: createdUser.username,
          email: createdUser.email,
        };

        return {
          ...payload,
          access_token: await this.jwtService.signAsync({
            ...payload,
            sub: createdUser.id,
          }),
        };
      }

      const { customerId, charge } = await this.billingService.createCharge(
        {
          ...data,
          billingType: billingType!,
          nextDueDate: new Date(),
          value: 400,
          cycle: Cycle.MONTHLY,
        },
        'subscription',
      );

      const createdUser = await this.usersService.createUser({
        ...rest,
        active: false,
        asaasCustomerId: customerId,
        storeSlug,
      });

      await this.subscriptionService.create({
        userId: createdUser.id,
        asaasSubscriptionId: charge.id,
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
        invoiceUrl: charge.invoiceUrl,
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
