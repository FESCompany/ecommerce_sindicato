import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './user.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { SellerGuard } from 'src/auth/seller.guard';
import { SubscriptionGuard } from 'src/subscription/subscription.guard';

@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, SellerGuard, SubscriptionGuard)
  @Get('clients')
  async clients(@Request() req: Request) {
    const user = req['user'] as {
      sub: string;
    };
    return await this.userService.clients(user.sub);
  }
}
