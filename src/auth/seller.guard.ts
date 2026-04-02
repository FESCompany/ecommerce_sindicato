import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from 'src/users/user.service';

@Injectable()
export class SellerGuard implements CanActivate {
  constructor(private userService: UsersService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request['user'] as { sub: string };
    if (!user?.sub) {
      throw new UnauthorizedException();
    }
    const foundUser = await this.userService.user({ id: user.sub });
    if (!foundUser) {
      throw new UnauthorizedException('User not found');
    }
    if (!foundUser.isSelling) {
      throw new UnauthorizedException('User is not a seller');
    }
    return true;
  }
}
