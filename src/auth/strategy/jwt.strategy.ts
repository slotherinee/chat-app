import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { User } from 'generated/prisma';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { config } from 'src/config';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.JWT_SECRET,
    });
  }

  async validate(payload: User) {
    const user = await this.usersService.findById(payload.id);
    if (!user) {
      return null;
    }
    const { password, ...result } = user;
    void password;
    return result;
  }
}
