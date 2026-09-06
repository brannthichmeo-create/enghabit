import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Ban,
  Check,
  Crown,
  Globe,
  Hash,
  Lock,
  LogOut,
  MessageSquare,
  Plus,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  GroupMemberRole,
  GroupViewerState,
  GroupVisibility,
  type GroupDetail,
  type GroupMemberRow,
} from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorMessage,
  Field,
  Input,
  PageHeader,
  SectionTitle,
  SkeletonList,
} from '../../../shared/components/ui';
import { useToast } from '../../../shared/components/Toast';
import { useConfirm } from '../../../shared/components/ConfirmDialog';
import { useT } from '../../../shared/i18n/language';
import { usePosts } from '../../community/community.hooks';
import { PostCard } from '../../community/components/CommunityPage';
import { PostComposer } from '../../community/components/PostComposer';
import { PostDetailView } from '../../community/components/PostDetailView';
import {
  useAddMember,
  useDecideRequest,
  useDeleteGroup,
  useGroup,
  useLeaveGroup,
  useRemoveMember,
  useUpdateGroup,
  useUpdateMemberRole,
} from '../group.hooks';

type Tab = 'feed' | 'members' | 'requests' | 'settings';

/**
 * Một nhóm cụ thể: bảng tin, thành viên, yêu cầu chờ duyệt và cài đặt.
 *
 * Bảng tin dùng lại nguyên bộ bài đăng của module community (soạn bài, tệp đính kèm,
 * bình luận, thả tim) — chỉ khác một tham số `groupId`. Dựng bộ thứ hai cho nhóm là
 * hai chỗ phải sửa mỗi khi đổi luật đăng bài.
 */
