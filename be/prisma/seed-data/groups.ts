import { GroupVisibility } from '@prisma/client';
import { LEARNER_EMAIL } from './library.js';

/**
 * Nhóm lớp mẫu cho màn Nhóm lớp (người học) và Quản lý nhóm (quản trị viên).
 *
 * Người dùng ghi bằng EMAIL — id chỉ có sau khi seed tạo tài khoản. Phủ đủ các trạng
 * thái: nhóm công khai cần duyệt, nhóm vào thẳng, nhóm riêng tư, nhóm đang bị chặn;
 * yêu cầu xin vào đang chờ và đã bị từ chối; nhóm có nhiều trưởng nhóm.
 */

export interface GroupPostSeed {
  by: string;
  daysAgo: number;
  hour: number;
  title: string;
  body: string;
  likedBy: string[];
  comments: { by: string; hoursAfter: number; body: string }[];
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
  /** Có giá trị là nhóm đang bị chặn. Thành viên đọc đúng câu này khi mở nhóm. */
  blockedReason?: string;
  posts: GroupPostSeed[];
}

export const GROUPS: GroupSeed[] = [
  {
    name: 'Lớp K65 — Tiếng Anh chuyên ngành',
    description: 'Nhóm trao đổi bài tập và tài liệu môn Tiếng Anh chuyên ngành lớp K65.',
    visibility: GroupVisibility.PUBLIC,
    requireApproval: true,
    daysAgo: 25,
    leaders: [LEARNER_EMAIL, 'lan.vu@enghabit.com'],
    members: ['nam.do@enghabit.com', 'chi.bui@enghabit.com', 'long.tran@enghabit.com'],
    pendingRequests: [{ email: 'duy.pham@enghabit.com', message: 'Em là sinh viên lớp K65, cho em vào nhóm với ạ.' }],
    rejectedRequests: [{ email: 'ha.le@enghabit.com', message: 'Cho mình tham gia với.' }],
    posts: [
      {
        by: LEARNER_EMAIL,
        daysAgo: 12,
        hour: 21,
        title: 'Lịch nộp bài thuyết trình nhóm',
        body: 'Các nhóm nộp slide thuyết trình trước 23h thứ Sáu tuần này nhé. Mỗi nhóm 10 phút trình bày, 5 phút hỏi đáp.',
        likedBy: ['lan.vu@enghabit.com', 'nam.do@enghabit.com', 'chi.bui@enghabit.com'],
        comments: [
          { by: 'nam.do@enghabit.com', hoursAfter: 1, body: 'Nộp qua email thầy hay nộp lên nhóm vậy bạn?' },
          { by: LEARNER_EMAIL, hoursAfter: 2, body: 'Nộp lên nhóm này luôn nha, mình tổng hợp gửi thầy.' },
        ],
      },
      {
        by: 'lan.vu@enghabit.com',
        daysAgo: 5,
        hour: 20,
        title: 'Chia sẻ bộ thẻ TOEIC Part 5',
        body: 'Mình vừa tạo bộ thẻ "TOEIC Part 5 — Collocations" trong Thư viện, mọi người vào học thử rồi góp ý giúp mình nhé.',
        likedBy: [LEARNER_EMAIL, 'chi.bui@enghabit.com'],
        comments: [{ by: 'chi.bui@enghabit.com', hoursAfter: 3, body: 'Bộ này hay quá, mình học được 20 thẻ rồi.' }],
      },
    ],
  },
  {
    name: 'CLB IELTS 7.0',
    description: 'Luyện Speaking và Writing mỗi tối, ai muốn nâng band thì vào thẳng không cần duyệt.',
    visibility: GroupVisibility.PUBLIC,
    requireApproval: false,
    daysAgo: 18,
    leaders: ['nam.do@enghabit.com'],
    members: [LEARNER_EMAIL, 'ha.le@enghabit.com', 'chi.bui@enghabit.com'],
    pendingRequests: [],
    rejectedRequests: [],
    posts: [
      {
        by: 'nam.do@enghabit.com',
        daysAgo: 2,
        hour: 19,
        title: 'Đề Writing Task 2 tuần này',
        body: 'Some people believe that university education should be free for everyone. To what extent do you agree or disagree? Mọi người viết rồi đăng bài trong nhóm để cả nhóm chấm chéo nhé.',
        likedBy: [LEARNER_EMAIL, 'ha.le@enghabit.com'],
        comments: [
          { by: 'ha.le@enghabit.com', hoursAfter: 4, body: 'Mình viết xong rồi, tối nay đăng lên nhé.' },
        ],
      },
    ],
  },
  {
    name: 'Nhóm ôn thi TOEIC tháng 12',
    description: 'Nhóm riêng tư của phòng Kinh doanh, vào bằng mã nhóm.',
    visibility: GroupVisibility.PRIVATE,
    requireApproval: true,
    daysAgo: 10,
    leaders: ['chi.bui@enghabit.com'],
    members: [LEARNER_EMAIL, 'long.tran@enghabit.com'],
    pendingRequests: [{ email: 'nam.do@enghabit.com', message: 'Mình cùng phòng, cho mình ôn cùng với.' }],
    rejectedRequests: [],
    posts: [
      {
        by: 'chi.bui@enghabit.com',
        daysAgo: 1,
        hour: 12,
        title: 'Mục tiêu 750+',
        body: 'Mỗi người làm 1 đề Listening mỗi ngày và báo điểm ở đây nhé.',
        likedBy: [LEARNER_EMAIL],
        comments: [{ by: LEARNER_EMAIL, hoursAfter: 6, body: 'Hôm nay mình được 380/495 phần nghe.' }],
      },
    ],
  },
  {
    name: 'Tài liệu tiếng Anh miễn phí',
    description: 'Chia sẻ tài liệu, khoá học giá tốt.',
    visibility: GroupVisibility.PUBLIC,
    requireApproval: false,
    daysAgo: 14,
    leaders: ['duy.pham@enghabit.com'],
    members: ['long.tran@enghabit.com'],
    pendingRequests: [],
    rejectedRequests: [],
    blockedReason:
      'Nhóm liên tục đăng bài quảng cáo bán khoá học và tài liệu có bản quyền. Nhóm tạm thời bị khoá trong lúc quản trị viên xem xét.',
    posts: [
      {
        by: 'duy.pham@enghabit.com',
        daysAgo: 7,
        hour: 22,
        title: 'Trọn bộ tài liệu IELTS chỉ 99k',
        body: 'Inbox mình để nhận link tải trọn bộ tài liệu.',
        likedBy: [],
        comments: [],
      },
    ],
  },
];
