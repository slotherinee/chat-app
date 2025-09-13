import { Injectable } from '@nestjs/common';
import { User } from './users.types';

@Injectable()
export class UsersService {
  private readonly users = [
    {
      userId: 1,
      username: 'john',
      password: 'changeme',
    },
    {
      userId: 2,
      username: 'maria',
      password: 'guess',
    },
  ];

  findOne(username: string): Promise<User | undefined> {
    return Promise.resolve(
      this.users.find((user) => user.username === username),
    );
  }
}
