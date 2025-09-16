import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { removeLocalAvatar } from './utils/avatar.cleanup';
import validateAvatar from './utils/avatar.validation';
import type { Request } from 'express';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserDto) {
    return this.prisma.user.create({
      data,
    });
  }

  async update(id: string, data: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async findOne(username: string, passwordExcluded = true) {
    return this.prisma.user.findUnique({
      where: { username },
      omit: passwordExcluded ? { password: true } : {},
    });
  }

  async findById(id: string, passwordExcluded = true) {
    return this.prisma.user.findUnique({
      where: { id },
      omit: passwordExcluded ? { password: true } : {},
    });
  }

  async updateAvatar(
    id: string,
    file: Express.Multer.File | null,
    req: Request,
  ) {
    const avatarUrl = validateAvatar(file, req, id);

    try {
      const existing = await this.findById(id);
      if (
        existing &&
        existing.avatarUrl &&
        typeof existing.avatarUrl === 'string'
      ) {
        await removeLocalAvatar(existing.avatarUrl);
      }
    } catch {
      // ignore
    }

    return this.prisma.user.update({ where: { id }, data: { avatarUrl } });
  }
}
