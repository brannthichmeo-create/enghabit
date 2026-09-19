import { createHash, randomInt, randomUUID } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import bcrypt from 'bcryptjs';
import {
  ActivityType,
  CoinReason,
  GoalPeriod,
  GoalType,
  GroupJoinStatus,
  GroupMemberRole,
  HabitFrequency,
  NotificationType,
  PasswordResetStatus,
  StudyMode,
  StudySetReportStatus,
  UserRole,
  PrismaClient,
  type Prisma,
} from '@prisma/client';
import {
  DAILY_CHECKIN_REWARD,
  DAILY_MISSIONS,
  FEATURES,
  RATING_QUALITY,
  ReviewRating,
  STREAK_FREEZE_PRICE,
  checkInDedupeKey,
  computeStreak,
  shopItemDedupeKey,
  initialSrsState,
  matchMentions,
  missionDedupeKey,
  qualityForMultipleChoice,
  reviewCard,
  toLocalDate,
  ReviewQuality,
  type MentionTarget,
} from '@enghabit/shared';
import { TOPICS } from './seed-data/content.js';
import { COMMUNITY_MEMBERS, POSTS } from './seed-data/community.js';
import { STUDY_SETS, STUDY_SET_REPORTS } from './seed-data/library.js';
import { GROUPS } from './seed-data/groups.js';
import { FRAME_TYPE, MASCOT_TYPE } from '../src/modules/shop/shop.catalog-data.js';
import { pngChunk } from '../src/modules/shop/shop.mascot-image.js';
import { seedShopCatalog } from '../src/modules/shop/shop.catalog.js';

/**
 * Seed dữ liệu mẫu — IDEMPOTENT, chạy nhiều lần không tạo bản ghi trùng.
 *
 *   pnpm --filter @enghabit/be db:seed
 *
 * Tài khoản:
 *   admin@enghabit.com  / A1234567   (quản trị viên)
 *   user@enghabit.com   / A1234567   (có sẵn 45 ngày lịch sử học để xem thống kê)
 *   newbie@enghabit.com / A1234567   (tài khoản trắng, để xem giao diện lúc chưa có dữ liệu)
 *   Sáu thành viên trong seed-data/community.ts, cùng mật khẩu A1234567.
 *
 * Mỗi phần tự kiểm tra "đã có dữ liệu chưa" trước khi ghi, nên chạy lại seed trên một DB
 * đã seed từ bản cũ vẫn bổ sung được phần còn thiếu mà không nhân đôi phần đã có.
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

  const members = await seedCommunityMembers();
  await seedCommunity(admin.id, learner.id, members);

  const people = new Map<string, number>([[admin.email, admin.id], [learner.email, learner.id], ...members]);
  await seedLibrary(admin.id, people);
  await seedStudyHistory(learner.id);
  await seedGroups(admin.id, people);
  await seedPasswordResetRequests(admin.id, people);
  await seedRewards(learner.id);
  // Cua hang chay SAU Phan thuong: nguoi hoc chi mua duoc trong pham vi so xu ma phan
  // tren vua tao ra, neu khong seed se de lai mot cai vi am.
  await seedShop(learner.id);
  await seedFrameTestData(learner.id, [...members.values()]);
  await seedFeatureFlags();

  await printSummary();
}

/**
 * Một dòng bật sẵn cho mỗi tính năng, để màn /admin/features có dữ liệu đẹp ngay sau
 * khi clone.
 *
 * Đây là tiện nghi, KHÔNG phải điều kiện để chạy: thiếu dòng thì service coi là bật
 * (xem be/src/modules/features/feature.service.ts). Vì vậy `create` mà không `update` —
 * chạy lại seed không được bật lại tính năng quản trị viên đã cố ý tắt.
 */
async function seedFeatureFlags(): Promise<void> {
  for (const feature of FEATURES) {
    await prisma.featureFlag.upsert({
      where: { key: feature.key },
      create: { key: feature.key, isEnabled: true },
      update: {},
    });
  }
}

/**
 * Tên tài khoản suy ra từ phần trước dấu @ của email — CÙNG QUY TẮC với bước điền dữ
 * liệu trong migration `20260905020000_them_ten_tai_khoan_va_yeu_cau_cap_lai_mat_khau`.
 * Hai chỗ lệch nhau thì cùng một email sẽ ra hai tên khác nhau tuỳ vào việc dữ liệu
 * đến từ migration hay từ seed.
 *
 * Các email trong seed đều có phần đầu khác nhau nên không cần bước khử trùng như
 * migration; nếu thêm email mới vào seed thì phải tự kiểm tra điều đó.
 */
function usernameFromEmail(email: string): string {
  return email.split('@')[0]!.slice(0, 40).toLowerCase();
}

async function upsertUser(email: string, name: string, password: string, role: UserRole = UserRole.USER) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name,
      username: usernameFromEmail(email),
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

