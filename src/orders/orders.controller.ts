import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { CreateOrderDto } from './dtos/create-order.dto';
import { ProductsService } from 'src/products/product.service';

@Controller('orders')
export class OrdersController {
  constructor(
    private ordersService: OrdersService,
    private productsService: ProductsService,
  ) {}
  @Get('')
  @UseGuards(AuthGuard)
  async orders(@Request() req: Request) {
    const user = req['user'] as { sub: string };
    return await this.ordersService.orders({ userId: user.sub });
  }
  @Get(':id')
  @UseGuards(AuthGuard)
  async order(@Request() req: Request, @Param('id') id: string) {
    const user = req['user'] as { sub: string };
    return await this.ordersService.order(user.sub, id);
  }
  @Post('')
  @UseGuards(AuthGuard)
  async create(
    @Body(new ValidationPipe()) createOrderDto: CreateOrderDto,
    @Request() req: Request,
  ) {
    const user = req['user'] as { sub: string };
    const product = await this.productsService.product(
      createOrderDto.slug,
      createOrderDto.productId,
    );
    if (!product) return null;
    return await this.ordersService.createPaymentProviderOrder({
      ...createOrderDto,
      userId: user.sub,
      price: product.price,
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
    });
  }
  @Delete(':id')
  @UseGuards(AuthGuard)
  async delete(@Request() req: Request, @Param('id') id: string) {
    const user = req['user'] as { sub: string };
    return await this.ordersService.delete(user.sub, id);
  }
}
