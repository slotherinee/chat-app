import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';

@Module({
  providers: [AuthService],
  imports: [UsersService],
  exports: [AuthService],
})
export class AuthModule {}
