import { PageHeader } from '../../../shared/components/ui';
import { ContentManager } from './ContentManager';
import { useT } from '../../../shared/i18n/language';

/** Quản lý nội dung học tập: chủ đề và từ vựng dùng chung cho toàn hệ thống. */
export function AdminContentPage(): JSX.Element {
  const t = useT();
  return (
    <div>
      <PageHeader
        title={t('Nội dung học tập')}
        description={t('Chủ đề và từ vựng dùng chung cho mọi người học')}
      />
      <ContentManager />
    </div>
  );
}
