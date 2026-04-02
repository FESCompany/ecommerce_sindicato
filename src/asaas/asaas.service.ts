import { Injectable } from '@nestjs/common';
import { CreateClientDto } from './dtos/create-client.dto';
import { CreateChargeDto } from './dtos/create-charge.dto';

@Injectable()
export class AsaasService {
  constructor() {}
  async client(clientRegisterDto: CreateClientDto, apiKey?: string) {
    const url = `${process.env['ASAAS_API']}/customers`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        access_token: apiKey ? apiKey : process.env['ASAAS_API_KEY']!,
      },
      body: JSON.stringify(clientRegisterDto),
    });
    const data = (await response.json()) as {
      id: string;
      name: string;
      email: string;
      postalCode: string;
    };
    return data;
  }
  async charge(
    createChargeDto: CreateChargeDto,
    type: 'subscription' | 'payment',
    apiKey?: string,
  ) {
    // define the action based on the type of charge
    const action = type === 'subscription' ? 'subscriptions' : 'payments';
    // if there is no apiKey, use the default one from the environment variable
    const url = `${process.env['ASAAS_API']}/${action}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        access_token: apiKey ? apiKey : process.env['ASAAS_API_KEY']!,
      },
      body: JSON.stringify({
        ...createChargeDto,
        dueDate: new Date().toISOString().split('T')[0],
      }),
    });

    const text = await response.text();

    // empty response
    if (!text) {
      throw new Error('Empty response from Asaas');
    }

    // HTTP error
    if (!response.ok) {
      throw new Error(`Asaas error: ${text}`);
    }

    const data = JSON.parse(text) as {
      id: string;
      invoiceUrl: string;
      status: 'PENDIND' | 'PAID' | 'EXPIRED';
    };
    return data;
  }
}