/** Tạo chủ đề và từ vựng. Trả về map tên chủ đề → danh sách id từ vựng. */
async function seedContent(adminId: number): Promise<Map<string, number[]>> {
  const result = new Map<string, number[]>();

  for (const topicSeed of TOPICS) {
    // Topic không có unique key trên name nên phải tìm trước khi tạo. Chỉ tìm trong bộ
    // "Hệ thống": người học có thể tự tạo bộ trùng tên, seed không được nhận nhầm bộ đó.
    const topic =
      (await prisma.topic.findFirst({ where: { name: topicSeed.name, ownerId: null } })) ??
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

/**
 * Diễn đàn Cộng đồng: người tham gia, bài đăng, bình luận và lượt tim.
 *
 * Bài đăng KHÔNG sinh ActivityLog — đăng bài không phải hoạt động học, ghi vào đó thì
 * mọi thống kê sẽ tính cả việc viết bài là học (xem community.service).
 *
 * Mốc thời gian được đặt lùi về quá khứ chứ không để mặc định: mười bài cùng hiện
 * "vài giây trước" trông không giống một diễn đàn có người dùng thật.
 */
async function seedCommunity(
  adminId: number,
  learnerId: number,
  members: ReadonlyMap<string, number>,
): Promise<void> {
  const existing = await prisma.post.count({ where: { groupId: null } });
  if (existing > 0) {
    console.log(`  (diễn đàn đã có ${existing} bài — bỏ qua)`);
    return;
  }

  // Chỉ số 0 là quản trị viên, 1 là người học mẫu, còn lại là thành viên riêng của
  // diễn đàn — khớp với quy ước ở seed-data/community.ts.
  const people = [adminId, learnerId, ...COMMUNITY_MEMBERS.map((member) => idOf(members, member.email))];

  let commentCount = 0;
  let likeCount = 0;

  for (const seed of POSTS) {
    const createdAt = instantAtOffset(seed.daysAgo, seed.hour);

    const post = await prisma.post.create({
      data: {
        authorId: people[seed.by] as number,
        title: seed.title,
        body: seed.body,
        createdAt,
        updatedAt: createdAt,
      },
      select: { id: true },
    });

    // Chèn từng tệp một chứ không dùng nested create — Prisma gộp nhiều dòng vào một
    // câu INSERT và tổng dung lượng sẽ vượt max_allowed_packet của MySQL.
    if (seed.textFile) {
      const data = Buffer.from(seed.textFile.content, 'utf8');
      await prisma.postAttachment.create({
        data: {
          postId: post.id,
          data,
          mimeType: 'text/plain',
          fileName: seed.textFile.fileName,
          sizeBytes: data.length,
          createdAt,
        },
      });
    }

    if (seed.image) {
      const data = makeBandedPng(seed.image.bands);
      await prisma.postAttachment.create({
        data: {
          postId: post.id,
          data,
          mimeType: 'image/png',
          fileName: seed.image.fileName,
          sizeBytes: data.length,
          createdAt,
        },
      });
    }

    await prisma.postLike.createMany({
      data: seed.likedBy.map((index) => ({
        postId: post.id,
        userId: people[index] as number,
        createdAt,
      })),
    });
    likeCount += seed.likedBy.length;

    await prisma.postComment.createMany({
      data: seed.comments.map((comment) => ({
        postId: post.id,
        authorId: people[comment.by] as number,
        body: comment.body,
        createdAt: new Date(createdAt.getTime() + comment.hoursAfter * 3_600_000),
      })),
    });
    commentCount += seed.comments.length;
  }

  console.log(
    `  Đã tạo ${POSTS.length} bài viết, ${commentCount} bình luận, ${likeCount} lượt tim từ ${people.length} người`,
  );
}

/**
 * Lịch sử học của một thành viên diễn đàn.
 *
 * Cần thiết vì cấp độ hiện cạnh tên người viết được suy từ ActivityLog — không có
 * hoạt động thì ai cũng ở cấp 1 và nhãn cấp độ trở nên vô nghĩa.
 *
 * Nhẹ hơn hẳn `seedActivityHistory` của người dùng demo: chỉ có học từ và ôn tập, đủ
 * để ra cấp độ và có mặt trên bảng xếp hạng, không cần thói quen hay bài kiểm tra.
 */
async function seedMemberActivity(
  userId: number,
  plan: { activeDays: number; vocabPerDay: number; reviewsPerDay: number },
): Promise<void> {
  const existing = await prisma.activityLog.count({ where: { userId } });
  if (existing > 0) return;

  const logs: Prisma.ActivityLogCreateManyInput[] = [];

  // Học liên tục tính từ hôm qua trở về trước, để chuỗi ngày của họ còn "sống".
  for (let offset = plan.activeDays; offset >= 1; offset -= 1) {
    const occurredAt = instantAtOffset(offset, 20);
    const localDate = dateAtOffset(offset);

    for (let i = 0; i < plan.vocabPerDay; i += 1) {
      logs.push({ userId, type: ActivityType.VOCAB_LEARNED, value: 1, occurredAt, localDate });
    }
    for (let i = 0; i < plan.reviewsPerDay; i += 1) {
      logs.push({ userId, type: ActivityType.FLASHCARD_REVIEWED, value: 1, occurredAt, localDate });
    }
  }

  await prisma.activityLog.createMany({ data: logs });
  await recomputeStreak(userId);
}

/**
 * Thành viên dùng chung cho diễn đàn, Thư viện và Nhóm lớp. Trả về map email → id.
 *
 * Tách khỏi `seedCommunity` vì hàm đó bỏ qua toàn bộ khi diễn đàn đã có bài — mà Thư
 * viện và Nhóm lớp vẫn cần các tài khoản này trên một DB đã seed từ bản cũ.
 */
async function seedCommunityMembers(): Promise<Map<string, number>> {
  const members = new Map<string, number>();
  for (const member of COMMUNITY_MEMBERS) {
    const user = await upsertUser(member.email, member.name, 'A1234567');
    members.set(member.email, user.id);
    await seedMemberActivity(user.id, member);
  }
  return members;
}

// ---------------------------------------------------------------------------
// Thư viện, Học/Ôn tập, Kiểm duyệt bộ thẻ
// ---------------------------------------------------------------------------

/** Bộ thẻ người học tự tạo, báo cáo vi phạm, và thông báo đi kèm các trạng thái đó. */
async function seedLibrary(adminId: number, people: ReadonlyMap<string, number>): Promise<void> {
  const setIds = new Map<string, number>();
  const notifications: Prisma.NotificationCreateManyInput[] = [];
  let cardCount = 0;
  let createdSets = 0;

  for (const seed of STUDY_SETS) {
    const ownerId = idOf(people, seed.owner);
    const createdAt = instantAtOffset(seed.daysAgo, 21);
    const blockedAt = seed.blockedReason ? pastInstantAtOffset(Math.max(seed.daysAgo - 1, 0), 10) : null;

    /*
      Bỏ qua TỪNG bộ đã có, không bỏ qua cả hàm khi thư viện đã có dữ liệu.

      Cách cũ (đếm tổng rồi return) làm seed không bao giờ bổ sung được bộ thẻ mới thêm
      vào `STUDY_SETS` trên một DB đã seed từ bản trước — mà đó chính là việc seed phải
      làm được, theo quy tắc idempotent ở CLAUDE.md.
    */
    const already = await prisma.topic.findFirst({
      where: { name: seed.name, ownerId },
      select: { id: true },
    });
    if (already) {
      setIds.set(seed.name, already.id);
      continue;
    }

    const set = await prisma.topic.create({
      data: {
        name: seed.name,
        description: seed.description,
        level: seed.level,
        visibility: seed.visibility,
        ownerId,
        createdById: ownerId,
        blockedAt,
        blockedReason: seed.blockedReason ?? null,
        blockedById: seed.blockedReason ? adminId : null,
        createdAt,
        updatedAt: createdAt,
        vocabularies: {
          create: seed.cards.map((card) => ({
            word: card.word,
            meaning: card.meaning,
            phonetic: card.phonetic ?? null,
            example: card.example ?? null,
            createdAt,
          })),
        },
      },
      select: { id: true },
    });
    setIds.set(seed.name, set.id);
    cardCount += seed.cards.length;
    createdSets += 1;

    if (seed.blockedReason && blockedAt) {
      notifications.push({
        userId: ownerId,
        type: NotificationType.STUDY_SET_BLOCKED,
        title: 'Bộ thẻ của bạn đã bị chặn',
        body: `Bộ thẻ "${seed.name}" bị chặn: ${seed.blockedReason}`.slice(0, 500),
        link: `/library/${set.id}`,
        dedupeKey: `${NotificationType.STUDY_SET_BLOCKED}:seed:${set.id}`,
        createdAt: blockedAt,
      });
    }
  }

  for (const seed of STUDY_SET_REPORTS) {
    const topicId = setIds.get(seed.set);
    if (topicId === undefined) throw new Error(`Báo cáo mẫu trỏ tới bộ thẻ không có trong STUDY_SETS: ${seed.set}`);
    const reporterId = idOf(people, seed.reporter);

    // Báo cáo cũng bỏ qua từng dòng: chạy lại seed không được tạo báo cáo trùng, mà
    // `pendingKey` chỉ chặn được các báo cáo còn ở trạng thái PENDING.
    const reported = await prisma.studySetReport.findFirst({
      where: { topicId, reporterId, reason: seed.reason },
      select: { id: true },
    });
    if (reported) continue;

    const createdAt = pastInstantAtOffset(seed.daysAgo, 9);
    const isPending = seed.status === StudySetReportStatus.PENDING;
    const resolvedAt = isPending ? null : new Date(createdAt.getTime() + 5 * 3_600_000);

    const report = await prisma.studySetReport.create({
      data: {
        topicId,
        reporterId,
        reason: seed.reason,
        status: seed.status,
        // Cùng định dạng với pendingReportKey ở library.access.ts.
        pendingKey: isPending ? `${topicId}:${reporterId}` : null,
        resolvedById: isPending ? null : adminId,
        resolvedAt,
        createdAt,
      },
      select: { id: true },
    });

    notifications.push(
      isPending
        ? {
            userId: adminId,
            type: NotificationType.STUDY_SET_REPORTED,
            title: 'Có báo cáo vi phạm bộ thẻ',
            body: `Báo cáo bộ thẻ "${seed.set}": ${seed.reason}`.slice(0, 500),
            link: '/admin/study-sets',
            dedupeKey: `${NotificationType.STUDY_SET_REPORTED}:${report.id}`,
            createdAt,
          }
        : {
            userId: reporterId,
            type: NotificationType.STUDY_SET_REPORT_RESOLVED,
            title: 'Báo cáo của bạn đã được xử lý',
            body:
              seed.status === StudySetReportStatus.RESOLVED
                ? `Quản trị viên đã chặn bộ thẻ "${seed.set}". Cảm ơn bạn đã báo cáo.`
                : `Quản trị viên đã xem báo cáo về bộ thẻ "${seed.set}" và không thấy vi phạm.`,
            link: '/library',
            dedupeKey: `${NotificationType.STUDY_SET_REPORT_RESOLVED}:seed:${report.id}`,
            createdAt: resolvedAt ?? createdAt,
          },
    );
  }

  await notify(notifications);
  console.log(
    `  Đã tạo ${createdSets}/${STUDY_SETS.length} bộ thẻ người học (${cardCount} thẻ mới), ` +
      `${STUDY_SET_REPORTS.length} báo cáo vi phạm đã có đủ`,
  );
}

/** Số ngày học gần nhất được dựng lịch sử ôn và phiên học. */
const STUDY_HISTORY_DAYS = 10;

/**
 * Lịch sử ôn (`card_reviews`), phiên học và bộ đếm nhóm Yếu cho người học demo.
 *
 * DỰNG TỪ ActivityLog có sẵn chứ không bịa riêng: mỗi lượt học/ôn trong 10 ngày học gần
 * nhất sinh đúng một dòng card_reviews cùng thẻ, cùng thời điểm. Nhờ vậy lịch sử ôn,
 * độ chính xác và thống kê ngày không bao giờ nói ba con số khác nhau.
 */
async function seedStudyHistory(userId: number): Promise<void> {
  const existing = await prisma.cardReview.count({ where: { userId } });
  if (existing > 0) {
    console.log(`  (user demo đã có ${existing} lượt ôn — bỏ qua lịch sử ôn)`);
    return;
  }

  const logs = await prisma.activityLog.findMany({
    where: {
      userId,
      type: { in: [ActivityType.VOCAB_LEARNED, ActivityType.FLASHCARD_REVIEWED] },
      refId: { not: null },
    },
    orderBy: { occurredAt: 'asc' },
    select: { id: true, refId: true, localDate: true, occurredAt: true },
  });

  // Chỉ lấy thẻ còn tồn tại — refId của log cũ có thể trỏ tới thẻ đã bị xoá.
  const refIds = [...new Set(logs.map((log) => log.refId as number))];
  const liveIds = new Set(
    (await prisma.vocabulary.findMany({ where: { id: { in: refIds } }, select: { id: true } })).map((v) => v.id),
  );

  const byDay = new Map<string, typeof logs>();
  for (const log of logs) {
    if (!liveIds.has(log.refId as number)) continue;
    const day = log.localDate.toISOString().slice(0, 10);
    byDay.set(day, [...(byDay.get(day) ?? []), log]);
  }

  const days = [...byDay.keys()].sort().slice(-STUDY_HISTORY_DAYS);
  if (days.length === 0) {
    console.log('  (user demo chưa có hoạt động học — bỏ qua lịch sử ôn)');
    return;
  }

  const reviews: Prisma.CardReviewCreateManyInput[] = [];
  const sessions: Prisma.ActivityLogCreateManyInput[] = [];
  const counters = new Map<number, { correct: number; wrong: number; last: Date }>();

  days.forEach((day, dayIndex) => {
    const dayLogs = byDay.get(day) ?? [];
    const sessionKey = randomUUID();
    // Xen kẽ hai chế độ theo ngày để lịch sử có cả Flashcard lẫn Trắc nghiệm.
    const mode = dayIndex % 2 === 0 ? StudyMode.FLASHCARD : StudyMode.MULTIPLE_CHOICE;
    let correctInSession = 0;
    let lastAt = dayLogs[0]?.occurredAt ?? new Date();

    dayLogs.forEach((log, index) => {
      const vocabularyId = log.refId as number;
      // Thẻ có id chia hết cho 6 cố ý sai một nửa số lần để nhóm "Yếu" có thẻ thật.
      const isCorrect = vocabularyId % 6 === 0 ? index % 2 === 0 : (vocabularyId + index) % 5 !== 0;
      const quality =
        mode === StudyMode.MULTIPLE_CHOICE
          ? qualityForMultipleChoice(isCorrect)
          : RATING_QUALITY[
              isCorrect ? ((vocabularyId + index) % 3 === 0 ? ReviewRating.EASY : ReviewRating.GOOD) : ReviewRating.AGAIN
            ];
      const intervalBefore = 1 + ((vocabularyId + index) % 6);
      const reviewedAt = new Date(log.occurredAt.getTime() + index * 25_000);

      reviews.push({
        userId,
        vocabularyId,
        mode,
        isCorrect,
        quality: Number(quality),
        responseMs: 1_800 + ((vocabularyId * 37 + index * 211) % 7_000),
        intervalBefore,
        intervalAfter: isCorrect ? intervalBefore * 2 : 1,
        attemptKey: createHash('sha256').update(`seed:${userId}:${log.id}`).digest('hex'),
        sessionKey,
        reviewedAt,
      });

      if (isCorrect) correctInSession += 1;
      const counter = counters.get(vocabularyId) ?? { correct: 0, wrong: 0, last: reviewedAt };
      if (isCorrect) counter.correct += 1;
      else counter.wrong += 1;
      counter.last = reviewedAt;
      counters.set(vocabularyId, counter);
      lastAt = reviewedAt;
    });

    // Một dòng "hoàn thành phiên" mỗi ngày — nguồn của mục tiêu "Số phiên học mỗi tuần".
    sessions.push({
      userId,
      type: ActivityType.QUIZ_COMPLETED,
      value: correctInSession,
      occurredAt: new Date(lastAt.getTime() + 60_000),
      localDate: new Date(`${day}T00:00:00.000Z`),
      dedupeKey: `SESSION:${sessionKey}`,
    });
  });

  await prisma.cardReview.createMany({ data: reviews });
  await prisma.activityLog.createMany({ data: sessions });

  let overdue = 0;
  for (const [vocabularyId, counter] of counters) {
    // Vài thẻ đẩy lịch ôn về quá khứ để nhóm "Quá hạn" không trống.
    const makeOverdue = vocabularyId % 7 === 3;
    const { count } = await prisma.userVocabProgress.updateMany({
      where: { userId, vocabularyId },
      data: {
        correctCount: counter.correct,
        wrongCount: counter.wrong,
        lapses: counter.wrong,
        lastReviewedAt: counter.last,
        ...(makeOverdue ? { nextReviewDate: dateAtOffset(2 + (vocabularyId % 4)) } : {}),
      },
    });
    if (count > 0 && makeOverdue) overdue += 1;
  }

  console.log(`  Đã tạo ${reviews.length} lượt ôn, ${sessions.length} phiên học, ${overdue} thẻ quá hạn`);
}

// ---------------------------------------------------------------------------
// Nhóm lớp
// ---------------------------------------------------------------------------

async function seedGroups(adminId: number, people: ReadonlyMap<string, number>): Promise<void> {
  let groupCount = 0;
  let postCount = 0;
  let fileCount = 0;
  let shareCount = 0;
  let mentionCount = 0;
  const notifications: Prisma.NotificationCreateManyInput[] = [];

  // Tên hiển thị và tên tài khoản của mọi người, lấy một lần cho cả 20 nhóm. Đọc từ DB
  // chứ không suy từ email: tên tài khoản là thứ `@mention` so khớp, nên nó phải là
  // đúng giá trị đã lưu, không phải một phép đoán song song.
  const profiles = new Map(
    (await prisma.user.findMany({ select: { id: true, name: true, username: true } })).map((user) => [
      user.id,
      user,
    ]),
  );
  const profileOf = (userId: number): { name: string; username: string } => {
    const profile = profiles.get(userId);
    if (!profile) throw new Error(`Không tìm thấy hồ sơ người dùng id=${userId} khi seed Nhóm lớp`);
    return profile;
  };

  for (const seed of GROUPS) {
    // Bỏ qua TỪNG nhóm đã có, không bỏ qua cả hàm — cùng lý do với seedLibrary: thêm
    // nhóm mẫu mới phải vào được một DB đã seed từ bản trước.
    if (await prisma.group.findFirst({ where: { name: seed.name }, select: { id: true } })) continue;

    const createdAt = instantAtOffset(seed.daysAgo, 20);
    const leaderIds = seed.leaders.map((email) => idOf(people, email));
    const memberIds = seed.members.map((email) => idOf(people, email));
    const blockedAt = seed.blockedReason ? pastInstantAtOffset(1, 10) : null;

    const group = await prisma.group.create({
      data: {
        code: await uniqueGroupCode(),
        name: seed.name,
        description: seed.description,
        visibility: seed.visibility,
        requireApproval: seed.requireApproval,
        createdById: leaderIds[0] ?? null,
        blockedAt,
        blockedReason: seed.blockedReason ?? null,
        blockedById: seed.blockedReason ? adminId : null,
        createdAt,
        updatedAt: createdAt,
      },
      select: { id: true },
    });

    await prisma.groupMember.createMany({
      data: [
        ...leaderIds.map((userId, index) => ({
          groupId: group.id,
          userId,
          role: GroupMemberRole.LEADER,
          joinedAt: new Date(createdAt.getTime() + index * 3_600_000),
        })),
        ...memberIds.map((userId, index) => ({
          groupId: group.id,
          userId,
          role: GroupMemberRole.MEMBER,
          joinedAt: new Date(createdAt.getTime() + (index + 1) * 6 * 3_600_000),
        })),
      ],
    });

    const requestedAt = pastInstantAtOffset(1, 18);
    const rejectedAt = instantAtOffset(3, 9);
    await prisma.groupJoinRequest.createMany({
      data: [
        ...seed.pendingRequests.map((request) => ({
          groupId: group.id,
          userId: idOf(people, request.email),
          status: GroupJoinStatus.PENDING,
          message: request.message ?? null,
          createdAt: requestedAt,
        })),
        ...seed.rejectedRequests.map((request) => ({
          groupId: group.id,
          userId: idOf(people, request.email),
          status: GroupJoinStatus.REJECTED,
          message: request.message ?? null,
          decidedById: leaderIds[0] ?? null,
          decidedAt: rejectedAt,
          createdAt: instantAtOffset(4, 21),
        })),
      ],
    });

    for (const request of seed.pendingRequests) {
      const requesterId = idOf(people, request.email);
      for (const leaderId of leaderIds) {
        notifications.push({
          userId: leaderId,
          type: NotificationType.GROUP_JOIN_REQUEST,
          title: 'Có yêu cầu vào nhóm',
          body: `Có người xin vào nhóm "${seed.name}". Vào nhóm để duyệt hoặc từ chối.`,
          link: `/groups/${group.id}`,
          dedupeKey: `${NotificationType.GROUP_JOIN_REQUEST}:seed:${group.id}:${requesterId}`,
          createdAt: requestedAt,
        });
      }
    }
    for (const request of seed.rejectedRequests) {
      notifications.push({
        userId: idOf(people, request.email),
        type: NotificationType.GROUP_JOIN_REJECTED,
        title: 'Yêu cầu vào nhóm bị từ chối',
        body: `Trưởng nhóm đã từ chối yêu cầu vào nhóm "${seed.name}" của bạn.`,
        link: '/groups',
        dedupeKey: `${NotificationType.GROUP_JOIN_REJECTED}:seed:${group.id}`,
        createdAt: rejectedAt,
      });
    }
    if (seed.blockedReason && blockedAt) {
      for (const userId of [...leaderIds, ...memberIds]) {
        notifications.push({
          userId,
          type: NotificationType.GROUP_BLOCKED,
          title: 'Nhóm đã bị chặn',
          body: `Nhóm "${seed.name}" bị chặn: ${seed.blockedReason}`.slice(0, 500),
          link: `/groups/${group.id}`,
          dedupeKey: `${NotificationType.GROUP_BLOCKED}:seed:${group.id}`,
          createdAt: blockedAt,
        });
      }
    }

    // Ai có thể được nhắc trong nhóm này — đúng danh sách mà `listMentionTargets` trả về.
    const mentionTargets: MentionTarget[] = [...leaderIds, ...memberIds].map((userId) => ({
      userId,
      ...profileOf(userId),
    }));

    for (const post of seed.posts) {
      const postedAt = instantAtOffset(post.daysAgo, post.hour);
      const authorId = idOf(people, post.by);
      const created = await prisma.post.create({
        data: {
          authorId,
          groupId: group.id,
          title: post.title,
          body: post.body,
          createdAt: postedAt,
          updatedAt: postedAt,
        },
        select: { id: true },
      });

      /*
        Tệp đính kèm = tài liệu nhóm. Chèn TỪNG tệp một chứ không dùng nested create:
        Prisma gộp nhiều dòng vào một câu INSERT và tổng dung lượng sẽ vượt
        `max_allowed_packet` của MySQL (xem chú thích ở community.service).
      */
      for (const file of post.files ?? []) {
        const data =
          file.kind === 'image'
            ? makeBandedPng(file.bands ?? [])
            : Buffer.from(file.content ?? '', 'utf8');
        await prisma.postAttachment.create({
          data: {
            postId: created.id,
            data,
            mimeType: file.kind === 'image' ? 'image/png' : 'text/plain',
            fileName: file.fileName,
            sizeBytes: data.length,
            createdAt: postedAt,
          },
        });
        fileCount += 1;
      }

      await prisma.postLike.createMany({
        data: post.likedBy.map((email) => ({ postId: created.id, userId: idOf(people, email), createdAt: postedAt })),
      });

      // Bình luận tạo TỪNG dòng chứ không `createMany`: cần id của mỗi bình luận để
      // đặt khoá chống trùng cho thông báo đề cập, đúng định dạng của mention.service.
      for (const comment of post.comments) {
        const commentedAt = new Date(postedAt.getTime() + comment.hoursAfter * 3_600_000);
        const commentAuthorId = idOf(people, comment.by);
        const createdComment = await prisma.postComment.create({
          data: { postId: created.id, authorId: commentAuthorId, body: comment.body, createdAt: commentedAt },
          select: { id: true },
        });

        mentionCount += pushMentionNotifications(notifications, {
          text: comment.body,
          targets: mentionTargets,
          authorId: commentAuthorId,
          authorName: profileOf(commentAuthorId).name,
          groupId: group.id,
          postTitle: post.title,
          key: `COMMENT:${createdComment.id}`,
          title: 'Bạn được nhắc trong một bình luận',
          createdAt: commentedAt,
        });
      }

      mentionCount += pushMentionNotifications(notifications, {
        // Cả tiêu đề lẫn nội dung, giống hệt `createPost` của community.service —
        // người ta hay nhắc tên ngay ở tiêu đề ("@all họp nhóm").
        text: `${post.title}\n${post.body}`,
        targets: mentionTargets,
        authorId,
        authorName: profileOf(authorId).name,
        groupId: group.id,
        postTitle: post.title,
        key: `POST:${created.id}`,
        title: 'Bạn được nhắc trong một bài đăng',
        createdAt: postedAt,
      });

      postCount += 1;
    }

    shareCount += await seedGroupStudySets(group.id, seed, leaderIds, createdAt);
    groupCount += 1;
  }

  await notify(notifications);
  console.log(
    `  Đã tạo ${groupCount}/${GROUPS.length} nhóm lớp · ${postCount} bài đăng · ${fileCount} tệp tài liệu · ` +
      `${shareCount} lượt chia sẻ bộ thẻ · ${mentionCount} thông báo đề cập`,
  );
}

/**
 * Chia sẻ các bộ thẻ của nhóm vào tab Flashcard.
 *
 * Kiểm lại điều kiện "chủ bộ thẻ phải là một trong các trưởng nhóm" y như
 * `group.service.shareStudySet` — dữ liệu mẫu đi vòng qua Prisma nên không có ai chặn
 * hộ, mà một dòng chia sẻ sai luật sẽ mở bộ riêng tư của người ngoài cho cả nhóm đọc.
 */
async function seedGroupStudySets(
  groupId: number,
  seed: { name: string; studySets: string[] },
  leaderIds: number[],
  createdAt: Date,
): Promise<number> {
  let count = 0;

  for (const setName of seed.studySets) {
    const set = await prisma.topic.findFirst({
      where: { name: setName, ownerId: { in: leaderIds } },
      select: { id: true, ownerId: true },
    });
    if (!set) {
      throw new Error(
        `Nhóm "${seed.name}" chia sẻ bộ thẻ "${setName}" nhưng không trưởng nhóm nào sở hữu bộ đó`,
      );
    }

    await prisma.groupStudySet.create({
      data: { groupId, topicId: set.id, sharedById: set.ownerId, createdAt },
    });
    count += 1;
  }

  return count;
}

/**
 * Gom thông báo đề cập cho một đoạn văn bản, trả về số thông báo đã thêm.
 *
 * Dùng CHÍNH `matchMentions` của shared — cùng hàm mà backend gọi khi người dùng đăng
 * bài thật. Liệt kê tay người được nhắc thì dữ liệu mẫu sẽ lệch khỏi hành vi thật ngay
 * lần đầu ai đó sửa một câu trong `GROUPS`.
 */
function pushMentionNotifications(
  sink: Prisma.NotificationCreateManyInput[],
  params: {
    text: string;
    targets: MentionTarget[];
    authorId: number;
    authorName: string;
    groupId: number;
    postTitle: string;
    /** Phần phân biệt của khoá chống trùng, dạng `POST:<id>` hoặc `COMMENT:<id>`. */
    key: string;
    title: string;
    createdAt: Date;
  },
): number {
  const mentioned = matchMentions(params.text, params.targets, params.authorId);

  for (const target of mentioned) {
    sink.push({
      userId: target.userId,
      type: NotificationType.MENTIONED,
      title: params.title,
      body: `${params.authorName} nhắc bạn ở "${params.postTitle}"`.slice(0, 500),
      // Bài đăng không có URL riêng, nó mở bên trong trang nhóm.
      link: `/groups/${params.groupId}`,
      dedupeKey: `${NotificationType.MENTIONED}:${params.key}:${target.userId}`,
      createdAt: params.createdAt,
    });
  }

  return mentioned.length;
}

/** Mã nhóm 8 chữ số, cùng cách sinh với group.service (randomInt, không Math.random). */
async function uniqueGroupCode(): Promise<string> {
  for (;;) {
    const code = String(randomInt(0, 100_000_000)).padStart(8, '0');
    if ((await prisma.group.count({ where: { code } })) === 0) return code;
  }
}

// ---------------------------------------------------------------------------
// Quản lý yêu cầu cấp lại mật khẩu
// ---------------------------------------------------------------------------

/**
 * Yêu cầu cấp lại mật khẩu ở cả ba trạng thái, cho hai tab Yêu cầu và Nhật ký.
 *
 * Yêu cầu đã duyệt đều đánh dấu ĐÃ DÙNG: một lượt duyệt còn hiệu lực cho phép đặt mật khẩu
 * mới mà không cần mật khẩu cũ — không để sẵn thứ đó trên DB dev dùng chung.
 */
const RESET_REQUESTS: {
  email: string;
  status: PasswordResetStatus;
  daysAgo: number;
  rejectReason?: string;
}[] = [
  { email: 'ha.le@enghabit.com', status: PasswordResetStatus.PENDING, daysAgo: 0 },
  { email: 'duy.pham@enghabit.com', status: PasswordResetStatus.PENDING, daysAgo: 1 },
  { email: 'long.tran@enghabit.com', status: PasswordResetStatus.APPROVED, daysAgo: 6 },
  {
    email: 'chi.bui@enghabit.com',
    status: PasswordResetStatus.REJECTED,
    daysAgo: 4,
    rejectReason: 'Thông tin bạn cung cấp không khớp với tài khoản. Hãy liên hệ quản trị viên qua email trường để xác minh.',
  },
];

async function seedPasswordResetRequests(adminId: number, people: ReadonlyMap<string, number>): Promise<void> {
  const existing = await prisma.passwordResetRequest.count();
  if (existing > 0) {
    console.log(`  (đã có ${existing} yêu cầu cấp lại mật khẩu — bỏ qua)`);
    return;
  }

  const notifications: Prisma.NotificationCreateManyInput[] = [];
  for (const seed of RESET_REQUESTS) {
    const userId = idOf(people, seed.email);
    const createdAt = pastInstantAtOffset(seed.daysAgo, 8);
    const isPending = seed.status === PasswordResetStatus.PENDING;
    const reviewedAt = isPending ? null : new Date(createdAt.getTime() + 2 * 3_600_000);

    const request = await prisma.passwordResetRequest.create({
      data: {
        userId,
        status: seed.status,
        pendingUserId: isPending ? userId : null,
        reviewedById: isPending ? null : adminId,
        reviewedAt,
        rejectReason: seed.rejectReason ?? null,
        usedAt: seed.status === PasswordResetStatus.APPROVED && reviewedAt ? new Date(reviewedAt.getTime() + 3_600_000) : null,
        createdAt,
      },
      select: { id: true },
    });

    if (isPending) {
      notifications.push({
        userId: adminId,
        type: NotificationType.PASSWORD_RESET_REQUEST,
        title: 'Có yêu cầu cấp lại mật khẩu',
        body: `Tài khoản ${usernameFromEmail(seed.email)} yêu cầu cấp lại mật khẩu.`,
        link: '/admin/requests',
        dedupeKey: `${NotificationType.PASSWORD_RESET_REQUEST}:seed:${request.id}`,
        createdAt,
      });
    }
  }

  await notify(notifications);
  console.log(`  Đã tạo ${RESET_REQUESTS.length} yêu cầu cấp lại mật khẩu`);
}

// ---------------------------------------------------------------------------
// Phần thưởng
// ---------------------------------------------------------------------------

/**
 * Lịch sử xu và vật phẩm giữ chuỗi của người học demo.
 *
 * Nhiệm vụ chỉ được "nhận thưởng" ở những ngày ActivityLog thật sự đạt chỉ tiêu — cùng
 * cách BE chấm lại lúc nhận. Chừa hôm nay để người dùng tự bấm điểm danh và nhận thưởng.
 */
async function seedRewards(userId: number): Promise<void> {
  const existing = await prisma.coinTransaction.count({ where: { userId } });
  if (existing > 0) {
    console.log(`  (user demo đã có ${existing} giao dịch xu — bỏ qua Phần thưởng)`);
    return;
  }

  const today = dateAtOffsetLocal(0);
  const grouped = await prisma.activityLog.groupBy({
    by: ['localDate', 'type'],
    where: { userId },
    _count: { _all: true },
  });

  const countsByDay = new Map<string, Record<string, number>>();
  for (const row of grouped) {
    const day = row.localDate.toISOString().slice(0, 10);
    if (day === today) continue;
    const counts = countsByDay.get(day) ?? {};
    counts[row.type] = row._count._all;
    countsByDay.set(day, counts);
  }

  const days = [...countsByDay.keys()].sort().slice(-7);
  const rows: Prisma.CoinTransactionCreateManyInput[] = [];
  let balance = 0;

  for (const day of days) {
    const localDate = new Date(`${day}T00:00:00.000Z`);
    const checkedInAt = new Date(`${day}T13:00:00.000Z`); // 20h giờ Việt Nam
    rows.push({
      userId,
      amount: DAILY_CHECKIN_REWARD,
      reason: CoinReason.DAILY_CHECKIN,
      dedupeKey: checkInDedupeKey(day),
      localDate,
      createdAt: checkedInAt,
    });
    balance += DAILY_CHECKIN_REWARD;

    const counts = countsByDay.get(day) ?? {};
    for (const mission of DAILY_MISSIONS) {
      if ((counts[mission.activityType] ?? 0) < mission.target) continue;
      rows.push({
        userId,
        amount: mission.reward,
        reason: CoinReason.MISSION_CLAIM,
        dedupeKey: missionDedupeKey(mission.id, day),
        localDate,
        createdAt: new Date(checkedInAt.getTime() + 10 * 60_000),
      });
      balance += mission.reward;
    }
  }

  // Mua vật phẩm giữ chuỗi ở ngày cuối, để nguyên trong kho — không mua quá số xu đang có.
  const lastDay = days.at(-1);
  const freezeCount = lastDay ? Math.min(2, Math.floor(balance / STREAK_FREEZE_PRICE)) : 0;
  const purchasedAt = new Date(`${lastDay}T14:00:00.000Z`);
  for (let i = 0; i < freezeCount; i += 1) {
    rows.push({
      userId,
      amount: -STREAK_FREEZE_PRICE,
      reason: CoinReason.STREAK_FREEZE_PURCHASE,
      // Cùng định dạng với rewards.service: mua là hành động lặp lại được.
      dedupeKey: `${CoinReason.STREAK_FREEZE_PURCHASE}:${randomUUID()}`,
      localDate: new Date(`${lastDay}T00:00:00.000Z`),
      createdAt: purchasedAt,
    });
  }

  await prisma.coinTransaction.createMany({ data: rows });
  if (freezeCount > 0) {
    await prisma.streakFreeze.createMany({ data: Array.from({ length: freezeCount }, () => ({ userId, purchasedAt })) });
  }

  console.log(
    `  Đã tạo ${rows.length} giao dịch xu (số dư ${balance - freezeCount * STREAK_FREEZE_PRICE}) và ${freezeCount} vật phẩm giữ chuỗi`,
  );
}

// ---------------------------------------------------------------------------
// Cửa hàng vật phẩm
// ---------------------------------------------------------------------------

/**
 * Loại "Linh vật" + 20 vật phẩm, và một ít dữ liệu cho tài khoản demo.
 *
 * Idempotent theo từng bản ghi: tra theo (loại, tên) rồi mới tạo. Bảng `shop_items`
 * không có unique cho cặp đó nên không dùng được `upsert` — đây là script chạy tay,
 * thêm vài câu truy vấn tra cứu không đáng để ràng buộc thêm lược đồ.
 *
 * Phần của tài khoản demo cố ý đi đúng đường mà người dùng thật đi: mỗi lần "mua" ghi
 * một dòng ÂM vào sổ cái với đúng `dedupeKey` của cửa hàng, nên màn Ví có dữ liệu thật
 * và số dư khớp với kho vật phẩm. Nếu seed chỉ chèn `user_items` thì người mở màn Ví sẽ
 * thấy vật phẩm từ trên trời rơi xuống mà không có dòng chi nào.
 */
async function seedShop(learnerId: number): Promise<void> {
  /*
    Danh mục dùng LẠI `seedShopCatalog` của module shop.

    Đó là đường mà production nạp danh mục (trong startCommand của Render), nên nếu cho
    seed tự tạo danh mục riêng thì DB dev và DB production sẽ có hai bộ linh vật khác
    nhau — lỗi rất khó thấy vì cả hai đều "có đủ 20 vật phẩm".
  */
  const catalogResult = await seedShopCatalog(prisma);
  const created = catalogResult.createdItems;
  const typeId = catalogResult.typeIds[MASCOT_TYPE.slug] as number;

  const ownedAlready = await prisma.userItem.count({ where: { userId: learnerId } });
  if (ownedAlready > 0) {
    console.log(
      `  Cửa hàng: thêm ${created} vật phẩm (user demo đã có ${ownedAlready} vật phẩm — bỏ qua phần mua)`,
    );
    return;
  }

  const balanceRow = await prisma.coinTransaction.aggregate({
    where: { userId: learnerId },
    _sum: { amount: true },
  });
  let balance = balanceRow._sum.amount ?? 0;

  const catalog = await prisma.shopItem.findMany({
    where: { typeId },
    orderBy: [{ price: 'asc' }, { id: 'asc' }],
    select: { id: true, name: true, price: true },
  });

  // Mua từ rẻ tới đắt, dừng khi hết xu — tối đa 2 món để kho không đầy ngay.
  const today = dateAtOffsetLocal(0);
  const bought: { id: number; name: string }[] = [];

  for (const item of catalog) {
    if (bought.length >= 2 || item.price > balance) break;

    await prisma.coinTransaction.create({
      data: {
        userId: learnerId,
        amount: -item.price,
        reason: CoinReason.SHOP_PURCHASE,
        // Cùng khoá với shop.service: "SHOP_ITEM:<id>", mỗi vật phẩm mua đúng một lần.
        dedupeKey: shopItemDedupeKey(item.id),
        localDate: new Date(`${today}T00:00:00.000Z`),
      },
    });

    await prisma.userItem.create({
      data: { userId: learnerId, itemId: item.id, pricePaid: item.price },
    });

    balance -= item.price;
    bought.push({ id: item.id, name: item.name });
  }

  // Ba vật phẩm yêu thích, gồm cả món chưa mua — tab Yêu thích phải có cả hai trạng thái
  // để xem được nút "Mua" và nhãn "Đã sở hữu" nằm cạnh nhau.
  const favorites = catalog.slice(0, 3);
  if (favorites.length > 0) {
    await prisma.userItemFavorite.createMany({
      data: favorites.map((item) => ({ userId: learnerId, itemId: item.id })),
      skipDuplicates: true,
    });
  }

  // Đang dùng món đầu tiên, để trang Tổng quan có linh vật ngay sau khi seed.
  const first = bought[0];
  if (first) {
    await prisma.userEquippedItem.upsert({
      where: { userId_typeId: { userId: learnerId, typeId } },
      create: { userId: learnerId, typeId, itemId: first.id },
      update: { itemId: first.id },
    });
  }

  const usingText = first ? ` và đang dùng "${first.name}"` : '';
  console.log(
    `  Cửa hàng: thêm ${created} vật phẩm, user demo mua ${bought.length} món${usingText}, còn ${balance} xu`,
  );
}

/**
 * Dữ liệu thử cho khung viền: vài người đeo sẵn khung để THẤY được khung của người khác.
 *
 * Chỉ có 20 khung nằm trong cửa hàng thì chưa kiểm được yêu cầu chính của tính năng —
 * "người khác cũng thấy". Nên ở đây:
 *
 *  - Mỗi thành viên cộng đồng đeo một khung khác nhau, trải đủ ba bậc giá, để bảng xếp
 *    hạng, bài đăng, bình luận và danh sách thành viên nhóm hiện khung đa dạng.
 *  - Tài khoản demo đeo sẵn một khung và CÒN XU để tự mua thêm, thử luồng đổi khung.
 *
 * Xu lấy từ lịch sử điểm danh của những ngày TRƯỚC (đúng khoá `DAILY_CHECKIN:<ngày>`),
 * rồi mua bằng đúng dòng sổ cái của cửa hàng. Không tạo `user_items` chay: màn Ví của
 * từng người phải khớp với kho của họ, như với người dùng thật.
 *
 * Idempotent theo người: ai đã có ít nhất một khung thì bỏ qua người đó.
 */
async function seedFrameTestData(learnerId: number, memberIds: readonly number[]): Promise<void> {
  const frameType = await prisma.shopItemType.findUnique({ where: { slug: FRAME_TYPE.slug } });
  if (!frameType) {
    console.log('  (chưa có loại Khung viền — bỏ qua dữ liệu thử khung viền)');
    return;
  }

  const frames = await prisma.shopItem.findMany({
    where: { typeId: frameType.id },
    orderBy: [{ price: 'asc' }, { sortOrder: 'asc' }],
    select: { id: true, name: true, price: true },
  });
  if (frames.length === 0) return;

  // Rải khung trên cả ba bậc giá cho thành viên — nhìn bảng xếp hạng là thấy đủ kiểu.
  const pick = (index: number) => frames[(index * 7) % frames.length]!;

  const plans: { userId: number; buy: { id: number; name: string; price: number }[]; wear: number; spare: number }[] = [
    ...memberIds.slice(0, 6).map((userId, index) => ({ userId, buy: [pick(index)], wear: 0, spare: 0 })),
    // Demo: một khung rẻ + một khung giữa, đeo khung giữa, và còn dư 500 xu để tự mua thêm.
    {
      userId: learnerId,
      buy: [frames[0]!, frames.find((f) => f.price >= 800) ?? frames[1]!],
      wear: 1,
      spare: 500,
    },
  ];

  let dressed = 0;

  for (const plan of plans) {
    const owned = await prisma.userItem.count({
      where: { userId: plan.userId, item: { typeId: frameType.id } },
    });
    if (owned > 0) continue;

    const need = plan.buy.reduce((sum, f) => sum + f.price, 0) + plan.spare;
    await topUpWithPastCheckIns(plan.userId, need);

    const today = new Date(`${dateAtOffsetLocal(0)}T00:00:00.000Z`);
    for (const frame of plan.buy) {
      await prisma.coinTransaction.create({
        data: {
          userId: plan.userId,
          amount: -frame.price,
          reason: CoinReason.SHOP_PURCHASE,
          dedupeKey: shopItemDedupeKey(frame.id),
          localDate: today,
        },
      });
      await prisma.userItem.create({
        data: { userId: plan.userId, itemId: frame.id, pricePaid: frame.price },
      });
    }

    const worn = plan.buy[plan.wear]!;
    await prisma.userEquippedItem.upsert({
      where: { userId_typeId: { userId: plan.userId, typeId: frameType.id } },
      create: { userId: plan.userId, typeId: frameType.id, itemId: worn.id },
      update: { itemId: worn.id },
    });

    dressed += 1;
  }

  console.log(`  Khung viền: ${dressed} người đeo sẵn khung (gồm cả user demo, còn dư xu để tự mua thêm)`);
}

/**
 * Bù xu cho đủ `target` bằng điểm danh của những ngày ĐÃ QUA, lùi dần từ hôm qua.
 *
 * Dùng khoá `DAILY_CHECKIN:<ngày>` y như rewards.service, và `skipDuplicates` nên ngày nào
 * đã điểm danh thì không ghi đè — chỉ lấp ngày còn trống. Không đụng tới hôm nay, để
 * người dùng vẫn tự bấm điểm danh được khi thử.
 */
async function topUpWithPastCheckIns(userId: number, target: number): Promise<void> {
  for (let offset = 1; offset <= 120; offset += 1) {
    const balance =
      (await prisma.coinTransaction.aggregate({ where: { userId }, _sum: { amount: true } }))._sum.amount ?? 0;
    if (balance >= target) return;

    const day = dateAtOffsetLocal(offset);
    await prisma.coinTransaction.createMany({
      data: [
        {
          userId,
          amount: DAILY_CHECKIN_REWARD,
          reason: CoinReason.DAILY_CHECKIN,
          dedupeKey: checkInDedupeKey(day),
          localDate: new Date(`${day}T00:00:00.000Z`),
          createdAt: new Date(`${day}T13:00:00.000Z`),
        },
      ],
      skipDuplicates: true,
    });
  }
}

// ---------------------------------------------------------------------------
// Tiện ích chung
// ---------------------------------------------------------------------------

function idOf(people: ReadonlyMap<string, number>, email: string): number {
  const id = people.get(email);
  if (id === undefined) throw new Error(`Seed tham chiếu tài khoản chưa được tạo: ${email}`);
  return id;
}

/** `skipDuplicates`: thông báo có unique (userId, dedupeKey), chạy lại seed không lỗi. */
async function notify(rows: Prisma.NotificationCreateManyInput[]): Promise<void> {
  if (rows.length > 0) await prisma.notification.createMany({ data: rows, skipDuplicates: true });
}

/**
 * Sinh một ảnh PNG gồm các dải màu ngang, dùng làm ảnh đính kèm mẫu.
 *
 * Tự dựng thay vì nhúng chuỗi base64 sẵn: một khối base64 dài trong mã nguồn thì không
 * ai đọc được nó là ảnh gì, còn ở đây nhìn mảng màu là biết ngay.
 */
function makeBandedPng(bands: readonly (readonly [number, number, number])[]): Buffer {
  const width = 320;
  const bandHeight = 40;
  const height = bandHeight * bands.length;

  // Mỗi hàng ảnh bắt đầu bằng một byte kiểu lọc (0 = không lọc), rồi tới các điểm ảnh RGB.
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (1 + width * 3);
    raw[rowStart] = 0;

    const [r, g, b] = bands[Math.floor(y / bandHeight)] as readonly [number, number, number];
    for (let x = 0; x < width; x += 1) {
      const pixel = rowStart + 1 + x * 3;
      raw[pixel] = r;
      raw[pixel + 1] = g;
      raw[pixel + 2] = b;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bit mỗi kênh màu
  ihdr[9] = 2; // kiểu màu 2 = RGB
  // Ba byte còn lại là phương pháp nén, lọc và xen kẽ — đều để 0 theo chuẩn PNG.

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

async function seedHabits(userId: number) {
  const definitions = [
    { name: 'Học 10 từ vựng mới', frequency: HabitFrequency.DAILY, reminderTime: '20:00', customDays: undefined },
    { name: 'Ôn flashcard 15 phút', frequency: HabitFrequency.DAILY, reminderTime: '21:00', customDays: undefined },
    {
      name: 'Làm 1 bài kiểm tra',
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

    // Check-in thói quen: 2 thói quen hằng ngày, thói quen kiểm tra thì cách ngày.
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

/**
 * Như `instantAtOffset` nhưng không bao giờ rơi vào tương lai: chạy seed lúc 7h sáng mà
 * đặt mốc "hôm nay 9h" thì báo cáo sẽ hiện "sau 2 giờ nữa".
 */
function pastInstantAtOffset(offset: number, hour: number): Date {
  const at = instantAtOffset(offset, hour);
  const latest = Date.now() - 3_600_000;
  return at.getTime() > latest ? new Date(latest) : at;
}

async function printSummary(): Promise<void> {
  const [
    users,
    systemSets,
    userSets,
    vocab,
    logs,
    reviews,
    posts,
    comments,
    groups,
    reports,
    resets,
    groupDocuments,
    groupSets,
    groupRequests,
    mentions,
    shopItems,
    ownedItems,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.topic.count({ where: { ownerId: null } }),
    prisma.topic.count({ where: { ownerId: { not: null } } }),
    prisma.vocabulary.count(),
    prisma.activityLog.count(),
    prisma.cardReview.count(),
    prisma.post.count(),
    prisma.postComment.count(),
    prisma.group.count(),
    prisma.studySetReport.count(),
    prisma.passwordResetRequest.count(),
    // Tài liệu nhóm không có bảng riêng — đếm đúng thứ tab đó liệt kê: tệp đính kèm
    // của các bài có `group_id` (xem CLAUDE.md > Nhóm lớp).
    prisma.postAttachment.count({ where: { post: { groupId: { not: null } } } }),
    prisma.groupStudySet.count(),
    prisma.groupJoinRequest.count(),
    prisma.notification.count({ where: { type: NotificationType.MENTIONED } }),
    prisma.shopItem.count(),
    prisma.userItem.count(),
  ]);

  console.log('\nSeed hoàn tất.');
  console.log(`  ${users} người dùng | ${systemSets} bộ thẻ Hệ thống | ${userSets} bộ thẻ người học | ${vocab} thẻ`);
  console.log(`  ${logs} hoạt động | ${reviews} lượt ôn`);
  console.log(`  ${posts} bài đăng (${comments} bình luận) | ${groups} nhóm lớp`);
  console.log(
    `  Nhóm lớp: ${groupDocuments} tài liệu | ${groupSets} bộ thẻ chia sẻ | ` +
      `${groupRequests} yêu cầu vào nhóm | ${mentions} thông báo đề cập`,
  );
  console.log(`  ${reports} báo cáo bộ thẻ | ${resets} yêu cầu cấp lại mật khẩu`);
  console.log(`  Cửa hàng: ${shopItems} vật phẩm | ${ownedItems} lượt sở hữu`);
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
