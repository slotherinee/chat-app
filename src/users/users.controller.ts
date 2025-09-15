import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './dto/user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.usersService.create(userData);
  }
}
