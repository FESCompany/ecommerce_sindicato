import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ProductsService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ValidationPipe } from 'src/validation.pipe';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { SellerGuard } from 'src/auth/seller.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { PaymentProviderGuard } from 'src/payment-provider/payment-provider.guard';
import { SubscriptionGuard } from 'src/subscription/subscription.guard';

@Controller('products')
export class ProductController {
  constructor(private productsService: ProductsService) {}

  @HttpCode(HttpStatus.OK)
  @Get(':slug')
  async products(@Param('slug') slug: string) {
    return await this.productsService.products({ slug: slug });
  }

  @HttpCode(HttpStatus.OK)
  @Get(':slug/:id')
  async getProduct(@Param('slug') slug: string, @Param('id') id: string) {
    const product = await this.productsService.product(slug, id);
    const { url } = await this.productsService.getProductImageUrl(id);
    return { ...product, image: url };
  }

  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard, SellerGuard, SubscriptionGuard, PaymentProviderGuard)
  @Post()
  async createProduct(
    @Body(new ValidationPipe()) createProductDto: CreateProductDto,
    @Request() req: Request,
  ) {
    const user = req['user'] as { sub: string };
    return await this.productsService.createProduct(createProductDto, user.sub);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, SellerGuard, SubscriptionGuard, PaymentProviderGuard)
  @Put(':id')
  async updateProduct(
    @Param('id') id: string,
    @Body(new ValidationPipe()) updateProductDto: UpdateProductDto,
    @Request() req: Request,
  ) {
    const user = req['user'] as {
      sub: string;
    };
    return await this.productsService.updateProduct({
      where: { id, userId: user.sub },
      data: updateProductDto,
    });
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, SellerGuard, SubscriptionGuard, PaymentProviderGuard)
  @Put('upload/:id')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') id: string,
    @Request()
    req: Request,
  ) {
    const user = req['user'] as { sub: string };
    return await this.productsService.upload(file, user.sub, id);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, SellerGuard, SubscriptionGuard, PaymentProviderGuard)
  @Delete(':id')
  async deleteProduct(@Param('id') id: string, @Request() req: Request) {
    const user = req['user'] as { sub: string };
    return await this.productsService.deleteProduct({ id, userId: user.sub });
  }
}
