import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './dto/user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.userService.create(userData);
  }
}
