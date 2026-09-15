import { StudySetReportStatus, StudySetVisibility, VocabLevel } from '@prisma/client';

/**
 * Bộ thẻ do người học tự tạo, cho màn Thư viện, Học/Ôn tập và Kiểm duyệt bộ thẻ.
 *
 * Chủ bộ và người báo cáo ghi bằng EMAIL, không bằng id — id chỉ có sau khi seed tạo
 * tài khoản. Email phải là một trong ba tài khoản mặc định hoặc `COMMUNITY_MEMBERS`.
 *
 * Cố ý phủ đủ các trạng thái giao diện phải vẽ: bộ công khai, bộ riêng tư, bộ đang bị
 * chặn (chủ bộ thấy lý do), bộ đang có báo cáo chờ xử lý, và báo cáo đã bị bỏ qua.
 */

export interface CardSeed {
  word: string;
  meaning: string;
  phonetic?: string;
  example?: string;
}

export interface StudySetSeed {
  owner: string;
  name: string;
  description: string;
  level: VocabLevel;
  visibility: StudySetVisibility;
  daysAgo: number;
  /** Có giá trị là bộ đang bị quản trị viên chặn. Chủ bộ đọc đúng câu này. */
  blockedReason?: string;
  cards: CardSeed[];
}

export interface StudySetReportSeed {
  /** Tên bộ thẻ trong `STUDY_SETS`. */
  set: string;
  reporter: string;
  reason: string;
  status: StudySetReportStatus;
  daysAgo: number;
}

export const LEARNER_EMAIL = 'user@enghabit.com';

