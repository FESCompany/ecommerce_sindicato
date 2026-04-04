import { BadRequestException, Injectable } from '@nestjs/common';
import { BillingService } from 'src/billing/billing.service';
import { HashService } from 'src/hash/hash.service';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { UsersService } from 'src/users/user.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { Cycle } from 'src/payment-gateway/dtos/create-charge.dto';
import { PaymentStatus } from 'src/subscription/dtos/create-payment.dto';
import { SlugService } from 'src/slug/slug.service';
import { User } from '@prisma/client';

type RegisterResult = {
  user: User;
  charge?: {
    id: string;
    invoiceUrl?: string;
  };
};

@Injectable()
export class RegisterService {
  constructor(
    private usersService: UsersService,
    private billingService: BillingService,
    private subscriptionService: SubscriptionService,
    private hashService: HashService,
    private slugService: SlugService,
  ) {}
  async execute(data: RegisterUserDto): Promise<RegisterResult> {
    const hashedPassword = await this.hashService.hash(data.password);
    const { billingType, ...rest } = data;
    // business rule: if user is not selling, it must not have store name and billing type
    if (!data.isSelling) {
      const user = await this.usersService.createUser({
        ...rest,
        password: hashedPassword,
        active: true,
      });
      return { user };
    }

    if (!data.storeName || !data.billingType)
      throw new BadRequestException(
        'Selling users must provide storeName and billingType',
      );

    let storeSlug: string | undefined;
    if (data.storeName)
      storeSlug = await this.slugService.generateUniqueSlug(data.storeName);

    const user = await this.usersService.createUser({
      ...rest,
      password: hashedPassword,
      active: false,
      storeSlug,
    });

    const subscription = await this.subscriptionService.create({
      userId: user.id,
      dueDate: new Date(),
      status: PaymentStatus.PENDING,
    });

    const { customerId, charge } =
      await this.billingService.createCustomerWithCharge(
        {
          ...data,
          billingType: billingType!,
          nextDueDate: new Date(),
          value: 400,
          cycle: Cycle.MONTHLY,
          customerExternalReference: user.id,
          chargeExternalReference: subscription.id,
        },
        'subscription',
      );

    await this.usersService.updateUser({
      where: { id: user.id },
      data: {
        asaasCustomerId: customerId,
      },
    });

    await this.subscriptionService.update({
      where: { id: subscription.id },
      data: {
        asaasSubscriptionId: charge.id,
      },
    });

    return { user, charge };
  }
}
