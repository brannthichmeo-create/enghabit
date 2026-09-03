import bcrypt from 'bcryptjs';
import {
  ActivityType,
  GoalPeriod,
  GoalType,
  HabitFrequency,
  UserRole,
  VocabLevel,
  PrismaClient,
  type Prisma,
} from '@prisma/client';
import { computeStreak, initialSrsState, reviewCard, toLocalDate, ReviewQuality } from '@enghabit/shared';
import { TOPICS, buildMeaningQuestions } from './seed-data/content.js';

/**
 * Seed dữ liệu mẫu — IDEMPOTENT, chạy nhiều lần không tạo bản ghi trùng.
 *
 *   pnpm --filter @enghabit/be db:seed
 *
 * Tài khoản:
 *   admin@enghabit.com  / A1234567   (quản trị viên)
 *   user@enghabit.com   / A1234567   (có sẵn 45 ngày lịch sử học để xem thống kê)
 *   newbie@enghabit.com / A1234567   (tài khoản trắng, để xem giao diện lúc chưa có dữ liệu)
 */

const prisma = new PrismaClient();
const TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Các ngày (tính lùi từ hôm nay) mà người dùng demo có học.
 * Cố ý chừa 2 khoảng trống để chuỗi dài nhất (18) khác chuỗi hiện tại (10) — nhìn thực tế hơn.
 */
function activeDayOffsets(): number[] {
  const offsets: number[] = [];
  for (let d = 44; d >= 32; d -= 1) offsets.push(d); // chuỗi 13 ngày
  for (let d = 29; d >= 12; d -= 1) offsets.push(d); // chuỗi 18 ngày (dài nhất)
  for (let d = 9; d >= 0; d -= 1) offsets.push(d); // chuỗi 10 ngày, kéo tới hôm nay
  return offsets;
}

async function main(): Promise<void> {
  console.log('Bắt đầu seed...\n');

  const admin = await upsertUser('admin@enghabit.com', 'Quản trị viên', 'A1234567', UserRole.ADMIN);
  const learner = await upsertUser('user@enghabit.com', 'Nguyễn Minh Anh', 'A1234567');
  await upsertUser('newbie@enghabit.com', 'Người dùng mới', 'A1234567');

  const vocabByTopic = await seedContent(admin.id);
  await seedLearnerData(learner.id, vocabByTopic);
  await seedLoginHistory([admin.id, learner.id]);
  await seedNotifications(learner.id);

  await printSummary();
}

async function upsertUser(email: string, name: string, password: string, role: UserRole = UserRole.USER) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role,
      timezone: TIMEZONE,
      streak: { create: {} },
      notificationSetting: { create: {} },
      // Hai mốc nhắc mẫu để thấy ngay tính năng "nhiều mốc": sáng trong tuần, tối cả tuần.
      reminders: {
        create: [
          { label: 'Buổi sáng', timeOfDay: '07:30', daysOfWeek: [1, 2, 3, 4, 5] },
          { label: 'Trước khi ngủ', timeOfDay: '20:00', daysOfWeek: [1, 2, 3, 4, 5, 6, 7] },
        ],
      },
    },
  });
}

/** Tạo chủ đề, từ vựng và quiz. Trả về map tên chủ đề → danh sách id từ vựng. */
async function seedContent(adminId: number): Promise<Map<string, number[]>> {
  const result = new Map<string, number[]>();

  for (const topicSeed of TOPICS) {
    // Topic không có unique key trên name nên phải tìm trước khi tạo.
    const topic =
      (await prisma.topic.findFirst({ where: { name: topicSeed.name } })) ??
      (await prisma.topic.create({
        data: {
          name: topicSeed.name,
          description: topicSeed.description,
          level: topicSeed.level,
          createdById: adminId,
        },
      }));

    const vocabularyIds: number[] = [];
    for (const word of topicSeed.words) {
      const existing = await prisma.vocabulary.findFirst({ where: { topicId: topic.id, word: word.word } });
      const vocabulary = existing ?? (await prisma.vocabulary.create({ data: { ...word, topicId: topic.id } }));
      vocabularyIds.push(vocabulary.id);
    }
    result.set(topicSeed.name, vocabularyIds);

    const quizTitle = `Kiểm tra: ${topicSeed.name}`;
    const existingQuiz = await prisma.quiz.findFirst({ where: { topicId: topic.id, title: quizTitle } });
    if (!existingQuiz) {
      await prisma.quiz.create({
        data: {
          topicId: topic.id,
          title: quizTitle,
          questions: {
            create: [
              ...buildMeaningQuestions(topicSeed.words, 4),
              ...topicSeed.contextQuestions,
            ].map((q) => ({
              questionText: q.questionText,
              options: q.options,
              correctIndex: q.correctIndex,
            })),
          },
        },
      });
    }
  }

  return result;
}