export function GroupDetailPage(): JSX.Element {
  const t = useT();
  const navigate = useNavigate();
  const params = useParams();
  const groupId = Number(params.id);

  const [tab, setTab] = useState<Tab>('feed');
  const group = useGroup(Number.isInteger(groupId) && groupId > 0 ? groupId : null);

  if (group.isLoading) return <SkeletonList rows={4} />;

  // Không phải thành viên thì BE trả 403/404 — nói thẳng thay vì hiện khung rỗng khó hiểu.
  if (group.isError || !group.data) {
    return (
      <div>
        <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/groups')}>
          {t('Về danh sách nhóm')}
        </Button>
        <div className="mt-4">
          <EmptyState
            icon={Lock}
            title={t('Bạn không xem được nhóm này')}
            description={t('Nhóm không tồn tại, hoặc bạn chưa phải thành viên.')}
          />
        </div>
      </div>
    );
  }

  const data = group.data;
  const isLeader = data.viewerState === GroupViewerState.LEADER;

  // Nhóm bị chặn thì thành viên vẫn mở được trang này, nhưng chỉ để ĐỌC LÝ DO — bảng
  // tin, danh sách thành viên và cài đặt đều đóng lại. Không cho vào hẳn thì họ không
  // biết vì sao nhóm im lặng.
  if (data.block) {
    return (
      <div>
        <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/groups')} className="mb-2">
          {t('Nhóm lớp')}
        </Button>
        <PageHeader title={data.name} description={data.description ?? undefined} />
        <Card className="border-danger/40">
          <p className="flex items-center gap-2 font-semibold text-danger">
            <Ban className="h-5 w-5" aria-hidden />
            {t('Nhóm này đang bị chặn')}
          </p>
          <p className="mt-2 text-sm text-content-soft">{data.block.reason}</p>
          <p className="mt-3 border-t border-line pt-3 text-xs text-content-muted">
            {t('Bị chặn lúc {time} bởi quản trị viên. Liên hệ quản trị viên nếu bạn cho rằng có nhầm lẫn.', {
              time: new Date(data.block.blockedAt).toLocaleString('vi-VN'),
            })}
          </p>
        </Card>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: 'feed', label: t('Bảng tin') },
    { key: 'members', label: t('Thành viên'), badge: data.memberCount },
    ...(isLeader
      ? ([
          { key: 'requests' as const, label: t('Yêu cầu'), badge: data.pendingCount },
          { key: 'settings' as const, label: t('Cài đặt') },
        ])
      : []),
  ];

  return (
    <div>
      <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/groups')} className="mb-2">
        {t('Nhóm lớp')}
      </Button>

      <PageHeader
        title={data.name}
        description={data.description ?? undefined}
        action={<LeaveButton group={data} />}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        {data.visibility === GroupVisibility.PRIVATE ? (
          <Badge icon={Lock}>{t('Riêng tư')}</Badge>
        ) : (
          <Badge icon={Globe} tone="green">
            {t('Công khai')}
          </Badge>
        )}
        <Badge icon={Hash}>
          {t('Mã nhóm')}: <span className="ml-1 tabular-nums">{data.code}</span>
        </Badge>
        {isLeader && <Badge tone="brand">{t('Bạn là trưởng nhóm')}</Badge>}
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg bg-sunken p-1">
        {tabs.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`whitespace-nowrap rounded-md px-4 py-1.5 text-sm transition ${
              tab === item.key ? 'bg-surface font-medium text-content shadow-sm' : 'text-content-soft'
            }`}
          >
            {item.label}
            {item.badge !== undefined && item.badge > 0 && (
              <span className="ml-1.5 tabular-nums text-content-muted">{item.badge}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'feed' && <GroupFeed groupId={data.id} />}
      {tab === 'members' && <MemberList group={data} />}
      {tab === 'requests' && isLeader && <RequestList group={data} />}
      {tab === 'settings' && isLeader && <GroupSettings group={data} />}
    </div>
  );
}

/** Bảng tin nội bộ của nhóm. */
function GroupFeed({ groupId }: { groupId: number }): JSX.Element {
  const t = useT();
  const [composing, setComposing] = useState(false);
  const [openPostId, setOpenPostId] = useState<number | null>(null);

  const posts = usePosts({ groupId, page: 1, pageSize: 20, sort: 'latest', mine: false });

  if (openPostId !== null) {
    return <PostDetailView postId={openPostId} onBack={() => setOpenPostId(null)} />;
  }

  return (
    <div>
      <div className="mb-4">
        {composing ? (
          <PostComposer groupId={groupId} onDone={() => setComposing(false)} />
        ) : (
          <Button icon={Plus} onClick={() => setComposing(true)}>
            {t('Đăng bài trong nhóm')}
          </Button>
        )}
      </div>

      {posts.isLoading && <SkeletonList rows={3} />}
      {posts.isError && <ErrorMessage>{getErrorMessage(posts.error)}</ErrorMessage>}

      {posts.data?.items.length === 0 && (
        <EmptyState
          icon={MessageSquare}
          title={t('Nhóm chưa có bài nào')}
          description={t('Đăng bài đầu tiên để bắt đầu trao đổi với cả nhóm.')}
        />
      )}

      <div className="space-y-3">
        {posts.data?.items.map((post) => (
          <PostCard key={post.id} post={post} onOpen={() => setOpenPostId(post.id)} />
        ))}
      </div>
    </div>
  );
}

/** Danh sách thành viên. Trưởng nhóm thấy thêm nút phong quyền và xoá khỏi nhóm. */
function MemberList({ group }: { group: GroupDetail }): JSX.Element {
  const t = useT();
  const confirm = useConfirm();
  const toast = useToast();
  const isLeader = group.viewerState === GroupViewerState.LEADER;

  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const addMember = useAddMember();

  const [identifier, setIdentifier] = useState('');

  const submitAdd = (event: FormEvent): void => {
    event.preventDefault();
    addMember.mutate(
      { groupId: group.id, input: { identifier: identifier.trim() } },
      {
        onSuccess: (member) => {
          toast.success(t('Đã thêm {name} vào nhóm', { name: member.name }));
          setIdentifier('');
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );
  };

  return (
    <div>
      {isLeader && (
        <Card className="mb-4">
          <form onSubmit={submitAdd} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[240px] flex-1">
              <Field
                label={t('Thêm thành viên')}
                hint={t('Nhập tên tài khoản hoặc email của người đã có tài khoản')}
              >
                <Input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="long.tran"
                />
              </Field>
            </div>
            <Button
              type="submit"
              icon={UserPlus}
              disabled={identifier.trim().length === 0}
              loading={addMember.isPending}
              className="mb-0.5"
            >
              {t('Thêm')}
            </Button>
          </form>
        </Card>
      )}

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-content-muted">
              <th className="pb-2 font-medium">{t('Thành viên')}</th>
              <th className="pb-2 font-medium">{t('Vai trò')}</th>
              <th className="pb-2 pr-6 text-right font-medium">{t('Hoạt động')}</th>
              <th className="pb-2 font-medium">{t('Chuỗi')}</th>
              {isLeader && <th className="pb-2" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {group.members.map((member) => (
              <tr key={member.userId}>
                <td className="py-2.5">
                  <span className="block font-medium text-content">{member.name}</span>
                  <span className="block text-xs text-content-muted">@{member.username}</span>
                </td>
                <td className="py-2.5">
                  {member.role === GroupMemberRole.LEADER ? (
                    <Badge tone="brand" icon={Crown}>
                      {t('Trưởng nhóm')}
                    </Badge>
                  ) : (
                    <Badge>{t('Thành viên')}</Badge>
                  )}
                </td>
                <td className="py-2.5 pr-6 text-right tabular-nums text-content-soft">
                  {member.activityCount.toLocaleString('vi-VN')}
                </td>
                <td className="py-2.5 tabular-nums text-content-soft">
                  {t('{n} ngày', { n: member.currentStreak })}
                </td>
                {isLeader && (
                  <td className="py-2.5 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Crown}
                        loading={updateRole.isPending && updateRole.variables?.userId === member.userId}
                        onClick={() =>
                          updateRole.mutate(
                            {
                              groupId: group.id,
                              userId: member.userId,
                              role:
                                member.role === GroupMemberRole.LEADER
                                  ? GroupMemberRole.MEMBER
                                  : GroupMemberRole.LEADER,
                            },
                            { onError: (err) => toast.error(getErrorMessage(err)) },
                          )
                        }
                      >
                        {member.role === GroupMemberRole.LEADER ? t('Hạ quyền') : t('Phong trưởng nhóm')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={UserMinus}
                        aria-label={t('Xoá khỏi nhóm')}
                        loading={removeMember.isPending && removeMember.variables?.userId === member.userId}
                        onClick={async () => {
                          const ok = await confirm({
                            title: t('Xoá {name} khỏi nhóm?', { name: member.name }),
                            message: t('Người này sẽ mất quyền đọc bài trong nhóm, nhưng vẫn xin vào lại được.'),
                            confirmLabel: t('Xoá khỏi nhóm'),
                            tone: 'danger',
                          });
                          if (!ok) return;
                          removeMember.mutate(
                            { groupId: group.id, userId: member.userId },
                            { onError: (err) => toast.error(getErrorMessage(err)) },
                          );
                        }}
                      />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/** Hộp yêu cầu xin vào nhóm — chỉ trưởng nhóm thấy. */
function RequestList({ group }: { group: GroupDetail }): JSX.Element {
  const t = useT();
  const toast = useToast();
  const decide = useDecideRequest();

  if (group.pendingRequests.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={t('Không có yêu cầu nào đang chờ')}
        description={t('Khi có người xin vào nhóm, yêu cầu sẽ hiện ở đây và bạn nhận được thông báo.')}
      />
    );
  }

  const act = (userId: number, approve: boolean): void => {
    decide.mutate(
      { groupId: group.id, userId, approve },
      {
        onSuccess: () => toast.success(approve ? t('Đã duyệt') : t('Đã từ chối')),
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );
  };

  return (
    <div className="space-y-2">
      {group.pendingRequests.map((request) => (
        <Card key={request.userId}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="block font-medium text-content">{request.name}</span>
              <span className="block text-xs text-content-muted">@{request.username}</span>
              {request.message && (
                <p className="mt-1 text-sm text-content-soft">“{request.message}”</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" icon={Check} onClick={() => act(request.userId, true)}>
                {t('Duyệt')}
              </Button>
              <Button size="sm" variant="secondary" icon={X} onClick={() => act(request.userId, false)}>
                {t('Từ chối')}
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/** Cài đặt nhóm — chỉ trưởng nhóm vào được. */
function GroupSettings({ group }: { group: GroupDetail }): JSX.Element {
  const t = useT();
  const confirm = useConfirm();
  const toast = useToast();
  const navigate = useNavigate();

  const update = useUpdateGroup();
  const removeGroup = useDeleteGroup();

  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? '');
  const [isPublic, setIsPublic] = useState(group.visibility === GroupVisibility.PUBLIC);
  const [requireApproval, setRequireApproval] = useState(group.requireApproval);

  const save = (): void => {
    update.mutate(
      {
        id: group.id,
        input: {
          name: name.trim(),
          description: description.trim(),
          visibility: isPublic ? GroupVisibility.PUBLIC : GroupVisibility.PRIVATE,
          requireApproval,
        },
      },
      {
        onSuccess: () => toast.success(t('Đã lưu thông tin nhóm')),
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );
  };

  return (
    <div>
      <Card>
        <Field label={t('Tên nhóm')}>
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
        </Field>

        <label className="mt-4 block">
          <span className="text-sm font-medium text-content-soft">{t('Mô tả nhóm')}</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            maxLength={500}
            className="mt-1.5 w-full rounded-lg border border-line-control bg-surface px-3 py-2 text-sm text-content outline-none transition-colors placeholder:text-content-muted focus:border-brand focus:ring-4 focus:ring-brand/10"
          />
        </label>

        <div className="mt-5 space-y-3 border-t border-line pt-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[rgb(var(--brand))]"
            />
            <span>
              <span className="block text-sm font-medium text-content">{t('Nhóm công khai')}</span>
              <span className="block text-xs text-content-muted">
                {t('Tắt thì nhóm biến mất khỏi ô tìm kiếm, chỉ vào được bằng mã {code}', {
                  code: group.code,
                })}
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={requireApproval}
              onChange={(e) => setRequireApproval(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[rgb(var(--brand))]"
            />
            <span>
              <span className="block text-sm font-medium text-content">{t('Phê duyệt thành viên')}</span>
              <span className="block text-xs text-content-muted">
                {t('Tắt thì người tìm được nhóm sẽ vào thẳng, không cần bạn duyệt.')}
              </span>
            </span>
          </label>
        </div>

        <div className="mt-5 border-t border-line pt-4">
          <Button onClick={save} loading={update.isPending}>
            {t('Lưu thay đổi')}
          </Button>
        </div>
      </Card>

      <div className="mt-6">
        <SectionTitle>{t('Vùng nguy hiểm')}</SectionTitle>
        <Card>
          <p className="mb-3 text-sm text-content-soft">
            {t('Xoá nhóm sẽ mất toàn bộ bài đăng và danh sách thành viên. Không khôi phục được.')}
          </p>
          <Button
            variant="danger"
            icon={Trash2}
            loading={removeGroup.isPending}
            onClick={async () => {
              const ok = await confirm({
                title: t('Xoá vĩnh viễn nhóm "{name}"?', { name: group.name }),
                message: t('Toàn bộ bài đăng và danh sách thành viên sẽ mất. Không khôi phục được.'),
                confirmLabel: t('Xoá nhóm'),
                tone: 'danger',
              });
              if (!ok) return;
              removeGroup.mutate(group.id, {
                onSuccess: () => {
                  toast.success(t('Đã xoá nhóm'));
                  navigate('/groups');
                },
                onError: (err) => toast.error(getErrorMessage(err)),
              });
            }}
          >
            {t('Xoá nhóm')}
          </Button>
        </Card>
      </div>
    </div>
  );
}

function LeaveButton({ group }: { group: GroupDetail }): JSX.Element {
  const t = useT();
  const confirm = useConfirm();
  const toast = useToast();
  const navigate = useNavigate();
  const leave = useLeaveGroup();

  return (
    <Button
      variant="secondary"
      icon={LogOut}
      loading={leave.isPending}
      onClick={async () => {
        const ok = await confirm({
          title: t('Rời khỏi nhóm "{name}"?', { name: group.name }),
          message: t('Bạn sẽ không đọc được bài trong nhóm nữa cho tới khi vào lại.'),
          confirmLabel: t('Rời nhóm'),
          tone: 'danger',
        });
        if (!ok) return;
        leave.mutate(group.id, {
          onSuccess: () => {
            toast.success(t('Đã rời nhóm'));
            navigate('/groups');
          },
          // Trưởng nhóm cuối cùng bị chặn rời nhóm — hiện đúng lời giải thích của BE
          onError: (err) => toast.error(getErrorMessage(err)),
        });
      }}
    >
      {t('Rời nhóm')}
    </Button>
  );
}

/** Dùng cho danh sách thành viên ở nơi khác nếu cần. */
export type { GroupMemberRow };
