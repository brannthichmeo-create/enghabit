import { useState, type FormEvent } from 'react';
import { Hash, Lock, Globe, Plus, Search, UserPlus, Users, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  GROUP_CODE_LENGTH,
  GroupViewerState,
  GroupVisibility,
  createGroupSchema,
  type GroupSummary,
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
import { useT } from '../../../shared/i18n/language';
import { useCreateGroup, useGroupByCode, useGroupSearch, useJoinGroup, useMyGroups } from '../group.hooks';

/**
 * Trang nhóm lớp: nhóm của tôi, tìm nhóm công khai, và vào nhóm bằng mã 8 số.
 *
 * Ba việc gộp một trang vì chúng là ba lối vào cùng một đích. Tách thành ba route thì
 * người mới phải đoán xem mình cần trang nào trước khi biết nhóm mình muốn vào là loại gì.
 */
export function GroupsPage(): JSX.Element {
  const t = useT();
  const [creating, setCreating] = useState(false);

  const myGroups = useMyGroups();

  return (
    <div>
      <PageHeader
        title={t('Nhóm lớp')}
        description={t('Tạo nhóm để trao đổi nội bộ, hoặc tham gia nhóm đã có')}
        action={
          <Button icon={creating ? X : Plus} variant={creating ? 'secondary' : 'primary'} onClick={() => setCreating((v) => !v)}>
            {creating ? t('Đóng') : t('Tạo nhóm')}
          </Button>
        }
      />

      {creating && <CreateGroupForm onDone={() => setCreating(false)} />}

      <section className="mb-8">
        <SectionTitle>{t('Nhóm của tôi')}</SectionTitle>

        {myGroups.isLoading && <SkeletonList rows={2} />}
        {myGroups.isError && <ErrorMessage>{getErrorMessage(myGroups.error)}</ErrorMessage>}

        {myGroups.data?.length === 0 && (
          <EmptyState
            icon={Users}
            title={t('Bạn chưa ở nhóm nào')}
            description={t('Tạo một nhóm mới, hoặc tìm nhóm công khai bên dưới để xin vào.')}
          />
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {myGroups.data?.map((group) => <GroupCard key={group.id} group={group} />)}
        </div>
      </section>

      <JoinByCode />
      <SearchGroups />
    </div>
  );
}

/** Ô tạo nhóm. Trạng thái công khai/riêng tư và phê duyệt đều là công tắc bật/tắt. */
function CreateGroupForm({ onDone }: { onDone: () => void }): JSX.Element {
  const t = useT();
  const toast = useToast();
  const createGroup = useCreateGroup();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [requireApproval, setRequireApproval] = useState(true);
  const [error, setError] = useState('');

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    setError('');

    const parsed = createGroupSchema.safeParse({
      name,
      description: description.trim() || undefined,
      visibility: isPublic ? GroupVisibility.PUBLIC : GroupVisibility.PRIVATE,
      requireApproval,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('Dữ liệu không hợp lệ'));
      return;
    }

    createGroup.mutate(parsed.data, {
      onSuccess: (group) => {
        toast.success(t('Đã tạo nhóm, mã nhóm là {code}', { code: group.code }));
        onDone();
      },
      onError: (err) => setError(getErrorMessage(err)),
    });
  };

  return (
    <Card className="mb-6">
      <form noValidate onSubmit={submit} className="space-y-4">
        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Field label={t('Tên nhóm')}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('Ví dụ: Lớp tiếng Anh K65')}
            maxLength={120}
            autoFocus
          />
        </Field>

        <label className="block">
          <span className="text-sm font-medium text-content-soft">{t('Mô tả nhóm')}</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder={t('Không bắt buộc — vài dòng để người khác biết nhóm này làm gì')}
            className="mt-1.5 w-full rounded-lg border border-line-control bg-surface px-3 py-2 text-sm text-content outline-none transition-colors placeholder:text-content-muted focus:border-brand focus:ring-4 focus:ring-brand/10"
          />
        </label>

        <Toggle
          checked={isPublic}
          onChange={setIsPublic}
          label={t('Nhóm công khai')}
          hint={
            isPublic
              ? t('Ai cũng tìm thấy nhóm này khi tìm theo tên.')
              : t('Nhóm riêng tư: chỉ vào được nếu biết mã 8 số của nhóm.')
          }
        />

        <Toggle
          checked={requireApproval}
          onChange={setRequireApproval}
          label={t('Phê duyệt thành viên')}
          hint={
            requireApproval
              ? t('Người xin vào phải chờ trưởng nhóm duyệt.')
              : t('Ai có mã hoặc tìm thấy nhóm đều vào được ngay.')
          }
        />

        <div className="flex gap-2 border-t border-line pt-4">
          <Button type="submit" loading={createGroup.isPending}>
            {t('Tạo nhóm')}
          </Button>
          <Button type="button" variant="ghost" onClick={onDone}>
            {t('Huỷ')}
          </Button>
        </div>
      </form>
    </Card>
  );
}

/** Vào nhóm bằng mã 8 số — cách duy nhất tìm ra nhóm riêng tư. */
function JoinByCode(): JSX.Element {
  const t = useT();
  const [input, setInput] = useState('');
  const [code, setCode] = useState<string | null>(null);

  const found = useGroupByCode(code);

  return (
    <section className="mb-8">
      <SectionTitle>{t('Vào nhóm bằng mã')}</SectionTitle>
      <Card>
        <form noValidate
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setCode(input.trim());
          }}
        >
          <div className="w-44">
            <Field label={t('Mã nhóm')} hint={t('Gồm {n} chữ số', { n: GROUP_CODE_LENGTH })}>
              <Input
                value={input}
                // inputMode numeric để bàn phím điện thoại mở sẵn bàn số
                inputMode="numeric"
                maxLength={GROUP_CODE_LENGTH}
                placeholder="12345678"
                className="tracking-[0.2em]"
                onChange={(e) => setInput(e.target.value.replace(/\D/g, ''))}
              />
            </Field>
          </div>
          <Button type="submit" icon={Hash} disabled={input.length !== GROUP_CODE_LENGTH} className="mb-0.5">
            {t('Tìm')}
          </Button>
        </form>

        {found.isError && (
          <p className="mt-3 text-sm text-danger">{t('Không tìm thấy nhóm nào có mã này')}</p>
        )}
        {found.data && (
          <div className="mt-4">
            <GroupCard group={found.data} />
          </div>
        )}
      </Card>
    </section>
  );
}

