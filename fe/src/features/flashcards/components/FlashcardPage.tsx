import { useState } from 'react';
import { ReviewQuality } from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Button, Card, EmptyState, ErrorMessage, Loading, PageHeader } from '../../../shared/components/ui';
import { useDueCards, useSubmitReview } from '../flashcard.hooks';

/**
 * Phiên ôn flashcard.
 *
 * Danh sách thẻ được giữ ở state cục bộ trong suốt phiên: nếu refetch giữa chừng,
 * thẻ vừa ôn sẽ biến mất khỏi danh sách và làm nhảy vị trí đang học.
 */
export function FlashcardPage(): JSX.Element {
  const dueCards = useDueCards();
  const submitReview = useSubmitReview();
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  const cards = dueCards.data ?? [];
  const card = cards[index];

  const handleRate = (quality: ReviewQuality): void => {
    if (!card) return;

    submitReview.mutate(
      { vocabularyId: card.vocabularyId, quality },
      {
        onSuccess: () => {
          setReviewedCount((n) => n + 1);
          setRevealed(false);
          setIndex((i) => i + 1);
        },
      },
    );
  };

  if (dueCards.isLoading) return <Loading />;
  if (dueCards.isError) return <ErrorMessage>{getErrorMessage(dueCards.error)}</ErrorMessage>;

  if (cards.length === 0) {
    return (
      <div>
        <PageHeader title="Ôn tập flashcard" />
        <EmptyState
          title="Không có từ nào cần ôn hôm nay"
          description="Vào mục Từ vựng để thêm từ mới vào danh sách học"
        />
      </div>
    );
  }

  // Đã ôn hết số thẻ trong phiên.
  if (!card) {
    return (
      <div>
        <PageHeader title="Ôn tập flashcard" />
        <Card className="text-center">
          <p className="text-lg font-semibold text-slate-900">Hoàn thành phiên ôn tập</p>
          <p className="mt-1 text-sm text-slate-500">Bạn đã ôn {reviewedCount} từ. Chuỗi ngày học được ghi nhận.</p>
          <Button
            className="mt-4"
            onClick={() => {
              setIndex(0);
              setReviewedCount(0);
              void dueCards.refetch();
            }}
          >
            Tải phiên mới
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Ôn tập flashcard" description={`Thẻ ${index + 1} / ${cards.length}`} />

      {submitReview.isError && <ErrorMessage>{getErrorMessage(submitReview.error)}</ErrorMessage>}

      <Card className="mb-4 min-h-[220px] text-center">
        <span className="text-xs uppercase tracking-wide text-slate-400">{card.topicName}</span>

        <p className="mt-4 text-3xl font-bold text-slate-900">{card.word}</p>
        {card.phonetic && <p className="mt-1 text-sm text-slate-500">{card.phonetic}</p>}

        {revealed ? (
          <div className="mt-6 border-t border-slate-100 pt-4">
            <p className="text-xl text-indigo-700">{card.meaning}</p>
            {card.example && <p className="mt-2 text-sm italic text-slate-500">"{card.example}"</p>}
          </div>
        ) : (
          <Button variant="secondary" className="mt-8" onClick={() => setRevealed(true)}>
            Hiện nghĩa
          </Button>
        )}
      </Card>

      {revealed && (
        <div>
          <p className="mb-2 text-center text-sm text-slate-500">Bạn nhớ từ này ở mức nào?</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <RateButton label="Quên rồi" tone="bg-red-600" onClick={() => handleRate(ReviewQuality.BLACKOUT)} disabled={submitReview.isPending} />
            <RateButton label="Khó nhớ" tone="bg-orange-500" onClick={() => handleRate(ReviewQuality.CORRECT_HARD)} disabled={submitReview.isPending} />
            <RateButton label="Nhớ được" tone="bg-indigo-600" onClick={() => handleRate(ReviewQuality.CORRECT)} disabled={submitReview.isPending} />
            <RateButton label="Rất dễ" tone="bg-green-600" onClick={() => handleRate(ReviewQuality.PERFECT)} disabled={submitReview.isPending} />
          </div>
          <p className="mt-3 text-center text-xs text-slate-400">
            Lựa chọn của bạn quyết định khi nào từ này xuất hiện lại (thuật toán SM-2)
          </p>
        </div>
      )}
    </div>
  );
}

function RateButton({
  label,
  tone,
  onClick,
  disabled,
}: {
  label: string;
  tone: string;
  onClick: () => void;
  disabled: boolean;
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50 ${tone}`}
    >
      {label}
    </button>
  );
}