/** Tạo thói quen, mục tiêu, tiến độ từ vựng và 45 ngày lịch sử hoạt động cho user demo. */
async function seedLearnerData(userId: number, vocabByTopic: Map<string, number[]>): Promise<void> {
  // Đã có lịch sử thì bỏ qua — giữ tính idempotent.
  const existingLogs = await prisma.activityLog.count({ where: { userId } });
  if (existingLogs > 0) {
    console.log(`  (user demo đã có ${existingLogs} hoạt động — bỏ qua phần tạo lịch sử)\n`);
    return;
  }

  const habits = await seedHabits(userId);
  await seedGoals(userId);

  const learnedVocabIds = [
    ...(vocabByTopic.get('Daily Conversation') ?? []),
    ...(vocabByTopic.get('Business English') ?? []).slice(0, 5),
    ...(vocabByTopic.get('Travel & Transportation') ?? []).slice(0, 4),
  ];

  await seedActivityHistory(userId, habits, learnedVocabIds);
  await seedVocabProgress(userId, learnedVocabIds);
  await seedQuizAttempts(userId);
  await recomputeStreak(userId);
}

/**
 * Nhật ký đăng nhập 30 ngày cho trang "Lượt truy cập" của quản trị viên.
 *
 * Có xen vài lần sai mật khẩu, vì màn hình này tồn tại chính là để nhìn ra loại sự
 * kiện đó — seed toàn lần thành công thì không kiểm chứng được phần hiển thị lỗi.
 */
async function seedLoginHistory(userIds: number[]): Promise<void> {
  const existing = await prisma.loginEvent.count();
  if (existing > 0) {
    console.log(`  (đã có ${existing} lượt đăng nhập — bỏ qua phần tạo nhật ký truy cập)`);
    return;
  }

  const users = await prisma.user.findMany({ where: { id: { in: userIds } } });
  const agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile Safari/604.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36 Edg/131.0',
  ];

  // Bắt đầu từ hôm qua: mốc giờ cố định 19-22h, nếu tính cả hôm nay thì bản ghi sẽ
  // rơi vào tương lai khi chạy seed lúc sáng.
  const events: Prisma.LoginEventCreateManyInput[] = [];
  for (let offset = 30; offset >= 1; offset -= 1) {
    for (const [index, user] of users.entries()) {
      // Không phải ngày nào cũng đăng nhập — chừa khoảng trống cho giống thật.
      if ((offset + index) % 3 === 0) continue;

      events.push({
        userId: user.id,
        email: user.email,
        success: true,
        ipAddress: `14.161.${20 + (offset % 8)}.${10 + index}`,
        userAgent: agents[(offset + index) % agents.length] as string,
        createdAt: instantAtOffset(offset, 19 + index),
      });
    }

    // Vài lần gõ sai mật khẩu rải rác trong tháng.
    if (offset % 9 === 0 && users[1]) {
      events.push({
        userId: users[1].id,
        email: users[1].email,
        success: false,
        reason: 'WRONG_PASSWORD',
        ipAddress: '14.161.33.7',
        userAgent: agents[0] as string,
        createdAt: instantAtOffset(offset, 22),
      });
    }
  }

  await prisma.loginEvent.createMany({ data: events });

  // lastLoginAt là dữ liệu dẫn xuất từ nhật ký — đặt lại cho khớp thay vì bịa số.
  for (const user of users) {
    const latest = await prisma.loginEvent.findFirst({
      where: { userId: user.id, success: true },
      orderBy: { createdAt: 'desc' },
    });
    if (latest) {
      await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: latest.createdAt } });
    }
  }

  console.log(`  Đã tạo ${events.length} lượt đăng nhập mẫu`);
}

