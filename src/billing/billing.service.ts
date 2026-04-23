import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentGatewayService } from 'src/payment-gateway/payment-gateway.service';
import { Cycle } from 'src/payment-gateway/dtos/create-charge.dto';
import { BillingType } from 'src/auth/dto/register-user.dto';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { UsersService } from 'src/users/user.service';
import { ChargeResponse } from 'src/payment-gateway/providers/payment-gateway.provider';

type BillingDto = {
  username: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  billingType: BillingType;
  dueDate?: Date;
  nextDueDate?: Date;
  value: number;
  cycle?: Cycle;
  customerExternalReference: string;
  chargeExternalReference: string;
};

type CustomerDto = {
  name: string;
  email: string;
  postalCode: string;
  cpfCnpj: string;
  customerExternalReference: string;
};

type ChargeDto = {
  billingType: BillingType;
  dueDate?: Date;
  nextDueDate?: Date;
  value: number;
  cycle?: Cycle;
  chargeExternalReference: string;
};

type CustomerwithChargeResponse = {
  customerId: string;
  charge: ChargeResponse;
};

@Injectable()
export class BillingService {
  constructor(
    private paymentGatewayService: PaymentGatewayService,
    private userService: UsersService,
    private subscriptionService: SubscriptionService,
  ) {}

  async createCustomer(
    customerDto: CustomerDto,
    apiKey?: string,
  ): Promise<{ id: string }> {
    let customerId: string;
    const user = await this.userService.user({
      id: customerDto.customerExternalReference,
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.asaasCustomerId) {
      customerId = user.asaasCustomerId;
    } else {
      const customer = await this.paymentGatewayService.client(
        customerDto,
        apiKey,
      );
      await this.userService.updateUser({
        where: { id: customerDto.customerExternalReference },
        data: {
          asaasCustomerId: customer.id,
        },
      });
      customerId = customer.id;
    }
    return {
      id: customerId,
    };
  }

  async createCharge(
    customerId: string,
    data: ChargeDto,
    type: 'subscription' | 'payment',
    apiKey?: string,
  ) {
    if (type === 'subscription') {
      const subscription = await this.subscriptionService.getSubscriptionById(
        data.chargeExternalReference,
      );

      if (!subscription) throw new NotFoundException('Subscription not found');

      // if already exists, dont create a new one
      if (subscription.asaasSubscriptionId) {
        return subscription;
      }

      // create a new one
      const charge = await this.paymentGatewayService.charge(
        {
          customer: customerId,
          ...data,
        },
        type,
        apiKey,
      );

      // 💾 salva imediatamente
      await this.subscriptionService.update({
        where: { id: subscription.id },
        data: {
          asaasSubscriptionId: charge.id,
        },
      });

      return charge;
    }

    const payment =
      await this.paymentGatewayService.findPaymentByExternalReference(
        data.chargeExternalReference,
        apiKey,
      );

    if (payment) return payment;

    return await this.paymentGatewayService.charge(
      {
        customer: customerId,
        ...data,
      },
      type,
      apiKey,
    );
  }

  async createCustomerWithCharge(
    data: BillingDto,
    type: 'subscription' | 'payment',
    apiKey?: string,
  ): Promise<CustomerwithChargeResponse> {
    const customer = await this.createCustomer(
      {
        name: data.username,
        email: data.email,
        cpfCnpj: data.cpfCnpj,
        postalCode: data.postalCode,
        customerExternalReference: data.customerExternalReference,
      },
      apiKey,
    );
    const charge = await this.createCharge(
      customer.id,
      {
        billingType: data.billingType,
        value: data.value,
        cycle: Cycle.MONTHLY,
        dueDate: data.dueDate,
        nextDueDate: data.nextDueDate,
        chargeExternalReference: data.chargeExternalReference,
      },
      type,
      apiKey,
    );
    return {
      customerId: customer.id,
      charge,
    };
  }

  async payment(subscriptionId: string, apiKey?: string) {
    return await this.paymentGatewayService.findPaymentBySubscriptionId(
      subscriptionId,
      apiKey,
    );
  }
}
