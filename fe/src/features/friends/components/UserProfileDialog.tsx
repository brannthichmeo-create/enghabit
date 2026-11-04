import { CalendarDays, Flame, Sparkles, Users, X } from 'lucide-react';
import { FeatureKey } from '@enghabit/shared';
import { Avatar } from '../../../shared/components/Sidebar';
import { Button, Card, ProgressBar, Skeleton } from '../../../shared/components/ui';
import { useT, useLocale } from '../../../shared/i18n/language';
import { useAcceptFriendRequest, useFriendProfile, useRemoveFriend, useRemoveFriendRequest, useSendFriendRequest } from '../friends.hooks';
import { useFeature } from '../../feature-flags/feature-flag.hooks';

export function UserProfileDialog({ publicId, onClose }: { publicId: string; onClose: () => void }) {
  const t = useT();
  const locale = useLocale();
  const profile = useFriendProfile(publicId);
  const send = useSendFriendRequest();
  const accept = useAcceptFriendRequest();
  const removeRequest = useRemoveFriendRequest();
  const removeFriend = useRemoveFriend();
  const friendsEnabled = useFeature(FeatureKey.FRIENDS);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <Card className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto">
        <button className="absolute right-4 top-4 text-content-muted" onClick={onClose} aria-label={t('Đóng')}><X className="h-5 w-5" /></button>
        {profile.isLoading && <Skeleton />}
        {profile.isError && <p className="py-8 text-center text-sm text-danger">{t('Không thể tải hồ sơ người dùng')}</p>}
        {profile.data && <>
          <div className="flex items-center gap-4 pr-8">
            <Avatar name={profile.data.name} src={profile.data.avatarDataUrl} frameUrl={profile.data.avatarFrameUrl} size="lg" />
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold text-content">{profile.data.name}</h2>
              {friendsEnabled && <p className="font-mono text-xs text-content-muted">ID: {profile.data.publicId}</p>}
              <p className="mt-1 flex items-center gap-1 text-xs text-content-muted"><CalendarDays className="h-3.5 w-3.5" />{t('Tham gia từ {date}', { date: new Date(profile.data.createdAt).toLocaleDateString(locale) })}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-sunken p-3"><Sparkles className="mx-auto h-4 w-4 text-brand" /><strong className="block text-content">{t('Cấp {n}', { n: profile.data.level })}</strong></div>
            <div className="rounded-lg bg-sunken p-3"><Flame className="mx-auto h-4 w-4 text-brand" /><strong className="block text-content">{profile.data.currentStreak}</strong><span className="text-xs text-content-muted">{t('ngày chuỗi')}</span></div>
            <div className="rounded-lg bg-sunken p-3"><Users className="mx-auto h-4 w-4 text-brand" /><strong className="block text-content">{profile.data.monthlyActivities}</strong><span className="text-xs text-content-muted">{t('hoạt động tháng')}</span></div>
          </div>
          <div className="mt-5"><ProgressBar percent={profile.data.progressPercent} label={t('Tiến độ lên cấp')} /></div>
          {friendsEnabled && <div className="mt-5 flex justify-end gap-2">
            {profile.data.relation === 'NONE' && <Button onClick={() => send.mutate(profile.data.publicId)} disabled={send.isPending}>{t('Thêm bạn bè')}</Button>}
            {profile.data.relation === 'OUTGOING_PENDING' && <Button variant="secondary" onClick={() => removeRequest.mutate(profile.data.friendshipId!)}>{t('Thu hồi lời mời')}</Button>}
            {profile.data.relation === 'INCOMING_PENDING' && <><Button variant="secondary" onClick={() => removeRequest.mutate(profile.data.friendshipId!)}>{t('Từ chối')}</Button><Button onClick={() => accept.mutate(profile.data.friendshipId!)}>{t('Chấp nhận')}</Button></>}
            {profile.data.relation === 'FRIENDS' && <Button variant="danger" onClick={() => removeFriend.mutate(profile.data.userId)}>{t('Hủy kết bạn')}</Button>}
          </div>}
        </>}
      </Card>
    </div>
  );
}