/**
 * Vài thông báo mẫu cho người học demo, để mở app là thấy ngay chuông có nội dung
 * mà không phải chờ cron chạy tới giờ nhắc.
 */
async function seedNotifications(userId: number): Promise<void> {
  const existing = await prisma.notification.count({ where: { userId } });
  if (existing > 0) {
    console.log(`  (user demo đã có ${existing} thông báo — bỏ qua)`);
    return;
  }

  const yesterday = dateAtOffsetLocal(1);
  const twoDaysAgo = dateAtOffsetLocal(2);

  await prisma.notification.createMany({
    data: [
      {
        userId,
        type: 'DAILY_REMINDER',
        title: 'Đến giờ học tiếng Anh rồi!',
        body: 'Bạn đang có chuỗi 10 ngày. Học vài phút hôm nay để giữ chuỗi.',
        link: '/learn',
        dedupeKey: `DAILY_REMINDER:${yesterday}`,
        createdAt: instantAtOffset(1, 20),
      },
      {
        userId,
        type: 'GOAL_ACHIEVED',
        title: 'Đã đạt mục tiêu!',
        body: 'Số từ vựng mỗi ngày: 10/10 — hoàn thành hôm nay.',
        link: '/goals',
        readAt: instantAtOffset(1, 21),
        dedupeKey: `GOAL_ACHIEVED:1:${yesterday}`,
        createdAt: instantAtOffset(1, 20),
      },
      {
        userId,
        type: 'ANNOUNCEMENT',
        title: 'Chào mừng bạn đến với Enghabit',
        body: 'Đặt mục tiêu và bật nhắc nhở để giữ thói quen học đều mỗi ngày.',
        link: '/notifications',
        readAt: instantAtOffset(2, 9),
        dedupeKey: `ANNOUNCEMENT:seed:${twoDaysAgo}`,
        createdAt: instantAtOffset(2, 8),
      },
    ],
  });

  console.log('  Đã tạo 3 thông báo mẫu');
}

async function seedHabits(userId: number) {
  const definitions = [
    { name: 'Học 10 từ vựng mới', frequency: HabitFrequency.DAILY, reminderTime: '20:00', customDays: undefined },
    { name: 'Ôn flashcard 15 phút', frequency: HabitFrequency.DAILY, reminderTime: '21:00', customDays: undefined },
    {
      name: 'Làm 1 bài quiz',
      frequency: HabitFrequency.CUSTOM,
      reminderTime: '19:30',
      customDays: [2, 4, 6] as Prisma.InputJsonValue,
    },
  ];

  const habits = [];
  for (const def of definitions) {
    habits.push(
      await prisma.habit.create({
        data: {
          userId,
          name: def.name,
          frequency: def.frequency,
          reminderTime: def.reminderTime,
          customDays: def.customDays,
        },
      }),
    );
  }
  return habits;
}

async function seedGoals(userId: number): Promise<void> {
  const startDate = dateAtOffset(44);

  await prisma.goal.createMany({
    data: [
      { userId, type: GoalType.VOCAB_PER_DAY, targetValue: 10, period: GoalPeriod.DAILY, startDate },
      { userId, type: GoalType.MINUTES_PER_DAY, targetValue: 15, period: GoalPeriod.DAILY, startDate },
      { userId, type: GoalType.LESSONS_PER_WEEK, targetValue: 3, period: GoalPeriod.WEEKLY, startDate },
      { userId, type: GoalType.STREAK_TARGET, targetValue: 30, period: GoalPeriod.DAILY, startDate },
    ],
  });
}

/**
 * Sinh lịch sử hoạt động. ActivityLog là nguồn sự thật nên mọi thống kê/streak
 * trong bản demo đều bắt nguồn từ đây, không cấy số liệu giả vào bảng khác.
 */
