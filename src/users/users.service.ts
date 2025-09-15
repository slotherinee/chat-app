import { Injectable } from '@nestjs/common';
import { User } from './users.types';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly users: User[] = [
    {
      userId: 1,
      username: 'john',
      password: bcrypt.hashSync('pass', 10),
    },
    {
      userId: 2,
      username: 'maria',
      password: bcrypt.hashSync('password', 10),
    },
  ];

  findOne(username: string): Promise<User | undefined> {
    return Promise.resolve(
      this.users.find((user) => user.username === username),
    );
  }
}