export const STUDY_SETS: StudySetSeed[] = [
  {
    owner: LEARNER_EMAIL,
    name: 'IELTS Speaking Part 1',
    description: 'Từ vựng trả lời các chủ đề quen thuộc: quê hương, công việc, sở thích.',
    level: VocabLevel.INTERMEDIATE,
    visibility: StudySetVisibility.PUBLIC,
    daysAgo: 20,
    cards: [
      { word: 'hometown', meaning: 'quê nhà', phonetic: '/ˈhoʊmtaʊn/', example: 'My hometown is a small city in the north.' },
      { word: 'bustling', meaning: 'nhộn nhịp', phonetic: '/ˈbʌslɪŋ/', example: 'Hanoi is a bustling city.' },
      { word: 'leisure', meaning: 'thời gian rảnh rỗi', phonetic: '/ˈliːʒər/', example: 'I read novels in my leisure time.' },
      { word: 'commute', meaning: 'đi làm hằng ngày', phonetic: '/kəˈmjuːt/', example: 'My commute takes about 40 minutes.' },
      { word: 'hectic', meaning: 'bận rộn, dồn dập', phonetic: '/ˈhektɪk/', example: 'Last week was really hectic.' },
      { word: 'unwind', meaning: 'thư giãn', phonetic: '/ʌnˈwaɪnd/', example: 'I listen to music to unwind after work.' },
      { word: 'cosy', meaning: 'ấm cúng', phonetic: '/ˈkoʊzi/', example: 'Our apartment is small but cosy.' },
      { word: 'cuisine', meaning: 'ẩm thực', phonetic: '/kwɪˈziːn/', example: 'Vietnamese cuisine is famous for its fresh herbs.' },
      { word: 'nostalgic', meaning: 'hoài niệm', phonetic: '/nɒˈstældʒɪk/', example: 'Old songs make me feel nostalgic.' },
      { word: 'outgoing', meaning: 'hướng ngoại', phonetic: '/ˈaʊtɡoʊɪŋ/', example: 'My sister is more outgoing than me.' },
    ],
  },
  {
    owner: LEARNER_EMAIL,
    name: 'Từ vựng công sở của tôi',
    description: 'Ghi chép riêng những từ gặp trong email và cuộc họp ở công ty.',
    level: VocabLevel.INTERMEDIATE,
    visibility: StudySetVisibility.PRIVATE,
    daysAgo: 6,
    cards: [
      { word: 'follow up', meaning: 'theo dõi, nhắc lại', example: "I'll follow up with the client tomorrow." },
      { word: 'loop in', meaning: 'thêm ai đó vào cuộc trao đổi', example: 'Please loop in the design team.' },
      { word: 'bottleneck', meaning: 'điểm nghẽn', example: 'Approval is the main bottleneck in this process.' },
      { word: 'sign off', meaning: 'phê duyệt', example: 'The manager needs to sign off on the budget.' },
      { word: 'ballpark figure', meaning: 'con số ước chừng', example: 'Can you give me a ballpark figure?' },
      { word: 'touch base', meaning: 'trao đổi nhanh', example: "Let's touch base after lunch." },
    ],
  },
  {
    owner: LEARNER_EMAIL,
    name: 'Phrasal verbs hay gặp',
    description: 'Cụm động từ xuất hiện nhiều trong hội thoại hằng ngày.',
    level: VocabLevel.BEGINNER,
    visibility: StudySetVisibility.PUBLIC,
    daysAgo: 3,
    cards: [
      { word: 'give up', meaning: 'từ bỏ', example: "Don't give up so easily." },
      { word: 'look after', meaning: 'chăm sóc', example: 'She looks after her younger brother.' },
      { word: 'run out of', meaning: 'hết, cạn', example: "We've run out of milk." },
      { word: 'put off', meaning: 'hoãn lại', example: 'They put off the meeting until Friday.' },
      { word: 'figure out', meaning: 'tìm ra, hiểu ra', example: "I can't figure out this problem." },
      { word: 'turn down', meaning: 'từ chối', example: 'He turned down the job offer.' },
      { word: 'come across', meaning: 'tình cờ gặp', example: 'I came across an old photo yesterday.' },
      { word: 'get along with', meaning: 'hoà hợp với', example: 'I get along well with my colleagues.' },
    ],
  },
  {
    owner: 'lan.vu@enghabit.com',
    name: 'TOEIC Part 5 — Collocations',
    description: 'Các kết hợp từ thường ra trong phần điền từ của đề TOEIC.',
    level: VocabLevel.INTERMEDIATE,
    visibility: StudySetVisibility.PUBLIC,
    daysAgo: 28,
    cards: [
      { word: 'meet a deadline', meaning: 'kịp hạn chót', example: 'The team worked late to meet the deadline.' },
      { word: 'place an order', meaning: 'đặt hàng', example: 'You can place an order online.' },
      { word: 'launch a product', meaning: 'ra mắt sản phẩm', example: 'The company will launch a new product in May.' },
      { word: 'conduct a survey', meaning: 'tiến hành khảo sát', example: 'We conducted a survey of 500 customers.' },
      { word: 'submit a proposal', meaning: 'nộp đề xuất', example: 'Please submit your proposal by Monday.' },
      { word: 'reach an agreement', meaning: 'đạt được thoả thuận', example: 'Both sides reached an agreement.' },
      { word: 'file a complaint', meaning: 'nộp đơn khiếu nại', example: 'He filed a complaint with the manager.' },
      { word: 'take effect', meaning: 'có hiệu lực', example: 'The new policy takes effect next month.' },
      { word: 'raise awareness', meaning: 'nâng cao nhận thức', example: 'The campaign aims to raise awareness.' },
      { word: 'cover the cost', meaning: 'chi trả chi phí', example: 'The company will cover the cost of training.' },
    ],
  },
  {
    owner: 'nam.do@enghabit.com',
    name: 'Idioms thông dụng',
    description: 'Thành ngữ tiếng Anh người bản xứ dùng hằng ngày, kèm nghĩa tiếng Việt dễ nhớ.',
    level: VocabLevel.ADVANCED,
    visibility: StudySetVisibility.PUBLIC,
    daysAgo: 15,
    cards: [
      { word: 'break the ice', meaning: 'phá vỡ sự ngại ngùng', example: 'He told a joke to break the ice.' },
      { word: 'a piece of cake', meaning: 'dễ như ăn bánh', example: 'The exam was a piece of cake.' },
      { word: 'hit the books', meaning: 'học hành chăm chỉ', example: 'I have to hit the books tonight.' },
      { word: 'under the weather', meaning: 'không khoẻ', example: "I'm feeling a bit under the weather." },
      { word: 'cost an arm and a leg', meaning: 'rất đắt', example: 'That phone cost an arm and a leg.' },
      { word: 'once in a blue moon', meaning: 'hiếm khi', example: 'We eat out once in a blue moon.' },
      { word: 'call it a day', meaning: 'nghỉ tay, dừng việc', example: "Let's call it a day and go home." },
      { word: 'on the same page', meaning: 'cùng quan điểm', example: 'Make sure everyone is on the same page.' },
    ],
  },
  {
    owner: 'chi.bui@enghabit.com',
    name: 'Tiếng Anh ngành IT',
    description: 'Thuật ngữ lập trình và làm việc nhóm phần mềm.',
    level: VocabLevel.INTERMEDIATE,
    visibility: StudySetVisibility.PUBLIC,
    daysAgo: 10,
    cards: [
      { word: 'deploy', meaning: 'triển khai', example: 'We deploy to production every Friday.' },
      { word: 'bug', meaning: 'lỗi phần mềm', example: 'The tester found a critical bug.' },
      { word: 'repository', meaning: 'kho mã nguồn', example: 'Clone the repository to your machine.' },
      { word: 'refactor', meaning: 'tái cấu trúc mã', example: 'We need to refactor this module.' },
      { word: 'requirement', meaning: 'yêu cầu', example: 'The requirements changed twice this sprint.' },
      { word: 'deadline-driven', meaning: 'chạy theo hạn chót', example: 'Our team is very deadline-driven.' },
    ],
  },
  {
    owner: 'duy.pham@enghabit.com',
    name: 'Từ vựng thi cấp tốc',
    description: 'Tổng hợp nhanh — xem thêm tài liệu full tại trang của mình.',
    level: VocabLevel.BEGINNER,
    visibility: StudySetVisibility.PUBLIC,
    daysAgo: 4,
    cards: [
      { word: 'exam', meaning: 'kỳ thi' },
      { word: 'pass', meaning: 'đỗ, qua' },
      { word: 'fail', meaning: 'trượt' },
      { word: 'score', meaning: 'điểm số' },
    ],
  },
  {
    owner: 'long.tran@enghabit.com',
    name: 'Khoá học giá rẻ — inbox ngay',
    description: 'Liên hệ để mua trọn bộ tài liệu với giá ưu đãi.',
    level: VocabLevel.BEGINNER,
    visibility: StudySetVisibility.PUBLIC,
    daysAgo: 9,
    blockedReason:
      'Bộ thẻ dùng để quảng cáo bán khoá học, không phải nội dung học tập. Hãy xoá phần quảng cáo và thêm thẻ học thật trước khi yêu cầu mở lại.',
    cards: [
      { word: 'discount', meaning: 'giảm giá — inbox để nhận ưu đãi' },
      { word: 'contact', meaning: 'liên hệ ngay hôm nay' },
      { word: 'offer', meaning: 'ưu đãi có hạn' },
      { word: 'course', meaning: 'khoá học trọn đời' },
    ],
  },
];