async function seedActivityHistory(
  userId: number,
  habits: { id: number }[],
  vocabularyIds: number[],
): Promise<void> {
  const logs: Prisma.ActivityLogCreateManyInput[] = [];
  const checkIns: Prisma.HabitCheckInCreateManyInput[] = [];

  for (const offset of activeDayOffsets()) {
    const occurredAt = instantAtOffset(offset, 20); // ~20h tối theo giờ VN
    const localDate = dateAtOffset(offset);

    // Số từ học mỗi ngày dao động 4-10 cho giống thực tế.
    const vocabCount = 4 + (offset % 7);
    for (let i = 0; i < vocabCount; i += 1) {
      logs.push({
        userId,
        type: ActivityType.VOCAB_LEARNED,
        refId: vocabularyIds[(offset + i) % vocabularyIds.length] ?? null,
        value: 1,
        occurredAt,
        localDate,
      });
    }

    const reviewCount = 3 + (offset % 9);
    for (let i = 0; i < reviewCount; i += 1) {
      logs.push({
        userId,
        type: ActivityType.FLASHCARD_REVIEWED,
        refId: vocabularyIds[(offset * 2 + i) % vocabularyIds.length] ?? null,
        value: 1,
        occurredAt,
        localDate,
      });
    }

    // Check-in thói quen: 2 thói quen hằng ngày, thói quen quiz thì cách ngày.
    const habitsToCheckIn = offset % 3 === 0 ? habits : habits.slice(0, 2);
    for (const habit of habitsToCheckIn) {
      logs.push({
        userId,
        type: ActivityType.HABIT_CHECKIN,
        refId: habit.id,
        value: 1,
        occurredAt,
        localDate,
      });
      checkIns.push({ habitId: habit.id, userId, localDate, createdAt: occurredAt });
    }
  }

  await prisma.activityLog.createMany({ data: logs });
  await prisma.habitCheckIn.createMany({ data: checkIns });
  console.log(`  Đã tạo ${logs.length} hoạt động và ${checkIns.length} lượt check-in`);
}

/**
 * Tiến độ SRS: chạy thuật toán SM-2 thật qua nhiều lượt ôn thay vì gán số bừa,
 * nhờ vậy dữ liệu demo phản ánh đúng cách hệ thống vận hành.
 */
async function seedVocabProgress(userId: number, vocabularyIds: number[]): Promise<void> {
  const today = toLocalDate(new Date(), TIMEZONE);

  const rows = vocabularyIds.map((vocabularyId, index) => {
    let state = initialSrsState(dateAtOffsetLocal(30));

    // Mỗi từ đã ôn 1-4 lượt, chất lượng nhớ khác nhau.
    const rounds = 1 + (index % 4);
    for (let r = 0; r < rounds; r += 1) {
      const quality = index % 5 === 0 ? ReviewQuality.CORRECT_HARD : ReviewQuality.CORRECT;
      state = reviewCard(state, quality, dateAtOffsetLocal(30 - r * 3));
    }

    return {
      userId,
      vocabularyId,
      repetitions: state.repetitions,
      intervalDays: state.intervalDays,
      easeFactor: state.easeFactor,
      // Cho khoảng một nửa số từ tới hạn hôm nay để có thẻ ôn ngay khi mở app.
      nextReviewDate: new Date(`${index % 2 === 0 ? today : state.nextReviewDate}T00:00:00.000Z`),
      lastReviewedAt: instantAtOffset(index % 5, 20),
    };
  });

  await prisma.userVocabProgress.createMany({ data: rows });
  console.log(`  Đã tạo tiến độ SRS cho ${rows.length} từ vựng`);
}