/** Tìm nhóm công khai theo tên. Nhóm riêng tư không bao giờ hiện ở đây. */
function SearchGroups(): JSX.Element {
  const t = useT();
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');

  const results = useGroupSearch({ search: search || undefined, page: 1, pageSize: 12 });

  return (
    <section>
      <SectionTitle>{t('Tìm nhóm công khai')}</SectionTitle>

      <form noValidate
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(input.trim());
        }}
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted"
            aria-hidden
          />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('Tìm theo tên nhóm')}
            className="!mt-0 pl-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          {t('Tìm')}
        </Button>
      </form>

      {results.isLoading && <SkeletonList rows={2} />}
      {results.isError && <ErrorMessage>{getErrorMessage(results.error)}</ErrorMessage>}

      {results.data?.items.length === 0 && (
        <EmptyState
          icon={Search}
          title={t('Không có nhóm công khai nào khớp')}
          description={t('Nhóm riêng tư không hiện ở đây — muốn vào thì cần mã 8 số.')}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {results.data?.items.map((group) => <GroupCard key={group.id} group={group} />)}
      </div>
    </section>
  );
}

/** Một thẻ nhóm. Nút bên phải đổi theo quan hệ của người xem với nhóm đó. */
function GroupCard({ group }: { group: GroupSummary }): JSX.Element {
  const t = useT();
  const toast = useToast();
  const navigate = useNavigate();
  const join = useJoinGroup();

  const isMember =
    group.viewerState === GroupViewerState.MEMBER || group.viewerState === GroupViewerState.LEADER;

  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-semibold text-content">{group.name}</span>
            {group.visibility === GroupVisibility.PRIVATE ? (
              <Badge icon={Lock}>{t('Riêng tư')}</Badge>
            ) : (
              <Badge icon={Globe} tone="green">
                {t('Công khai')}
              </Badge>
            )}
            {group.viewerState === GroupViewerState.LEADER && (
              <Badge tone="brand">{t('Trưởng nhóm')}</Badge>
            )}
          </div>

          {group.description && (
            <p className="mt-1 line-clamp-2 text-sm text-content-soft">{group.description}</p>
          )}

          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-content-muted">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" aria-hidden />
              {t('{n} thành viên', { n: group.memberCount })}
            </span>
            <span>{t('{n} bài đăng', { n: group.postCount })}</span>
            {isMember && (
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Hash className="h-3.5 w-3.5" aria-hidden />
                {group.code}
              </span>
            )}
          </p>
        </div>

        {group.pendingCount > 0 && (
          <Badge tone="amber">{t('{n} chờ duyệt', { n: group.pendingCount })}</Badge>
        )}
      </div>

      <div className="mt-4 flex gap-2 border-t border-line pt-3">
        {isMember ? (
          <Button variant="secondary" size="sm" onClick={() => navigate(`/groups/${group.id}`)}>
            {t('Mở nhóm')}
          </Button>
        ) : group.viewerState === GroupViewerState.PENDING ? (
          <span className="text-sm text-content-muted">{t('Đang chờ trưởng nhóm duyệt')}</span>
        ) : (
          <Button
            size="sm"
            icon={UserPlus}
            loading={join.isPending && join.variables?.id === group.id}
            onClick={() =>
              join.mutate(
                { id: group.id },
                {
                  onSuccess: (result) =>
                    toast.success(
                      result.joined
                        ? t('Đã vào nhóm')
                        : t('Đã gửi yêu cầu, chờ trưởng nhóm duyệt'),
                    ),
                  onError: (err) => toast.error(getErrorMessage(err)),
                },
              )
            }
          >
            {group.requireApproval ? t('Xin vào nhóm') : t('Vào nhóm')}
          </Button>
        )}
      </div>
    </Card>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint: string;
}): JSX.Element {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[rgb(var(--brand))]"
      />
      <span>
        <span className="block text-sm font-medium text-content">{label}</span>
        <span className="block text-xs text-content-muted">{hint}</span>
      </span>
    </label>
  );
}
