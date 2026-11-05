import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, MessageCircle, MoreHorizontal, Search, Sparkles, UserMinus } from 'lucide-react';
import { Avatar } from '../../../shared/components/Sidebar';
import { Button, Card, EmptyState, ErrorMessage, Input, PageHeader, SkeletonList } from '../../../shared/components/ui';
import { useConfirm } from '../../../shared/components/ConfirmDialog';
import { useToast } from '../../../shared/components/Toast';
import { useLocale, useT } from '../../../shared/i18n/language';
import { timeAgo } from '../../notifications/components/notification-display';
import { useAcceptFriendRequest, useFriends, useRemoveFriend, useRemoveFriendRequest, useSearchFriend, useSendFriendRequest } from '../friends.hooks';
import { UserProfileDialog } from './UserProfileDialog';

const tabs = ['friends', 'find', 'incoming', 'outgoing'] as const;

export function FriendsPage() {
  const t = useT();
  const [params, setParams] = useSearchParams();
  const current = tabs.includes(params.get('tab') as typeof tabs[number]) ? params.get('tab') as typeof tabs[number] : 'friends';
  const [search, setSearch] = useState('');
  const [publicId, setPublicId] = useState('');
  const [profileId, setProfileId] = useState<string | null>(null);
  const data = useFriends();
  const searchFriend = useSearchFriend();
  const send = useSendFriendRequest();
  const accept = useAcceptFriendRequest();
  const removeRequest = useRemoveFriendRequest();
  const removeFriend = useRemoveFriend();
  const tabLabel: Record<typeof tabs[number], string> = { friends: 'Bạn hệ thống', find: 'Tìm bạn', incoming: 'Yêu cầu kết bạn', outgoing: 'Đã gửi' };

  return <div>
    <PageHeader title={t('Bạn bè')} description={t('Kết nối và theo dõi việc học cùng bạn bè')} />
    <div className="mb-4 flex flex-wrap gap-1 rounded-lg bg-sunken p-1" role="tablist">
      {tabs.map((tab) => <button key={tab} role="tab" aria-selected={current === tab} onClick={() => setParams({ tab })} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${current === tab ? 'bg-surface font-medium text-content shadow-sm' : 'text-content-soft'}`}>
        <span>{t(tabLabel[tab])}</span>
        {tab === 'incoming' && data.data && data.data.incoming.length > 0 && <span className="min-w-5 rounded-full bg-brand px-1.5 py-0.5 text-center text-xs font-semibold text-on-brand" aria-label={t('{n} lời mời đang chờ', { n: data.data.incoming.length })}>{data.data.incoming.length}</span>}
      </button>)}
    </div>
    {data.isLoading && <SkeletonList rows={4} />}
    {data.isError && <ErrorMessage>{t('Không thể tải danh sách bạn bè')}</ErrorMessage>}
    {current === 'friends' && <>
      <div className="mb-4 max-w-md"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('Tìm trong danh sách bạn bè')} /></div>
      <Card>{(data.data?.friends ?? []).filter((user) => user.name.toLowerCase().includes(search.toLowerCase())).map((user) => <FriendRow key={user.userId} user={user} onOpen={() => setProfileId(user.publicId)} onRemove={() => removeFriend.mutate(user.userId)} isFriend />)}
      {data.data && data.data.friends.length === 0 && <EmptyState icon={Sparkles} title={t('Chưa có bạn bè')} description={t('Mở tab Tìm bạn để gửi lời mời đầu tiên')} />}</Card>
    </>}
    {current === 'find' && <Card>
      <div className="flex gap-2"><Input value={publicId} onChange={(event) => setPublicId(event.target.value.toUpperCase())} placeholder={t('Nhập mã bạn bè 8 ký tự')} /><Button onClick={() => searchFriend.mutate(publicId)}><Search className="mr-2 h-4 w-4" />{t('Tìm')}</Button></div>
      {searchFriend.data && <div className="mt-4"><FriendRow user={searchFriend.data} onOpen={() => setProfileId(searchFriend.data!.publicId)} action={<Button onClick={() => send.mutate(searchFriend.data!.publicId)}>{t('Thêm bạn bè')}</Button>} /></div>}
      {searchFriend.isError && <p className="mt-3 text-sm text-danger">{t('Không tìm thấy người dùng với mã này')}</p>}
    </Card>}
    {current === 'incoming' && <Card>{data.data?.incoming.map((request) => <FriendRow key={request.id} user={request.user} onOpen={() => setProfileId(request.user.publicId)} action={<><Button variant="secondary" onClick={() => removeRequest.mutate(request.id)}>{t('Từ chối')}</Button><Button onClick={() => accept.mutate(request.id)}>{t('Chấp nhận')}</Button></>} />)}
      {data.data && data.data.incoming.length === 0 && <EmptyState icon={Sparkles} title={t('Không có lời mời')} description={t('Lời mời kết bạn mới sẽ hiện ở đây')} />}</Card>}
    {current === 'outgoing' && <Card>{data.data?.outgoing.map((request) => <FriendRow key={request.id} user={request.user} onOpen={() => setProfileId(request.user.publicId)} action={<Button variant="secondary" onClick={() => removeRequest.mutate(request.id)}>{t('Thu hồi')}</Button>} />)}
      {data.data && data.data.outgoing.length === 0 && <EmptyState icon={Sparkles} title={t('Chưa gửi lời mời')} description={t('Tìm bạn bằng mã công khai để bắt đầu')} />}</Card>}
    {profileId && <UserProfileDialog publicId={profileId} onClose={() => setProfileId(null)} />}
  </div>;
}

function FriendRow({ user, action, onOpen, onRemove, isFriend = false }: { user: { name: string; publicId: string; level: number; currentStreak: number; avatarDataUrl: string | null; avatarFrameUrl: string | null; lastActiveAt?: string | null }; action?: ReactNode; onOpen: () => void; onRemove?: () => void; isFriend?: boolean }) {
  const t = useT();
  const locale = useLocale();
  const confirm = useConfirm();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const activeAt = user.lastActiveAt ? new Date(user.lastActiveAt) : null;

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);
  const activeStatus = !activeAt
    ? t('Chưa có hoạt động gần đây')
    : Date.now() - activeAt.getTime() < 5 * 60 * 1000
      ? t('Đang hoạt động')
      : t('Hoạt động {ago}', { ago: timeAgo(activeAt.toISOString(), t, locale) });
  const remove = async () => {
    if (!onRemove) return;
    setMenuOpen(false);
    const accepted = await confirm({ title: t('Hủy kết bạn với {name}?', { name: user.name }), message: t('Hai bạn sẽ không còn xuất hiện trong danh sách bạn bè.'), confirmLabel: t('Hủy kết bạn'), tone: 'danger' });
    if (accepted) onRemove();
  };

  return <div className="flex items-center gap-3 border-b border-line py-3 last:border-0">
    <button onClick={onOpen} className="shrink-0" aria-label={t('Xem trang cá nhân')}><Avatar name={user.name} src={user.avatarDataUrl} frameUrl={user.avatarFrameUrl} /></button>
    <button onClick={onOpen} className="min-w-0 flex-1 text-left">
      <strong className="block truncate text-content">{user.name}</strong>
      <span className="block text-xs text-content-muted">{t('Cấp {n} · Chuỗi {streak} ngày', { n: user.level, streak: user.currentStreak })}</span>
      {isFriend && <span className={`mt-0.5 block text-xs ${activeAt && Date.now() - activeAt.getTime() < 5 * 60 * 1000 ? 'text-success' : 'text-content-soft'}`}>{activeStatus}</span>}
    </button>
    <div className="flex shrink-0 items-center gap-2">
      {isFriend && <>
        <Button variant="secondary" size="sm" aria-label={t('Nhắn tin với {name}', { name: user.name })} title={t('Nhắn tin')} onClick={() => toast.error(t('Tính năng nhắn tin chưa khả dụng'))}><MessageCircle className="h-4 w-4" /></Button>
        <Button variant="secondary" size="sm" onClick={onOpen}><Eye className="h-4 w-4" /><span className="hidden sm:inline">{t('Xem hồ sơ')}</span></Button>
        <div ref={menuRef} className="relative">
          <button type="button" onClick={() => setMenuOpen((open) => !open)} className="inline-flex items-center justify-center rounded-md border border-line bg-surface p-2 text-content-muted hover:bg-sunken" aria-label={t('Thêm thao tác')} aria-haspopup="menu" aria-expanded={menuOpen}>
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && <div role="menu" className="absolute right-0 z-50 mt-1 min-w-36 rounded-md border border-line bg-surface p-1 shadow-lg">
            <button type="button" role="menuitem" onClick={remove} className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-danger hover:bg-sunken"><UserMinus className="h-4 w-4" />{t('Hủy kết bạn')}</button>
          </div>}
        </div>
      </>}
      {!isFriend && action}
    </div>
  </div>;
}
