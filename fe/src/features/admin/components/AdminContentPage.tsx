import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Library, Plus, Search } from 'lucide-react';
import { StudySetVisibility, type StudySetSummary } from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Button, EmptyState, ErrorMessage, Input, PageHeader, SkeletonList } from '../../../shared/components/ui';
import { StudySetCard } from '../../library/components/StudySetCard';
import { StudySetFormDialog } from '../../library/components/StudySetForms';
import { useCreateTopic, useTopics } from '../admin.hooks';
import type { Topic } from '../admin.api';
import { useT } from '../../../shared/i18n/language';

/**
 * Bộ thẻ "Hệ thống" — do quản trị viên soạn, dùng chung cho mọi người học.
 *
 * Hiện ĐÚNG như Thư viện của người học (cùng thẻ xem trước, cùng biểu mẫu), vì đây là
 * cùng một thứ: một dòng `topics` với `ownerId` null. Người học thấy chính những bộ này ở
 * tab Khám phá, nên sửa ở đây là bên đó đổi theo ngay — không có bản sao nào để đồng bộ.
 *
 * Bộ "Hệ thống" luôn công khai: biểu mẫu không có lựa chọn chế độ, và backend ghi
 * `PUBLIC` tường minh lúc tạo.
 */
export function AdminContentPage(): JSX.Element {
  const t = useT();
  const navigate = useNavigate();
  const topics = useTopics();
  const createTopic = useCreateTopic();
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');

  // Số bộ "Hệ thống" nhỏ (vài chục) nên lọc ngay trên máy, không cần API tìm kiếm riêng.
  const query = search.trim().toLowerCase();
  const sets = (topics.data ?? [])
    .filter((topic) => !query || `${topic.name} ${topic.description ?? ''}`.toLowerCase().includes(query))
    .map((topic) => toStudySetSummary(topic, topic.vocabularyCount));

  return (
    <div>
      <PageHeader
        title={t('Nội dung học tập')}
        description={t('Bộ thẻ Hệ thống luôn công khai: mọi người học thấy ngay trong Thư viện')}
        action={
          <Button icon={Plus} onClick={() => setCreating(true)}>
            {t('Tạo bộ thẻ')}
          </Button>
        }
      />

      {topics.isLoading && <SkeletonList rows={3} />}
      {topics.isError && <ErrorMessage>{getErrorMessage(topics.error)}</ErrorMessage>}

      {topics.data && topics.data.length === 0 && (
        <EmptyState
          icon={Library}
          title={t('Chưa có bộ thẻ Hệ thống nào')}
          description={t('Bộ thẻ tạo ở đây hiện ngay cho mọi người học trong Thư viện.')}
          action={
            <Button icon={Plus} onClick={() => setCreating(true)}>
              {t('Tạo bộ thẻ')}
            </Button>
          }
        />
      )}

      {topics.data && topics.data.length > 0 && (
        <>
          <label className="relative mb-4 block max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted"
              aria-hidden
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Tìm theo tên hoặc mô tả bộ thẻ')}
              aria-label={t('Tìm bộ thẻ')}
              className="pl-9"
            />
          </label>

          {sets.length === 0 ? (
            <EmptyState icon={Search} title={t('Không tìm thấy bộ thẻ nào')} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sets.map((set) => (
                <StudySetCard key={set.id} set={set} to={`/admin/content/${set.id}`} />
              ))}
            </div>
          )}
        </>
      )}

      {creating && (
        <StudySetFormDialog
          open
          publicOnly
          onClose={() => setCreating(false)}
          onSubmit={async ({ name, description, level }) => {
            const topic = await createTopic.mutateAsync({ name, description, level });
            navigate(`/admin/content/${topic.id}`);
          }}
        />
      )}
    </div>
  );
}

/**
 * Bộ "Hệ thống" dưới dạng mà các thành phần của Thư viện hiểu. Tác giả luôn là "Hệ
 * thống" — không lộ tên tài khoản quản trị, đúng như người học nhìn thấy.
 */
export function toStudySetSummary(topic: Topic, cardCount: number): StudySetSummary {
  return {
    id: topic.id,
    name: topic.name,
    description: topic.description,
    level: topic.level,
    visibility: StudySetVisibility.PUBLIC,
    cardCount,
    author: { id: null, name: null, isSystem: true },
    // Quản trị viên là người soạn bộ này — thẻ xem trước hiện nhãn "Công khai" như với chủ bộ.
    isOwner: true,
    createdAt: topic.createdAt,
    updatedAt: topic.updatedAt,
    // Bộ "Hệ thống" không bao giờ bị chặn (xem đặc tả thư viện, I-05).
    block: null,
  };
}
