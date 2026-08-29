import bcrypt from 'bcryptjs';
import { PrismaClient, VocabLevel, UserRole } from '@prisma/client';

/**
 * Seed dữ liệu mẫu — phải IDEMPOTENT (dùng upsert), chạy nhiều lần không tạo bản ghi trùng.
 * Mục tiêu: clone repo về là chạy thử được ngay (xem CLAUDE.md).
 *
 *   pnpm --filter @enghabit/be db:seed
 *
 * Tài khoản mẫu:
 *   admin@enghabit.local / Admin12345
 *   user@enghabit.local  / User12345
 */

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@enghabit.local' },
    update: {},
    create: {
      name: 'Quản trị viên',
      email: 'admin@enghabit.local',
      passwordHash: await bcrypt.hash('Admin12345', 10),
      role: UserRole.ADMIN,
      streak: { create: {} },
      notificationSetting: { create: { daysOfWeek: [1, 2, 3, 4, 5, 6, 7] } },
    },
  });

  await prisma.user.upsert({
    where: { email: 'user@enghabit.local' },
    update: {},
    create: {
      name: 'Người học mẫu',
      email: 'user@enghabit.local',
      passwordHash: await bcrypt.hash('User12345', 10),
      streak: { create: {} },
      notificationSetting: { create: { daysOfWeek: [1, 2, 3, 4, 5, 6, 7] } },
    },
  });

  const topics = [
    {
      name: 'Daily Conversation',
      description: 'Từ vựng giao tiếp hằng ngày',
      level: VocabLevel.BEGINNER,
      words: [
        { word: 'greeting', meaning: 'lời chào', phonetic: '/ˈɡriːtɪŋ/', example: 'A warm greeting from the host.' },
        { word: 'appointment', meaning: 'cuộc hẹn', phonetic: '/əˈpɔɪntmənt/', example: 'I have an appointment at 3pm.' },
        { word: 'grocery', meaning: 'hàng tạp hoá', phonetic: '/ˈɡroʊsəri/', example: 'She went grocery shopping.' },
      ],
    },
    {
      name: 'Business English',
      description: 'Từ vựng dùng trong môi trường công sở',
      level: VocabLevel.INTERMEDIATE,
      words: [
        { word: 'deadline', meaning: 'hạn chót', phonetic: '/ˈdedlaɪn/', example: 'We must meet the deadline.' },
        { word: 'negotiate', meaning: 'đàm phán', phonetic: '/nɪˈɡoʊʃieɪt/', example: 'They negotiated a new contract.' },
        { word: 'stakeholder', meaning: 'bên liên quan', phonetic: '/ˈsteɪkhoʊldər/', example: 'Inform all stakeholders.' },
      ],
    },
  ];

  for (const topicData of topics) {
    // Topic chưa có unique key trên name nên tìm trước rồi mới quyết định tạo.
    const existing = await prisma.topic.findFirst({ where: { name: topicData.name } });
    const topic =
      existing ??
      (await prisma.topic.create({
        data: {
          name: topicData.name,
          description: topicData.description,
          level: topicData.level,
          createdById: admin.id,
        },
      }));

    for (const word of topicData.words) {
      const existingWord = await prisma.vocabulary.findFirst({
        where: { topicId: topic.id, word: word.word },
      });
      if (!existingWord) {
        await prisma.vocabulary.create({ data: { ...word, topicId: topic.id } });
      }
    }

    const quizTitle = `Kiểm tra: ${topic.name}`;
    const existingQuiz = await prisma.quiz.findFirst({ where: { topicId: topic.id, title: quizTitle } });
    if (!existingQuiz) {
      await prisma.quiz.create({
        data: {
          topicId: topic.id,
          title: quizTitle,
          questions: {
            create: topicData.words.map((w) => ({
              questionText: `"${w.word}" có nghĩa là gì?`,
              options: [w.meaning, 'nghĩa khác 1', 'nghĩa khác 2', 'nghĩa khác 3'],
              correctIndex: 0,
            })),
          },
        },
      });
    }
  }

  console.log('Seed hoàn tất.');
  console.log('  admin@enghabit.local / Admin12345');
  console.log('  user@enghabit.local  / User12345');
}

main()
  .catch((error: unknown) => {
    console.error('Seed lỗi:', error);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
