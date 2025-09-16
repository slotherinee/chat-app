import { BadRequestException, Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/dto/user.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private UserService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string) {
    const user = await this.UserService.findOne(username);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      void password;
      return result;
    }
    return null;
  }

  async login(user: User) {
    const payload = { username: user.username, id: user.id };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async register(user: CreateUserDto) {
    const existingUser = await this.UserService.findOne(user.username);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);
    const newUser = await this.UserService.create({
      ...user,
      password: hashedPassword,
    });

    const payload = { username: newUser.username, id: newUser.id };
    return { access_token: this.jwtService.signAsync(payload) };
  }
}
