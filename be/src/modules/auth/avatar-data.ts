import type { UserAvatar } from '@prisma/client';

export function avatarToDataUrl(avatar: UserAvatar | null | undefined): string | null {
  if (!avatar) return null;
  return `data:${avatar.mimeType};base64,${Buffer.from(avatar.data).toString('base64')}`;
}
