import { useState } from 'react';
import { BookOpen, CheckCircle2, RotateCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ReviewQuality } from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Button, Card, EmptyState, ErrorMessage, PageHeader, Skeleton } from '../../../shared/components/ui';
import { useDueCards, useSubmitReview } from '../flashcard.hooks';

/**
 * Phiên ôn flashcard.
 *
 * Danh sách thẻ được giữ ở state cục bộ trong suốt phiên: nếu refetch giữa chừng,
 * thẻ vừa ôn sẽ biến mất khỏi danh sách và làm nhảy vị trí đang học.
 */

/** 4 mức đánh giá, xếp từ quên tới nhớ rõ. Màu đi kèm nhãn chữ nên không phụ thuộc màu để hiểu. */
const RATINGS = [
  { quality: ReviewQuality.BLACKOUT, label: 'Quên rồi', hint: 'Ôn lại ngày mai', className: 'bg-red-600 hover:bg-red-700' },
  { quality: ReviewQuality.CORRECT_HARD, label: 'Khó nhớ', hint: 'Ôn lại sớm', className: 'bg-orange-500 hover:bg-orange-600' },
  { quality: ReviewQuality.CORRECT, label: 'Nhớ được', hint: 'Giãn cách bình thường', className: 'bg-brand hover:bg-brand-strong' },
  { quality: ReviewQuality.PERFECT, label: 'Rất dễ', hint: 'Giãn cách dài hơn', className: 'bg-emerald-600 hover:bg-emerald-700' },
];

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

  if (dueCards.isLoading) {
    return (
      <div>
        <PageHeader title="Ôn tập flashcard" />
        <Skeleton className="h-[260px] w-full" />
      </div>
    );
  }

  if (dueCards.isError) return <ErrorMessage>{getErrorMessage(dueCards.error)}</ErrorMessage>;

  if (cards.length === 0) {
    return (
      <div>
        <PageHeader title="Ôn tập flashcard" />
        <EmptyState
          icon={CheckCircle2}
          title="Bạn đã ôn hết từ cho hôm nay"
          description="Quay lại vào ngày mai, hoặc thêm từ mới vào danh sách học để ôn tiếp."
          action={
            <Link to="/vocabulary">
              <Button icon={BookOpen} variant="secondary">
                Thêm từ mới
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  // Đã ôn hết số thẻ trong phiên.
  if (!card) {
    return (
      <div>
        <PageHeader title="Ôn tập flashcard" />
        <Card className="py-10 text-center">
          {/* Linh vật xuất hiện ở đúng khoảnh khắc đáng ăn mừng — hợp hơn icon chung chung */}
          <img src="/logo.png" alt="" aria-hidden className="mx-auto mb-2 h-24 w-24 object-contain" />
          <p className="text-lg font-semibold text-slate-900">Hoàn thành phiên ôn tập</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            Bạn đã ôn {reviewedCount} từ. Hoạt động đã được ghi nhận vào chuỗi ngày học.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button
              icon={RotateCw}
              onClick={() => {
                setIndex(0);
                setReviewedCount(0);
                void dueCards.refetch();
              }}
            >
              Tải phiên mới
            </Button>
            <Link to="/">
              <Button variant="secondary">Xem thống kê</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const progress = (index / cards.length) * 100;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Ôn tập flashcard" description={`Thẻ ${index + 1} / ${cards.length}`} />

      {/* Thanh tiến độ phiên — user biết còn bao nhiêu, giảm cảm giác ôn mãi không hết */}
      <div className="mb-4 h-1 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-brand transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {submitReview.isError && (
        <div className="mb-3">
          <ErrorMessage>{getErrorMessage(submitReview.error)}</ErrorMessage>
        </div>
      )}

      <Card className="mb-4 flex min-h-[260px] flex-col items-center justify-center text-center">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{card.topicName}</span>

        <p className="mt-4 text-4xl font-bold tracking-tight text-slate-900">{card.word}</p>
        {card.phonetic && <p className="mt-1.5 text-sm text-slate-500">{card.phonetic}</p>}

        {revealed ? (
          <div className="mt-6 w-full animate-fade-in border-t border-slate-100 pt-5">
            <p className="text-xl font-medium text-brand-strong">{card.meaning}</p>
            {card.example && <p className="mt-2 text-sm italic text-slate-500">"{card.example}"</p>}
          </div>
        ) : (
          <Button variant="secondary" className="mt-8" onClick={() => setRevealed(true)}>
            Hiện nghĩa
          </Button>
        )}
      </Card>

      {revealed && (
        <div className="animate-slide-up">
          <p className="mb-2.5 text-center text-sm text-slate-500">Bạn nhớ từ này ở mức nào?</p>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {RATINGS.map((rating) => (
              <button
                key={rating.quality}
                onClick={() => handleRate(rating.quality)}
                disabled={submitReview.isPending}
                className={`flex flex-col items-center rounded-xl px-2 py-3 text-white transition-colors disabled:opacity-50 ${rating.className}`}
              >
                <span className="text-sm font-medium">{rating.label}</span>
                <span className="mt-0.5 text-[10px] text-white/75">{rating.hint}</span>
              </button>
            ))}
          </div>

          <p className="mt-3 text-center text-xs text-slate-400">
            Lựa chọn của bạn quyết định khi nào từ này xuất hiện lại (thuật toán SM-2)
          </p>
        </div>
      )}
    </div>
  );
}
