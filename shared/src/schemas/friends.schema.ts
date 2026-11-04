import { z } from 'zod';

export const FRIENDSHIP_PUBLIC_ID_LENGTH = 8;
export const friendshipStatusSchema = z.enum(['PENDING', 'ACCEPTED']);
export const friendshipRelationSchema = z.enum(['NONE', 'INCOMING_PENDING', 'OUTGOING_PENDING', 'FRIENDS']);

export const publicIdSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .refine((value) => /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/.test(value), 'Mã bạn bè gồm 8 ký tự hợp lệ');

export const friendSearchSchema = z.object({ publicId: publicIdSchema });
export type FriendSearchInput = z.infer<typeof friendSearchSchema>;
export type FriendshipStatus = z.infer<typeof friendshipStatusSchema>;
export type FriendshipRelation = z.infer<typeof friendshipRelationSchema>;

export interface FriendUser {
  userId: number;
  publicId: string;
  name: string;
  level: number;
  currentStreak: number;
  avatarDataUrl: string | null;
  avatarFrameUrl: string | null;
}

export interface FriendRequest {
  id: number;
  user: FriendUser;
  createdAt: string;
}

export interface FriendProfile extends FriendUser {
  createdAt: string;
  longestStreak: number;
  xp: number;
  xpToNextLevel: number;
  progressPercent: number;
  monthlyActivities: number;
  relation: FriendshipRelation;
  friendshipId: number | null;
}

export interface FriendsPageData {
  friends: FriendUser[];
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}
