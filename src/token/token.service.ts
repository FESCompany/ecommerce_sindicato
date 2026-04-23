import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';

type Payload = {
  sub: string;
  email: string;
  username: string;
};

@Injectable()
export class TokenService {
  constructor(private jwtService: JwtService) {}
  async generateToken(payload: Payload, options?: JwtSignOptions) {
    return this.jwtService.signAsync(payload, options);
  }
  async verify(token: string): Promise<{ sub: string }> {
    return await this.jwtService.verifyAsync(token);
  }
}
