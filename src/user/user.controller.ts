import {
  Body,
  Controller,
  Param,
  Post,
  Put,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './dto/user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { avatarMulterOptions } from './utils/avatar.storage';
import type { Request } from 'express';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.userService.create(userData);
  }

  @Put('/:id')
  async update(
    @Param('id') id: string,
    @Body() userData: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>,
  ) {
    return this.userService.update(id, userData);
  }

  @Post('/:id/avatar')
  @UseInterceptors(FileInterceptor('avatar', avatarMulterOptions()))
  async uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const updated = await this.userService.updateAvatar(id, file, req);
    return { avatarUrl: updated.avatarUrl };
  }
}
