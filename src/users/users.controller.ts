import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserWithoutPassword } from './users.types';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(): Promise<UserWithoutPassword[]> {
    return this.usersService.findAll();
  }

  @Post()
  async create(
    @Body() userData: Omit<User, 'userId'>,
  ): Promise<UserWithoutPassword> {
    return this.usersService.create(userData);
  }
}
