export class ProductResponseDto {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  soldCount: number;
  image?: string;
  userId: string;
}