async function seedQuizAttempts(userId: number): Promise<void> {
  const quizzes = await prisma.quiz.findMany({ include: { questions: { select: { id: true, correctIndex: true } } } });

  const attempts: Prisma.QuizAttemptCreateManyInput[] = [];
  const logs: Prisma.ActivityLogCreateManyInput[] = [];

  quizzes.slice(0, 4).forEach((quiz, index) => {
    const offset = [2, 6, 13, 20][index] ?? 2;
    const total = quiz.questions.length;
    // Điểm tăng dần theo thời gian để biểu đồ tiến bộ có xu hướng đi lên.
    const score = Math.min(total, Math.max(1, total - (index % 3)));

    const answers = quiz.questions.map((q, qi) => ({
      questionId: q.id,
      selectedIndex: qi < score ? q.correctIndex : (q.correctIndex + 1) % 4,
      correctIndex: q.correctIndex,
      isCorrect: qi < score,
    }));

    attempts.push({
      userId,
      quizId: quiz.id,
      score,
      total,
      answers,
      completedAt: instantAtOffset(offset, 21),
    });

    logs.push({
      userId,
      type: ActivityType.QUIZ_COMPLETED,
      refId: quiz.id,
      value: score,
      occurredAt: instantAtOffset(offset, 21),
      localDate: dateAtOffset(offset),
    });
  });

  await prisma.quizAttempt.createMany({ data: attempts });
  await prisma.activityLog.createMany({ data: logs });
  console.log(`  Đã tạo ${attempts.length} lượt làm quiz`);
}

/** Tính lại streak từ ActivityLog — đúng cách hệ thống làm khi chạy thật. */
async function recomputeStreak(userId: number): Promise<void> {
  const rows = await prisma.activityLog.findMany({
    where: { userId },
    select: { localDate: true },
    distinct: ['localDate'],
    orderBy: { localDate: 'asc' },
  });

  const state = computeStreak(rows.map((r) => r.localDate.toISOString().slice(0, 10)));

  await prisma.userStreak.upsert({
    where: { userId },
    create: {
      userId,
      currentStreak: state.currentStreak,
      longestStreak: state.longestStreak,
      lastActiveDate: state.lastActiveDate ? new Date(`${state.lastActiveDate}T00:00:00.000Z`) : null,
    },
    update: {
      currentStreak: state.currentStreak,
      longestStreak: state.longestStreak,
      lastActiveDate: state.lastActiveDate ? new Date(`${state.lastActiveDate}T00:00:00.000Z`) : null,
    },
  });

  console.log(`  Streak: hiện tại ${state.currentStreak} ngày, dài nhất ${state.longestStreak} ngày`);
}

// --- Tiện ích thời gian ---

/** Thời điểm UTC tương ứng `hour` giờ VN, cách hôm nay `offset` ngày. */
function instantAtOffset(offset: number, hour: number): Date {
  const now = new Date();
  const d = new Date(now.getTime() - offset * 86_400_000);
  // VN = UTC+7 nên trừ 7 để ra mốc UTC tương ứng.
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hour - 7, 0, 0));
}

/** Ngày local (kiểu Date cho cột DATE) cách hôm nay `offset` ngày. */
function dateAtOffset(offset: number): Date {
  return new Date(`${dateAtOffsetLocal(offset)}T00:00:00.000Z`);
}

/** Ngày local dạng chuỗi YYYY-MM-DD cách hôm nay `offset` ngày. */
function dateAtOffsetLocal(offset: number): string {
  return toLocalDate(new Date(Date.now() - offset * 86_400_000), TIMEZONE);
}

async function printSummary(): Promise<void> {
  const [users, topics, vocab, quizzes, questions, logs] = await Promise.all([
    prisma.user.count(),
    prisma.topic.count(),
    prisma.vocabulary.count(),
    prisma.quiz.count(),
    prisma.quizQuestion.count(),
    prisma.activityLog.count(),
  ]);

  console.log('\nSeed hoàn tất.');
  console.log(`  ${users} người dùng | ${topics} chủ đề | ${vocab} từ vựng`);
  console.log(`  ${quizzes} quiz (${questions} câu hỏi) | ${logs} hoạt động`);
  console.log('\nTài khoản đăng nhập:');
  console.log('  admin@enghabit.com  / A1234567   (quản trị viên)');
  console.log('  user@enghabit.com   / A1234567   (có sẵn dữ liệu học tập)');
  console.log('  newbie@enghabit.com / A1234567   (tài khoản trắng)');
}

main()
  .catch((error: unknown) => {
    console.error('Seed lỗi:', error);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
