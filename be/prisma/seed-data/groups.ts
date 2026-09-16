import { GroupVisibility } from '@prisma/client';
import { LEARNER_EMAIL } from './library.js';

/**
 * Nhóm lớp mẫu cho màn Nhóm lớp (người học) và Quản lý nhóm (quản trị viên).
 *
 * Người dùng ghi bằng EMAIL — id chỉ có sau khi seed tạo tài khoản.
 *
 * Bộ dữ liệu này cố ý đủ DÀY (20 bản ghi cho mỗi mục) để thử được những thứ chỉ lộ ra
 * khi có nhiều dữ liệu: phân trang tab Tài liệu nhóm, ô tìm theo tên tệp, lưới bộ thẻ
 * nhiều cột, hộp yêu cầu của trưởng nhóm, và chuông thông báo đề cập.
 *
 * Đếm theo từng mục — `pnpm db:seed` in lại đúng các con số này, lệch là dữ liệu mẫu
 * đã bị sửa mà quên cập nhật chỗ khác:
 *
 *   20 nhóm · 20 bài đăng · 20 tệp tài liệu · 20 lượt chia sẻ bộ thẻ
 *   20 yêu cầu vào nhóm · 20 lượt đề cập @ trong nội dung
 *
 * Số THÔNG BÁO đề cập lớn hơn 20 (hiện là 37) và cố ý không phải một con số tròn: một
 * `@all` trong nhóm năm người sinh bốn thông báo. Seed đếm lại bằng chính `matchMentions`
 * nên con số đó luôn khớp với những gì backend làm khi người dùng đăng bài thật.
 *
 * Phủ đủ các trạng thái giao diện phải vẽ: nhóm công khai cần duyệt, nhóm vào thẳng,
 * nhóm riêng tư, nhóm đang bị chặn, nhóm nhiều trưởng nhóm, nhóm chưa có bộ thẻ nào,
 * và nhóm chỉ có một người (trạng thái rỗng cũng là trạng thái phải nhìn thấy).
 */

// Rút gọn email cho gọn mắt — 20 nhóm mà viết đủ địa chỉ thì không đọc nổi bảng dữ liệu.
const USER = LEARNER_EMAIL;
const LONG = 'long.tran@enghabit.com';
const HA = 'ha.le@enghabit.com';
const DUY = 'duy.pham@enghabit.com';
const LAN = 'lan.vu@enghabit.com';
const NAM = 'nam.do@enghabit.com';
const CHI = 'chi.bui@enghabit.com';

/**
 * Một tệp đính kèm của bài đăng — cũng chính là một dòng trong tab Tài liệu nhóm.
 *
 * KHÔNG có đường tải tệp riêng cho tài liệu nhóm (xem CLAUDE.md): tệp vào nhóm bằng
 * cách đính kèm vào một bài đăng, nên dữ liệu mẫu cũng phải đi đúng đường đó.
 */
export interface GroupFileSeed {
  fileName: string;
  /** `text` sinh tệp .txt từ `content`; `image` sinh ảnh PNG dải màu từ `bands`. */
  kind: 'text' | 'image';
  content?: string;
  bands?: [number, number, number][];
}

export interface GroupPostSeed {
  by: string;
  daysAgo: number;
  hour: number;
  title: string;
  /**
   * Nội dung bài. `@tên_tài_khoản` và `@all` trong đây là đề cập THẬT: seed chạy
   * `matchMentions` của shared trên chuỗi này để sinh thông báo, đúng như backend làm
   * khi người dùng đăng bài. Nhờ vậy dữ liệu mẫu không thể lệch với hành vi thật.
   */
  body: string;
  likedBy: string[];
  comments: { by: string; hoursAfter: number; body: string }[];
  /** Tối đa 3 tệp mỗi bài — đúng ngưỡng MAX_ATTACHMENTS_PER_POST của shared/attachment. */
  files?: GroupFileSeed[];
}

export interface GroupSeed {
  name: string;
  description: string;
  visibility: GroupVisibility;
  requireApproval: boolean;
  daysAgo: number;
  /** Người đầu tiên là người lập nhóm. */
  leaders: string[];
  members: string[];
  pendingRequests: { email: string; message?: string }[];
  rejectedRequests: { email: string; message?: string }[];
  /**
   * Tên các bộ thẻ trong `STUDY_SETS` được chia sẻ vào nhóm.
   *
   * Chủ bộ thẻ BẮT BUỘC là một trong `leaders` — trưởng nhóm chỉ chia sẻ được bộ của
   * chính mình, và seed kiểm lại điều kiện đó rồi mới ghi (xem `seedGroups`).
   */
  studySets: string[];
  /** Có giá trị là nhóm đang bị chặn. Thành viên đọc đúng câu này khi mở nhóm. */
  blockedReason?: string;
  posts: GroupPostSeed[];
}

