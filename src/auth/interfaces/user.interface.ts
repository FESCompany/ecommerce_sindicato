export interface User {
  username: string;
  storeName?: string;
  email: string;
  cpfCnpj: string;
  isSelling: boolean;
  postalCode: string;
  password: string;
  billingType: 'PIX' | 'CREDIT_CARD';
}
