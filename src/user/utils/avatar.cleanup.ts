import { join } from 'path';
import { unlink } from 'fs/promises';

export async function removeLocalAvatar(avatarUrl: string): Promise<boolean> {
  if (!avatarUrl || typeof avatarUrl !== 'string') return false;
  const publicPrefix = '/user_avatars/';
  const idx = avatarUrl.indexOf(publicPrefix);
  if (idx === -1) return false;

  const filename = avatarUrl.substring(idx + publicPrefix.length);
  const fullPath = join(process.cwd(), 'public', 'user_avatars', filename);
  await unlink(fullPath).catch(() => {});
  return true;
}
