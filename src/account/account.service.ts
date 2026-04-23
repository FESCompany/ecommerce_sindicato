import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from 'src/users/user.service';
import { UpdateUserDto } from './dtos/update-user.dto';
import { SlugService } from 'src/slug/slug.service';
import { Prisma } from '@prisma/client';

type UserResponse = {
  username: string;
  email: string;
  isSelling: boolean;
  storeName: string | null;
  storeSlug: string | null;
  postalCode: string;
  cpfCnpj: string;
};
type UpdateResponse = { username: string; email: string };

@Injectable()
export class AccountService {
  constructor(
    private usersService: UsersService,
    private slugService: SlugService,
  ) {}
  async user(id: string): Promise<UserResponse> {
    const foundUser = await this.usersService.user({ id });
    if (!foundUser) throw new NotFoundException('User not found');
    return {
      username: foundUser.username,
      email: foundUser.email,
      isSelling: foundUser.isSelling,
      storeName: foundUser.storeName,
      storeSlug: foundUser.storeSlug,
      postalCode: foundUser.postalCode,
      cpfCnpj: foundUser.cpfCnpj,
    };
  }
  async update(id: string, data: UpdateUserDto): Promise<UpdateResponse> {
    try {
      const foundUser = await this.usersService.user({ id });
      if (!foundUser) throw new NotFoundException('User not found');

      let storeSlug: string | undefined;

      if (data.storeName)
        storeSlug = await this.slugService.generateUniqueSlug(data.storeName);

      const updatedUser = await this.usersService.updateUser({
        where: { id },
        data: {
          ...data,
          storeSlug,
        },
      });

      return {
        username: updatedUser.username,
        email: updatedUser.email,
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
  async delete(id: string) {
    const foundUser = await this.usersService.user({ id });
    if (!foundUser) throw new NotFoundException('User not found');
    await this.usersService.deleteUser({ id });
    return { success: true };
  }
  async payment(id: string) {
    const foundUser = await this.usersService.user({ id });
    if (!foundUser) throw new NotFoundException('User not found');
    return { active: foundUser.active };
  }
}
