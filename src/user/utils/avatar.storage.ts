import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';

export function avatarMulterOptions() {
  const uploadPath = join(process.cwd(), 'public', 'user_avatars');
  if (!existsSync(uploadPath)) mkdirSync(uploadPath, { recursive: true });

  return {
    storage: diskStorage({
      destination: uploadPath,
      filename(
        req: Request<{ id?: string }>,
        file: Express.Multer.File,
        cb: (err: Error | null, filename: string) => void,
      ) {
        const fileExt = extname(file.originalname).toLowerCase() || '';
        const userId =
          req && req.params && req.params.id ? String(req.params.id) : 'anon';
        const safeName = `${userId}-${Date.now()}${fileExt}`;
        cb(null, safeName);
      },
    }),
    fileFilter(
      _req: any,
      file: Express.Multer.File,
      cb: (err: Error | null, acceptFile: boolean) => void,
    ) {
      const allowed = /image\/(png|jpe?g|gif|webp)/;
      if (!allowed.test(file.mimetype)) {
        return cb(
          new BadRequestException('Only image files are allowed'),
          false,
        );
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  };
}
