/**
 * Các dạng bài tập trong một bài học.
 *
 * Tất cả đều sinh được từ dữ liệu từ vựng đã có (word, meaning, example) — không
 * cần nhập thêm nội dung. Thêm dạng mới thì phải bổ sung cả ở generator phía backend
 * và component hiển thị phía frontend.
 */
export const ExerciseType = {
  /** Cho từ tiếng Anh, chọn nghĩa tiếng Việt đúng. */
  CHOOSE_MEANING: 'CHOOSE_MEANING',
  /** Cho nghĩa tiếng Việt, chọn từ tiếng Anh đúng. */
  CHOOSE_WORD: 'CHOOSE_WORD',
  /** Ghép các cặp từ - nghĩa. */
  MATCH_PAIRS: 'MATCH_PAIRS',
  /** Sắp xếp các từ bị xáo trộn thành câu hoàn chỉnh. */
  ARRANGE_WORDS: 'ARRANGE_WORDS',
  /** Điền từ còn thiếu vào chỗ trống trong câu ví dụ. */
  FILL_BLANK: 'FILL_BLANK',
  /** Gõ lại từ tiếng Anh khi nhìn thấy nghĩa. */
  TYPE_WORD: 'TYPE_WORD',
  /** Nghe phát âm rồi gõ lại từ — không hiện chữ. */
  LISTEN_TYPE: 'LISTEN_TYPE',
  /** Nghe phát âm rồi chọn nghĩa đúng. */
  LISTEN_CHOOSE: 'LISTEN_CHOOSE',
} as const;
export type ExerciseType = (typeof ExerciseType)[keyof typeof ExerciseType];

/** Nhãn tiếng Việt mô tả yêu cầu của từng dạng bài. */
export const EXERCISE_PROMPTS: Record<ExerciseType, string> = {
  [ExerciseType.CHOOSE_MEANING]: 'Từ này có nghĩa là gì?',
  [ExerciseType.CHOOSE_WORD]: 'Chọn từ tiếng Anh đúng',
  [ExerciseType.MATCH_PAIRS]: 'Ghép từ với nghĩa tương ứng',
  [ExerciseType.ARRANGE_WORDS]: 'Sắp xếp thành câu hoàn chỉnh',
  [ExerciseType.FILL_BLANK]: 'Điền từ còn thiếu vào chỗ trống',
  [ExerciseType.TYPE_WORD]: 'Gõ từ tiếng Anh tương ứng',
  [ExerciseType.LISTEN_TYPE]: 'Nghe và gõ lại từ bạn nghe được',
  [ExerciseType.LISTEN_CHOOSE]: 'Nghe và chọn nghĩa đúng',
};

/** Số từ vựng trong một bài học. Ngắn để hoàn thành trong vài phút. */
export const WORDS_PER_LESSON = 4;

/** Số câu đúng tối thiểu (trên tổng số) để coi là qua bài. */
export const LESSON_PASS_RATIO = 0.7;
