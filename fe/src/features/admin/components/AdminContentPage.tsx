import { PageHeader } from '../../../shared/components/ui';
import { ContentManager } from './ContentManager';

/** Quản lý nội dung học tập: chủ đề và từ vựng dùng chung cho toàn hệ thống. */
export function AdminContentPage(): JSX.Element {
  return (
    <div>
      <PageHeader
        title="Nội dung học tập"
        description="Chủ đề và từ vựng dùng chung cho mọi người học"
      />
      <ContentManager />
    </div>
  );
}
