import { Injectable } from '@nestjs/common';
import { User, UserWithoutPassword } from './users.types';
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

  async create(data: Omit<User, 'userId'>): Promise<UserWithoutPassword> {
    const user: User = {
      userId: this.users.length + 1,
      password: await bcrypt.hash(data.password, 10),
      username: data.username,
    };
    this.users.push(user);
    const { password, ...userData } = user;
    void password;
    console.log('Created user:', userData);
    console.log('All users:', this.users);
    return userData;
  }

  async findAll(): Promise<UserWithoutPassword[]> {
    return this.users.map(({ password, ...user }) => user);
  }

  async findOne(username: string): Promise<User | undefined> {
    console.log('Finding user by username:', username);
    console.log('Current users:', this.users);
    console.log(
      'User found:',
      this.users.find((user) => user.username === username),
    );
    return this.users.find((user) => user.username === username);
  }
}
