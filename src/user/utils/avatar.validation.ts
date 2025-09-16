import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';

const validateAvatar = (
  file: Express.Multer.File | null,
  req: Request,
  id: string,
): string | null => {
  if (!file) {
    throw new BadRequestException('No file uploaded or invalid file type');
  }
  const host = req.get('host');
  const protocol = req.protocol;
  const filename = file.filename.startsWith(`${id}-`)
    ? file.filename
    : `${id}-${file.filename}`;
  const publicPath = `/user_avatars/${filename}`;
  const avatarUrl = `${protocol}://${host}${publicPath}`;
  return avatarUrl;
};

export default validateAvatar;