export const STUDY_SET_REPORTS: StudySetReportSeed[] = [
  {
    set: 'Từ vựng thi cấp tốc',
    reporter: LEARNER_EMAIL,
    reason: 'Mô tả dẫn người học sang trang bán tài liệu bên ngoài, nội dung thẻ quá sơ sài.',
    status: StudySetReportStatus.PENDING,
    daysAgo: 1,
  },
  {
    set: 'Từ vựng thi cấp tốc',
    reporter: 'ha.le@enghabit.com',
    reason: 'Có dấu hiệu quảng cáo trá hình trong phần mô tả bộ thẻ.',
    status: StudySetReportStatus.PENDING,
    daysAgo: 0,
  },
  {
    set: 'Khoá học giá rẻ — inbox ngay',
    reporter: 'chi.bui@enghabit.com',
    reason: 'Bộ thẻ toàn nội dung quảng cáo bán khoá học, không có giá trị học tập.',
    status: StudySetReportStatus.RESOLVED,
    daysAgo: 8,
  },
  {
    set: 'Idioms thông dụng',
    reporter: 'duy.pham@enghabit.com',
    reason: 'Một số nghĩa tiếng Việt dịch chưa sát với thành ngữ gốc.',
    status: StudySetReportStatus.DISMISSED,
    daysAgo: 5,
  },
];