/** Hai dải màu dùng lại cho ảnh mẫu — không cần mỗi ảnh một bảng màu riêng. */
const BANDS_WARM: [number, number, number][] = [
  [232, 168, 124],
  [214, 132, 96],
  [186, 104, 82],
];
const BANDS_COOL: [number, number, number][] = [
  [140, 176, 214],
  [96, 144, 207],
  [74, 108, 168],
];

export const GROUPS: GroupSeed[] = [
  // 1 — nhóm chính của người học mẫu: hai trưởng nhóm, ba bộ thẻ, đủ cả tệp lẫn ảnh.
  {
    name: 'Lớp K65 — Tiếng Anh chuyên ngành',
    description: 'Nhóm trao đổi bài tập và tài liệu môn Tiếng Anh chuyên ngành lớp K65.',
    visibility: GroupVisibility.PUBLIC,
    requireApproval: true,
    daysAgo: 25,
    leaders: [USER, LAN],
    members: [NAM, CHI, LONG],
    pendingRequests: [{ email: DUY, message: 'Em là sinh viên lớp K65, cho em vào nhóm với ạ.' }],
    rejectedRequests: [{ email: HA, message: 'Cho mình tham gia với.' }],
    studySets: ['IELTS Speaking Part 1', 'Từ vựng công sở của tôi', 'TOEIC Part 5 — Collocations'],
    posts: [
      {
        by: USER,
        daysAgo: 12,
        hour: 21,
        title: 'Lịch nộp bài thuyết trình nhóm',
        body: '@all các nhóm nộp slide thuyết trình trước 23h thứ Sáu tuần này nhé. Mỗi nhóm 10 phút trình bày, 5 phút hỏi đáp.',
        likedBy: [LAN, NAM, CHI],
        comments: [
          { by: NAM, hoursAfter: 1, body: 'Nộp qua email thầy hay nộp lên nhóm vậy bạn?' },
          { by: USER, hoursAfter: 2, body: '@nam.do nộp lên nhóm này luôn nha, mình tổng hợp gửi thầy.' },
        ],
        files: [
          {
            fileName: 'de-cuong-thuyet-trinh-k65.txt',
            kind: 'text',
            content:
              'ĐỀ CƯƠNG THUYẾT TRÌNH — TIẾNG ANH CHUYÊN NGÀNH K65\n\n1. Mở đầu (1 phút): giới thiệu nhóm và chủ đề\n2. Nội dung chính (7 phút): 3 luận điểm, mỗi luận điểm 1 ví dụ thực tế\n3. Kết luận (2 phút)\n4. Hỏi đáp (5 phút)\n\nYêu cầu: slide tối đa 12 trang, cỡ chữ từ 24pt trở lên.',
          },
        ],
      },
      {
        by: LAN,
        daysAgo: 5,
        hour: 20,
        title: 'Chia sẻ bộ thẻ TOEIC Part 5',
        body: 'Mình vừa chia sẻ bộ thẻ "TOEIC Part 5 — Collocations" vào tab Flashcard của nhóm, mọi người vào học thử rồi góp ý giúp mình nhé.',
        likedBy: [USER, CHI],
        comments: [{ by: CHI, hoursAfter: 3, body: 'Bộ này hay quá, mình học được 20 thẻ rồi.' }],
      },
      {
        by: CHI,
        daysAgo: 2,
        hour: 19,
        title: 'Ảnh chụp bảng buổi học hôm nay',
        body: 'Mình chụp lại phần thầy giảng về câu bị động, ai nghỉ hôm nay xem tạm nhé.',
        likedBy: [USER, LAN, NAM],
        comments: [{ by: LONG, hoursAfter: 2, body: 'Cảm ơn bạn, mình nghỉ đúng buổi này.' }],
        files: [{ fileName: 'bang-buoi-hoc-12-11.png', kind: 'image', bands: BANDS_COOL }],
      },
    ],
  },

  // 2 — nhóm vào thẳng, không cần duyệt.
  {
    name: 'CLB IELTS 7.0',
    description: 'Luyện Speaking và Writing mỗi tối, ai muốn nâng band thì vào thẳng không cần duyệt.',
    visibility: GroupVisibility.PUBLIC,
    requireApproval: false,
    daysAgo: 18,
    leaders: [NAM],
    members: [USER, HA, CHI],
    pendingRequests: [],
    rejectedRequests: [],
    studySets: ['Idioms thông dụng'],
    posts: [
      {
        by: NAM,
        daysAgo: 2,
        hour: 19,
        title: 'Đề Writing Task 2 tuần này',
        body: 'Some people believe that university education should be free for everyone. To what extent do you agree or disagree? @all viết rồi đăng bài trong nhóm để cả nhóm chấm chéo nhé.',
        likedBy: [USER, HA],
        comments: [{ by: HA, hoursAfter: 4, body: 'Mình viết xong rồi, tối nay đăng lên nhé.' }],
        files: [
          {
            fileName: 'de-writing-task-2-tuan-45.txt',
            kind: 'text',
            content:
              'WRITING TASK 2 — TUẦN 45\n\nĐề: Some people believe that university education should be free for everyone. To what extent do you agree or disagree?\n\nYêu cầu: tối thiểu 250 từ, 40 phút.\nNộp trước 22h Chủ nhật.',
          },
        ],
      },
    ],
  },

  // 3 — nhóm riêng tư, chỉ vào được bằng mã 8 số.
  {
    name: 'Nhóm ôn thi TOEIC tháng 12',
    description: 'Nhóm riêng tư của phòng Kinh doanh, vào bằng mã nhóm.',
    visibility: GroupVisibility.PRIVATE,
    requireApproval: true,
    daysAgo: 10,
    leaders: [CHI],
    members: [USER, LONG],
    pendingRequests: [{ email: NAM, message: 'Mình cùng phòng, cho mình ôn cùng với.' }],
    rejectedRequests: [{ email: DUY, message: 'Cho mình vào giới thiệu tài liệu ôn thi nhé.' }],
    studySets: ['Tiếng Anh ngành IT'],
    posts: [
      {
        by: CHI,
        daysAgo: 1,
        hour: 12,
        title: 'Mục tiêu 750+',
        body: 'Mỗi người làm 1 đề Listening mỗi ngày và báo điểm ở đây nhé.',
        likedBy: [USER],
        comments: [{ by: USER, hoursAfter: 6, body: 'Hôm nay mình được 380/495 phần nghe.' }],
        files: [
          {
            fileName: 'bang-theo-doi-diem-toeic.txt',
            kind: 'text',
            content:
              'BẢNG THEO DÕI ĐIỂM — THI THỬ TOEIC\n\nNgày | Listening | Reading | Tổng\n-----|-----------|---------|-----\n     |           |         |\n\nGhi điểm sau mỗi đề để thấy xu hướng, không so sánh giữa các thành viên.',
          },
        ],
      },
    ],
  },

  // 4 — nhóm đang bị quản trị viên chặn: thành viên chỉ đọc được lý do.
  {
    name: 'Tài liệu tiếng Anh miễn phí',
    description: 'Chia sẻ tài liệu, khoá học giá tốt.',
    visibility: GroupVisibility.PUBLIC,
    requireApproval: false,
    daysAgo: 14,
    leaders: [DUY],
    members: [LONG],
    pendingRequests: [],
    rejectedRequests: [],
    studySets: [],
    blockedReason:
      'Nhóm liên tục đăng bài quảng cáo bán khoá học và tài liệu có bản quyền. Nhóm tạm thời bị khoá trong lúc quản trị viên xem xét.',
    posts: [
      {
        by: DUY,
        daysAgo: 7,
        hour: 22,
        title: 'Trọn bộ tài liệu IELTS chỉ 99k',
        body: 'Inbox mình để nhận link tải trọn bộ tài liệu.',
        likedBy: [],
        comments: [],
      },
    ],
  },

  // 5
  {
    name: 'Lớp K66 — Tiếng Anh cơ bản',
    description: 'Nhóm của lớp K66, trao đổi bài tập về nhà và lịch kiểm tra.',
    visibility: GroupVisibility.PUBLIC,
    requireApproval: true,
    daysAgo: 22,
    leaders: [LAN],
    members: [USER, DUY, HA],
    pendingRequests: [{ email: LONG, message: 'Em học lớp bên cạnh, cho em tham khảo bài tập với ạ.' }],
    rejectedRequests: [],
    studySets: ['TOEIC Part 5 — Collocations'],
    posts: [
      {
        by: LAN,
        daysAgo: 9,
        hour: 18,
        title: 'Bài tập về nhà tuần 3',
        body: '@all làm hết phần Unit 5 trong sách bài tập, mình gửi kèm đề để tự làm trước.',
        likedBy: [USER, HA, DUY],
        comments: [
          { by: DUY, hoursAfter: 5, body: 'Bài 7 mình ra đáp án khác, bạn xem lại giúp mình nhé @lan.vu' },
        ],
        files: [
          {
            fileName: 'bai-tap-unit-5.txt',
            kind: 'text',
            content:
              'UNIT 5 — PRESENT PERFECT\n\n1. She ____ (live) here since 2019.\n2. I ____ (not/see) him today.\n3. They ____ (just/finish) the report.\n4. ____ you ever ____ (be) to Japan?\n5. We ____ (know) each other for ten years.',
          },
        ],
      },
    ],
  },

  // 6
  {
    name: 'Speaking Club sáng thứ Bảy',
    description: 'Gặp nhau nói tiếng Anh 90 phút mỗi sáng thứ Bảy. Vào thẳng, không cần duyệt.',
    visibility: GroupVisibility.PUBLIC,
    requireApproval: false,
    daysAgo: 20,
    leaders: [HA],
    members: [USER, NAM, CHI, LAN],
    pendingRequests: [],
    rejectedRequests: [],
    studySets: ['Phát âm — cặp âm dễ nhầm'],
    posts: [
      {
        by: HA,
        daysAgo: 4,
        hour: 8,
        title: 'Chủ đề buổi này: Travel',
        body: '@all sáng mai nói về chủ đề Travel. Mình gửi trước danh sách câu hỏi để mọi người chuẩn bị.',
        likedBy: [USER, NAM, LAN],
        comments: [
          { by: LAN, hoursAfter: 2, body: 'Mình đến muộn 15 phút nhé, cứ bắt đầu trước.' },
          { by: NAM, hoursAfter: 6, body: '@ha.le tuần sau đổi chủ đề Work được không bạn?' },
        ],
        files: [
          {
            fileName: 'cau-hoi-speaking-travel.txt',
            kind: 'text',
            content:
              'SPEAKING — TRAVEL\n\n1. Do you like travelling? Why?\n2. Which place has impressed you the most?\n3. Do you prefer travelling alone or with friends?\n4. How has travelling changed in the last ten years?\n5. Should students travel before university?',
          },
          { fileName: 'anh-diem-hen-quan-cafe.png', kind: 'image', bands: BANDS_WARM },
        ],
      },
    ],
  },

  // 7 — hộp yêu cầu có hai người chờ duyệt.
  {
    name: 'Nhóm luyện phát âm IPA',
    description: 'Mỗi tuần một nhóm âm, có ghi âm và nhận xét chéo.',
    visibility: GroupVisibility.PUBLIC,
    requireApproval: true,
    daysAgo: 16,
    leaders: [USER],
    members: [HA, LONG],
    pendingRequests: [{ email: CHI, message: 'Mình phát âm đuôi s hay sai, cho mình vào luyện với.' }],
    rejectedRequests: [],
    studySets: ['IELTS Speaking Part 1'],
    posts: [
      {
        by: USER,
        daysAgo: 6,
        hour: 20,
        title: 'Tuần này luyện âm /θ/ và /ð/',
        body: '@ha.le @long.tran hai bạn ghi âm phần đọc đoạn văn rồi đăng lên nhóm nhé, mình nghe và góp ý.',
        likedBy: [HA, LONG],
        comments: [{ by: HA, hoursAfter: 8, body: 'Mình ghi âm xong rồi, để mai đăng.' }],
        files: [
          {
            fileName: 'doan-van-luyen-am-th.txt',
            kind: 'text',
            content:
              'LUYỆN ÂM /θ/ VÀ /ð/\n\nThirty-three thirsty thieves thought they could breathe through the thin cloth.\nThe weather this Thursday is better than that of the other three days.',
          },
        ],
      },
    ],
  },

  // 8
  {
    name: 'Đọc báo tiếng Anh mỗi ngày',
    description: 'Mỗi ngày một bài báo ngắn, cùng bóc từ mới và tóm tắt lại bằng ba câu.',
    visibility: GroupVisibility.PUBLIC,
    requireApproval: false,
    daysAgo: 19,
    leaders: [LONG],
    members: [USER, LAN, CHI],
    pendingRequests: [],
    rejectedRequests: [],
    studySets: ['Từ vựng đọc báo tiếng Anh'],
    posts: [
      {
        by: LONG,
        daysAgo: 3,
        hour: 7,
        title: 'Bài báo hôm nay và bộ thẻ từ mới',
        body: '@all mình vừa chia sẻ bộ thẻ "Từ vựng đọc báo tiếng Anh" vào nhóm. Đọc bài kèm dưới rồi học thẻ luôn cho nhớ.',
        likedBy: [USER, LAN, CHI],
        comments: [
          { by: LAN, hoursAfter: 4, body: 'Từ "crackdown" mình gặp hoài mà giờ mới hiểu nghĩa.' },
          { by: USER, hoursAfter: 9, body: '@long.tran mai bạn chọn bài về kinh tế nhé.' },
        ],
        files: [
          {
            fileName: 'bai-doc-ngay-15.txt',
            kind: 'text',
            content:
              'CITY UNVEILS NEW BUS NETWORK\n\nThe city yesterday unveiled a plan to redesign its bus network. Officials said coverage would reach three more districts by next June. The plan faced an immediate backlash from drivers, who said the new routes were too long.\n\nTừ cần chú ý: unveil, coverage, backlash.',
          },
        ],
      },
    ],
  },

  // 9 — nhóm riêng tư, hai bộ thẻ của cùng một trưởng nhóm.
  {
    name: 'Nhóm tự học từ vựng 30 ngày',
    description: 'Thử thách riêng tư: 30 ngày liên tục, mỗi ngày 10 từ, ai đứt chuỗi thì mời trà cả nhóm.',
    visibility: GroupVisibility.PRIVATE,
    requireApproval: true,
    daysAgo: 13,
    leaders: [USER],
    members: [NAM, CHI],
    pendingRequests: [{ email: LAN, message: 'Mình tham gia thử thách với được không?' }],
    rejectedRequests: [{ email: DUY }],
    studySets: ['Phrasal verbs hay gặp', 'Từ vựng công sở của tôi'],
    // Cố ý chưa có bài nào: nhóm lập ra để học chứ không để tán gẫu, và bảng tin rỗng
    // cũng là một trạng thái giao diện phải vẽ được.
    posts: [],
  },

  // 10
  {
    name: 'Business English cho người đi làm',
    description: 'Email, họp hành, thuyết trình — tiếng Anh dùng được ngay trong công việc.',
    visibility: GroupVisibility.PUBLIC,
    requireApproval: true,
    daysAgo: 21,
    leaders: [CHI],
    members: [USER, LAN, HA],
    pendingRequests: [{ email: NAM, message: 'Mình cần luyện email cho công việc, xin vào nhóm.' }],
    rejectedRequests: [{ email: DUY, message: 'Mình có khoá học muốn giới thiệu cho nhóm.' }],
    studySets: ['Tiếng Anh ngành IT'],
    posts: [
      {
        by: CHI,
        daysAgo: 5,
        hour: 13,
        title: 'Mẫu email từ chối lịch họp',
        body: 'Mình gửi vài mẫu câu lịch sự để dời hoặc từ chối một cuộc họp mà không làm mất lòng ai.',
        likedBy: [USER, LAN, HA],
        comments: [{ by: HA, hoursAfter: 2, body: 'Câu "Would it be possible to..." dùng được nhiều chỗ thật.' }],
        files: [
          {
            fileName: 'mau-email-doi-lich-hop.txt',
            kind: 'text',
            content:
              'MẪU EMAIL DỜI LỊCH HỌP\n\nSubject: Request to reschedule our meeting\n\nDear [Name],\n\nWould it be possible to move our meeting on Thursday to next Monday? I have a conflicting deadline that afternoon.\n\nPlease let me know a time that works for you.\n\nBest regards,\n[Your name]',
          },
        ],
      },
    ],
  },

  // 11 — hai người chờ duyệt, một bài có cả ảnh lẫn tệp.
  {
    name: 'Nhóm chữa bài Writing Task 1',
    description: 'Chuyên biểu đồ, bảng số liệu và quy trình. Đăng bài lên là có người chữa.',
    visibility: GroupVisibility.PUBLIC,
    requireApproval: true,
    daysAgo: 15,
    leaders: [NAM],
    members: [USER, HA],
    pendingRequests: [
      { email: LAN, message: 'Mình yếu phần mô tả biểu đồ đường, xin vào nhóm ạ.' },
      { email: LONG },
    ],
    rejectedRequests: [],
    studySets: ['Idioms thông dụng'],
    posts: [
      {
        by: NAM,
        daysAgo: 4,
        hour: 20,
        title: 'Biểu đồ tuần này',
        body: '@user @ha.le hai bạn viết mô tả biểu đồ đính kèm, 150 từ, nộp trước Chủ nhật nhé.',
        likedBy: [USER, HA],
        comments: [{ by: USER, hoursAfter: 10, body: 'Mình viết xong, mai gửi.' }],
        files: [
          { fileName: 'bieu-do-tuan-45.png', kind: 'image', bands: BANDS_COOL },
          {
            fileName: 'cau-truc-task-1.txt',
            kind: 'text',
            content:
              'CẤU TRÚC WRITING TASK 1\n\n1. Introduction: diễn đạt lại đề bằng từ khác\n2. Overview: 2 xu hướng nổi bật nhất, KHÔNG có số\n3. Body 1: nhóm số liệu thứ nhất\n4. Body 2: nhóm số liệu còn lại\n\nKhông đưa ý kiến cá nhân vào Task 1.',
          },
        ],
      },
    ],
  },

  // 12
  {
    name: 'Tiếng Anh cho dân IT',
    description: 'Đọc tài liệu kỹ thuật, viết commit message, phỏng vấn bằng tiếng Anh.',
    visibility: GroupVisibility.PUBLIC,
    requireApproval: false,
    daysAgo: 17,
    leaders: [CHI],
    members: [USER, LONG, DUY],
    pendingRequests: [],
    rejectedRequests: [],
    studySets: ['Tiếng Anh ngành IT'],
    posts: [
      {
        by: CHI,
        daysAgo: 6,
        hour: 21,
        title: 'Từ vựng hay gặp khi đọc tài liệu API',
        body: 'Bộ thẻ "Tiếng Anh ngành IT" đã có trong tab Flashcard của nhóm, học trước khi đọc tài liệu sẽ đỡ tra từ điển nhiều.',
        likedBy: [USER, LONG],
        comments: [{ by: LONG, hoursAfter: 5, body: 'Từ "deprecated" mình đọc hoài mà toàn đoán nghĩa.' }],
        files: [
          {
            fileName: 'thuat-ngu-api.txt',
            kind: 'text',
            content:
              'THUẬT NGỮ API\n\ndeprecated — không còn khuyến nghị dùng\nendpoint — điểm cuối, một đường dẫn API\nthrottle — giới hạn tốc độ gọi\npayload — phần dữ liệu gửi kèm\nidempotent — gọi nhiều lần cho cùng kết quả',
          },
        ],
      },
    ],
  },

  // 13
  {
    name: 'Nhóm ôn VSTEP B1',
    description: 'Nhóm riêng tư ôn thi chứng chỉ VSTEP bậc 3, thi tháng sau.',
    visibility: GroupVisibility.PRIVATE,
    requireApproval: true,
    daysAgo: 12,
    leaders: [DUY],
    members: [USER, HA],
    pendingRequests: [{ email: CHI, message: 'Mình cũng thi đợt này, cho mình ôn cùng.' }],
    rejectedRequests: [],
    studySets: ['Từ vựng thi cấp tốc'],
    posts: [
      {
        by: DUY,
        daysAgo: 3,
        hour: 19,
        title: 'Lịch ôn ba tuần cuối',
        body: 'Tuần 1 ôn Reading, tuần 2 Listening, tuần 3 thi thử toàn bộ. Lịch chi tiết ở tệp đính kèm.',
        likedBy: [USER, HA],
        comments: [],
        files: [
          {
            fileName: 'lich-on-vstep-3-tuan.txt',
            kind: 'text',
            content:
              'LỊCH ÔN VSTEP — 3 TUẦN CUỐI\n\nTuần 1: Reading — 4 đề, mỗi đề 60 phút\nTuần 2: Listening — 4 đề + chép chính tả 20 phút/ngày\nTuần 3: thi thử full 2 lần, chữa kỹ phần sai\n\nMỗi tối 21h báo tiến độ trong nhóm.',
          },
        ],
      },
    ],
  },

  // 14 — nhóm đông nhất, năm người.
  {
    name: 'Luyện nghe podcast tiếng Anh',
    description: 'Mỗi tuần một tập podcast, nghe chép chính tả rồi so đáp án.',
    visibility: GroupVisibility.PUBLIC,
    requireApproval: false,
    daysAgo: 23,
    leaders: [HA],
    members: [USER, LAN, NAM, LONG],
    pendingRequests: [],
    rejectedRequests: [],
    studySets: ['Phát âm — cặp âm dễ nhầm'],
    posts: [
      {
        by: HA,
        daysAgo: 7,
        hour: 21,
        title: 'Tập tuần này: 6 Minute English',
        body: '@all nghe hai lần không nhìn transcript, lần ba mới mở ra đối chiếu nhé.',
        likedBy: [USER, LAN, NAM],
        comments: [
          { by: NAM, hoursAfter: 6, body: 'Mình nghe được khoảng 70%, phần cuối họ nói nhanh quá.' },
          { by: USER, hoursAfter: 11, body: '@nam.do phần cuối mình cũng vậy, nghe chậm 0.75x đỡ hơn nhiều.' },
        ],
        files: [
          {
            fileName: 'transcript-6-minute-english.txt',
            kind: 'text',
            content:
              'TRANSCRIPT (rút gọn)\n\nHost: Hello and welcome to 6 Minute English. Today we are talking about sleep.\nGuest: Most adults need between seven and nine hours a night.\nHost: And what happens if we get less than that?\n\n(Bản rút gọn dùng cho dữ liệu thử.)',
          },
        ],
      },
    ],
  },

  // 15
  {
    name: 'Nhóm học phrasal verbs',
    description: 'Mỗi ngày 5 cụm động từ, có ví dụ trong câu và bài tập điền từ.',
    visibility: GroupVisibility.PUBLIC,
    requireApproval: true,
    daysAgo: 11,
    leaders: [USER],
    members: [LAN, CHI],
    pendingRequests: [
      { email: HA, message: 'Mình học phrasal verb hoài mà không nhớ, xin vào nhóm ạ.' },
      { email: NAM },
    ],
    rejectedRequests: [],
    studySets: ['Phrasal verbs hay gặp'],
    posts: [
      {
        by: USER,
        daysAgo: 2,
        hour: 20,
        title: 'Năm cụm hôm nay',
        body: 'Hôm nay học: put off, take up, come across, look into, give up. Bộ thẻ đầy đủ đã có trong tab Flashcard.',
        likedBy: [LAN, CHI],
        comments: [{ by: LAN, hoursAfter: 4, body: 'Mình hay nhầm "look into" với "look after".' }],
        files: [
          {
            fileName: 'bai-tap-phrasal-verbs.txt',
            kind: 'text',
            content:
              'ĐIỀN CỤM ĐỘNG TỪ\n\n1. She ____ the meeting until Friday.\n2. He ____ running last year.\n3. I ____ an old photo yesterday.\n4. The police will ____ the case.\n5. Do not ____ so easily.',
          },
        ],
      },
    ],
  },

  // 16 — nhóm có HAI trưởng nhóm và hai bộ thẻ của hai chủ khác nhau.
  {
    name: 'CLB Debate tiếng Anh',
    description: 'Tranh biện chủ đề xã hội mỗi hai tuần. Có hai trưởng nhóm thay nhau điều phối.',
    visibility: GroupVisibility.PUBLIC,
    requireApproval: true,
    daysAgo: 24,
    leaders: [LAN, NAM],
    members: [USER, CHI],
    pendingRequests: [
      { email: HA, message: 'Mình muốn thử vai người phản biện.' },
      { email: LONG, message: 'Cho mình vào xem trước vài buổi được không?' },
    ],
    rejectedRequests: [],
    studySets: ['TOEIC Part 5 — Collocations', 'Idioms thông dụng'],
    posts: [
      {
        by: LAN,
        daysAgo: 5,
        hour: 19,
        title: 'Chủ đề buổi tới: mạng xã hội và giới trẻ',
        body: '@nam.do bạn điều phối buổi này nhé. @all đọc trước tài liệu tham khảo đính kèm.',
        likedBy: [NAM, USER, CHI],
        comments: [{ by: NAM, hoursAfter: 2, body: 'Ok mình nhận. Ai muốn nhận phe ủng hộ thì nhắn trước.' }],
        files: [
          {
            fileName: 'tai-lieu-debate-mang-xa-hoi.txt',
            kind: 'text',
            content:
              'DEBATE — SOCIAL MEDIA AND YOUNG PEOPLE\n\nPhe ủng hộ: kết nối, cơ hội học tập, tiếng nói cho nhóm yếu thế\nPhe phản đối: nghiện màn hình, so sánh xã hội, tin giả\n\nCấu trúc: mở đầu 2 phút — phản biện 3 phút — kết luận 1 phút',
          },
        ],
      },
    ],
  },

  // 17
  {
    name: 'Nhóm thi thử TOEIC nội bộ',
    description: 'Nhóm riêng tư, tổ chức thi thử mỗi tháng và công bố điểm nội bộ.',
    visibility: GroupVisibility.PRIVATE,
    requireApproval: true,
    daysAgo: 9,
    leaders: [LAN],
    members: [USER, NAM],
    pendingRequests: [{ email: CHI }],
    rejectedRequests: [{ email: LONG, message: 'Cho mình thi ké với.' }],
    studySets: ['TOEIC Part 5 — Collocations'],
    posts: [
      {
        by: LAN,
        daysAgo: 1,
        hour: 9,
        title: 'Kết quả thi thử tháng này',
        body: '@all điểm đã tổng hợp ở tệp đính kèm. Ai muốn xem phần sai chi tiết thì nhắn mình.',
        likedBy: [USER, NAM],
        comments: [{ by: NAM, hoursAfter: 3, body: 'Mình tăng 45 điểm so với tháng trước.' }],
        files: [
          {
            fileName: 'ket-qua-thi-thu-thang-11.txt',
            kind: 'text',
            content:
              'KẾT QUẢ THI THỬ THÁNG 11\n\nThành viên A: 720\nThành viên B: 685\nThành viên C: 750\n\n(Dữ liệu mẫu, không phải điểm thật.)',
          },
        ],
      },
    ],
  },

  // 18 — nhóm chưa có bộ thẻ nào: tab Flashcard phải hiện trạng thái rỗng.
  {
    name: 'Học tiếng Anh qua phim',
    description: 'Mỗi tuần một phim, bóc câu thoại hay và luyện shadowing theo nhân vật.',
    visibility: GroupVisibility.PUBLIC,
    requireApproval: false,
    daysAgo: 8,
    leaders: [LONG],
    members: [USER, HA, DUY],
    pendingRequests: [],
    rejectedRequests: [],
    studySets: [],
    posts: [
      {
        by: LONG,
        daysAgo: 2,
        hour: 22,
        title: 'Phim tuần này và danh sách câu thoại',
        body: 'Xem xong thì chọn ba câu thoại thích nhất, luyện shadowing rồi đăng lên nhóm nhé.',
        likedBy: [USER, HA],
        comments: [{ by: DUY, hoursAfter: 7, body: 'Phim này thoại nhanh nhưng phát âm rõ, dễ bắt chước.' }],
        files: [
          {
            fileName: 'cau-thoai-hay-tuan-nay.txt',
            kind: 'text',
            content:
              'CÂU THOẠI ĐÁNG HỌC\n\n1. "It is not about the destination, it is about the ride."\n2. "You are not stuck, you are just committed to old patterns."\n3. "Say it again, but mean it this time."',
          },
        ],
      },
    ],
  },

  // 19 — nhóm nhỏ nhất: một trưởng nhóm, một thành viên.
  {
    name: 'Nhóm hỗ trợ người mất gốc',
    description: 'Không phán xét, hỏi gì cũng được. Bắt đầu lại từ bảng chữ cái cũng không sao.',
    visibility: GroupVisibility.PUBLIC,
    requireApproval: true,
    daysAgo: 6,
    leaders: [HA],
    members: [DUY],
    pendingRequests: [{ email: LONG, message: 'Mình học lại từ đầu sau 10 năm, xin vào nhóm ạ.' }],
    rejectedRequests: [],
    studySets: [],
    posts: [
      {
        by: HA,
        daysAgo: 1,
        hour: 20,
        title: 'Bắt đầu từ đâu nếu mất gốc hoàn toàn?',
        body: '@all mình gợi ý lộ trình 4 tuần đầu ở tệp đính kèm. Đừng học ngữ pháp nâng cao ngay, cứ 300 từ thông dụng trước đã.',
        likedBy: [DUY],
        comments: [{ by: DUY, hoursAfter: 5, body: 'Đọc xong thấy đỡ hoang mang hẳn. Cảm ơn bạn @ha.le' }],
        files: [
          {
            fileName: 'lo-trinh-4-tuan-dau.txt',
            kind: 'text',
            content:
              'LỘ TRÌNH 4 TUẦN ĐẦU\n\nTuần 1: bảng phiên âm IPA, 50 từ thông dụng\nTuần 2: thì hiện tại đơn, 100 từ\nTuần 3: câu hỏi cơ bản, 100 từ\nTuần 4: nghe hội thoại chậm 10 phút/ngày\n\nMỗi ngày 20 phút, đều còn hơn nhiều.',
          },
        ],
      },
    ],
  },

  // 20 — nhóm bị chặn thứ hai, và là nhóm chỉ có đúng một người.
  {
    name: 'Bán tài liệu & khoá học giá sỉ',
    description: 'Nhận đặt tài liệu photo, khoá học chia sẻ tài khoản.',
    visibility: GroupVisibility.PUBLIC,
    requireApproval: false,
    daysAgo: 5,
    leaders: [DUY],
    members: [],
    pendingRequests: [],
    rejectedRequests: [],
    studySets: [],
    blockedReason:
      'Nhóm được lập ra để rao bán tài liệu có bản quyền và tài khoản khoá học dùng chung. Đây không phải hoạt động học tập, nhóm bị khoá cho tới khi trưởng nhóm đổi hẳn mục đích sử dụng.',
    // Bị chặn ngay khi vừa lập, chưa kịp đăng bài nào — trường hợp quản trị viên cần
    // nhìn thấy: chặn dựa trên mô tả nhóm chứ không đợi tới lúc có nội dung vi phạm.
    posts: [],
  },
];
