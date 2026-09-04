/**
 * Nội dung mẫu cho diễn đàn Cộng đồng.
 *
 * Tách khỏi `seed.ts` vì đây là văn bản dài, để lẫn vào sẽ làm chìm phần logic seed.
 * Cùng cách làm với `seed-data/content.ts` (chủ đề và từ vựng).
 *
 * `author` và `by` là CHỈ SỐ trong mảng người dùng mà `seed.ts` dựng ra, không phải id
 * trong DB — id chỉ có sau khi tạo tài khoản. Chỉ số 0 luôn là quản trị viên.
 */

/** Người tham gia diễn đàn, ngoài ba tài khoản mặc định. Chỉ số 0 dành cho quản trị viên. */
export const COMMUNITY_MEMBERS = [
  { email: 'long.tran@enghabit.com', name: 'Trần Bảo Long' },
  { email: 'ha.le@enghabit.com', name: 'Lê Thu Hà' },
  { email: 'duy.pham@enghabit.com', name: 'Phạm Quốc Duy' },
  { email: 'lan.vu@enghabit.com', name: 'Vũ Ngọc Lan' },
  { email: 'nam.do@enghabit.com', name: 'Đỗ Hoàng Nam' },
  { email: 'chi.bui@enghabit.com', name: 'Bùi Khánh Chi' },
] as const;

export interface CommentSeed {
  /** Chỉ số người viết trong mảng người dùng. 0 = quản trị viên. */
  by: number;
  /** Số giờ sau khi bài được đăng. */
  hoursAfter: number;
  body: string;
}

export interface PostSeed {
  by: number;
  daysAgo: number;
  hour: number;
  title: string;
  body: string;
  /** Chỉ số những người đã thả tim. */
  likedBy: number[];
  comments: CommentSeed[];
  /** Tệp đính kèm dạng văn bản. Ảnh được sinh riêng trong seed.ts. */
  textFile?: { fileName: string; content: string };
  /** Đính kèm một ảnh mẫu do seed sinh ra. */
  image?: { fileName: string; bands: [number, number, number][] };
}

/**
 * Mười bài đăng, xếp từ cũ tới mới.
 *
 * Cố ý pha trộn: có câu hỏi ngữ pháp, câu hỏi phương pháp, bài chia sẻ kinh nghiệm và
 * bài than phiền mất động lực — để giao diện diễn đàn hiện ra đủ các dạng nội dung
 * thật sẽ gặp, chứ không phải mười biến thể của cùng một kiểu bài.
 */
export const POSTS: PostSeed[] = [
  {
    by: 1,
    daysAgo: 19,
    hour: 20,
    title: 'Làm sao để nhớ từ vựng lâu?',
    body: 'Mình học được khoảng 20 từ mỗi ngày nhưng hôm sau kiểm tra lại thì quên gần hết. Mọi người có cách nào ghi nhớ lâu hơn không ạ? Mình đang chép tay ra vở mỗi từ 5 lần mà vẫn không ăn thua.',
    likedBy: [2, 3, 4, 5],
    comments: [
      {
        by: 2,
        hoursAfter: 2,
        body: 'Chép nhiều lần chỉ giúp nhớ trong ngày thôi bạn. Bạn thử ôn lại theo lịch giãn dần xem, hôm sau ôn một lần, ba hôm sau ôn lại, rồi một tuần. Mình dùng phần flashcard trong app này, nó tự tính ngày ôn nên không phải nhớ.',
      },
      {
        by: 0,
        hoursAfter: 5,
        body: 'Bổ sung ý của bạn Hà: mục Ôn tập của hệ thống chạy theo thuật toán SM-2, từ nào bạn đánh giá là khó sẽ quay lại sớm hơn. Bạn cứ đánh giá thật lòng lúc ôn, đừng bấm "nhớ rõ" cho nhanh, không thì lịch ôn sẽ sai.',
      },
      {
        by: 4,
        hoursAfter: 26,
        body: 'Mình thấy đặt từ vào câu của chính mình dễ nhớ hơn hẳn học từ đơn lẻ. Ví dụ học từ "commute" thì viết luôn "I commute to school by bus every day".',
      },
    ],
  },
  {
    by: 3,
    daysAgo: 17,
    hour: 21,
    title: 'Phân biệt "used to" và "be used to" thế nào ạ?',
    body: 'Hai cấu trúc này mình cứ nhầm mãi. Có ai giải thích ngắn gọn giúp mình với, đọc sách ngữ pháp thấy dài quá mà vẫn không vào đầu.',
    likedBy: [1, 5],
    comments: [
      {
        by: 5,
        hoursAfter: 3,
        body: '"used to + V" là thói quen trong quá khứ, giờ không còn: I used to smoke (trước hút thuốc, giờ bỏ rồi). Còn "be used to + V-ing/N" là đã quen với việc gì: I am used to waking up early (đã quen dậy sớm).',
      },
      {
        by: 3,
        hoursAfter: 4,
        body: 'À hiểu rồi, cảm ơn bạn! Vậy "get used to" là đang trong quá trình quen dần đúng không?',
      },
      {
        by: 5,
        hoursAfter: 5,
        body: 'Chuẩn rồi đó. "I am getting used to the weather here" = đang quen dần với thời tiết.',
      },
    ],
  },
  {
    by: 2,
    daysAgo: 15,
    hour: 19,
    title: 'Phim hay kênh nào luyện nghe tốt cho người mới bắt đầu?',
    body: 'Mình nghe podcast của người bản xứ thì không kịp, họ nói nhanh quá. Mọi người gợi ý giúp mình nguồn nào nói chậm và có phụ đề để bắt đầu với ạ.',
    likedBy: [1, 3, 4, 6],
    comments: [
      {
        by: 6,
        hoursAfter: 6,
        body: 'Bạn thử phim hoạt hình trước, lời thoại đơn giản và phát âm rõ. Mình bắt đầu từ mấy phim hoạt hình cho thiếu nhi, xem lần đầu có phụ đề tiếng Việt, lần hai phụ đề tiếng Anh, lần ba tắt hẳn.',
      },
      {
        by: 1,
        hoursAfter: 20,
        body: 'Mẹo của mình là chọn nội dung mình đã biết trước nội dung. Xem lại phim đã xem rồi bằng tiếng Anh thì dễ đoán hơn nhiều vì mình nhớ tình tiết.',
      },
    ],
  },
  {
    by: 4,
    daysAgo: 13,
    hour: 22,
    title: 'Nghỉ hai tuần là quên sạch, làm sao lấy lại đà?',
    body: 'Mình học đều được gần một tháng, rồi bận thi nên nghỉ hai tuần. Giờ quay lại thấy nản kinh khủng, mở app ra là thấy chuỗi về 0. Có ai từng như vậy không, mọi người vượt qua kiểu gì ạ?',
    likedBy: [1, 2, 3, 5, 6],
    comments: [
      {
        by: 1,
        hoursAfter: 1,
        body: 'Mình bị y hệt hồi tháng trước. Kinh nghiệm là đừng cố học lại 20 từ/ngày như cũ ngay, sẽ đuối và bỏ tiếp. Mình hạ xuống 5 từ/ngày trong một tuần cho quen tay đã.',
      },
      {
        by: 0,
        hoursAfter: 9,
        body: 'Bạn vào mục Mục tiêu hạ chỉ tiêu xuống mức dễ giữ nhé, không có gì phải ngại cả. Chuỗi về 0 chỉ là con số, thứ đáng giá là số ngày bạn đã học nằm trong phần Báo cáo, cái đó không mất đi đâu.',
      },
      {
        by: 6,
        hoursAfter: 30,
        body: 'Mình còn mua vật phẩm giữ chuỗi để phòng những hôm bận đột xuất. Không cứu được nếu nghỉ dài nhưng đỡ được hôm lỡ quên.',
      },
    ],
  },
  {
    by: 5,
    daysAgo: 11,
    hour: 20,
    title: 'Chia sẻ: cách mình giữ được chuỗi 100 ngày',
    body: 'Hôm nay chuỗi của mình tròn 100 ngày nên viết lại vài thứ đã giúp mình, biết đâu có ích cho ai đó.\n\n1. Đặt mục tiêu nhỏ tới mức không thể viện cớ. Mình để 5 từ/ngày, làm xong trong 4 phút. Hôm nào rảnh thì học thêm, nhưng 5 từ là đã tính hoàn thành.\n\n2. Gắn việc học vào một việc sẵn có. Mình học ngay sau khi pha xong cốc cà phê sáng, không cần nhớ gì cả vì cà phê thì ngày nào cũng pha.\n\n3. Đặt nhắc nhở hai mốc: 7h30 và 21h. Mốc tối là lưới an toàn cho những hôm sáng lỡ.\n\n4. Không học bù. Hôm qua quên thì hôm nay vẫn 5 từ, không phải 10. Học bù là cách nhanh nhất để thấy việc học thành gánh nặng.',
    likedBy: [1, 2, 3, 4, 6],
    comments: [
      {
        by: 3,
        hoursAfter: 2,
        body: 'Ý số 4 hay thật, mình toàn tự bắt học bù rồi đuối. Cảm ơn bạn đã chia sẻ!',
      },
      {
        by: 0,
        hoursAfter: 8,
        body: 'Cảm ơn bạn Nam, bài viết rất đáng đọc. Ý "gắn vào việc sẵn có" đúng là cách hiệu quả nhất để hình thành thói quen mới.',
      },
      {
        by: 2,
        hoursAfter: 27,
        body: 'Cho mình hỏi 5 từ/ngày thì sau 100 ngày bạn thấy vốn từ khá lên rõ không ạ?',
      },
      {
        by: 5,
        hoursAfter: 29,
        body: 'Khoảng 400 từ thật sự dùng được bạn ạ, tại có từ trùng và từ mình bỏ. Nhưng quan trọng hơn là giờ mình không phải "quyết tâm" nữa, tới giờ là tự động làm thôi.',
      },
    ],
  },
  {
    by: 6,
    daysAgo: 9,
    hour: 21,
    title: 'Có cần phát âm chuẩn âm cuối không ạ?',
    body: 'Mình nói chuyện với bạn nước ngoài thì họ vẫn hiểu dù mình nuốt âm cuối. Vậy có cần cố sửa không hay cứ để vậy cũng được?',
    likedBy: [2, 4],
    comments: [
      {
        by: 4,
        hoursAfter: 4,
        body: 'Nên sửa bạn ạ. Nhiều cặp từ chỉ khác nhau ở âm cuối thôi: "like" với "light", "card" với "cart". Trong câu dài người nghe đoán được nhưng khi nói tên riêng hay số liệu thì dễ nhầm.',
      },
      {
        by: 1,
        hoursAfter: 22,
        body: 'Thêm nữa là âm cuối quyết định số ít số nhiều và thì quá khứ. Nuốt mất "s" hay "ed" là người nghe hiểu sai thời điểm luôn.',
      },
    ],
  },
  {
    by: 1,
    daysAgo: 7,
    hour: 20,
    title: 'Nên học từ vựng theo chủ đề hay theo tần suất sử dụng?',
    body: 'Mình thấy có hai trường phái: một bên bảo học theo chủ đề cho dễ liên tưởng, một bên bảo học theo danh sách từ hay gặp nhất. Mọi người theo cách nào ạ?',
    likedBy: [3, 5, 6],
    comments: [
      {
        by: 5,
        hoursAfter: 3,
        body: 'Mình nghĩ tuỳ mục đích. Cần dùng ngay trong công việc thì học theo chủ đề của ngành mình. Còn muốn đọc hiểu nói chung thì danh sách tần suất hiệu quả hơn vì 2000 từ đầu đã phủ phần lớn văn bản thường gặp.',
      },
      {
        by: 0,
        hoursAfter: 11,
        body: 'Các chủ đề trong mục Từ vựng của hệ thống được xếp theo trình độ từ cơ bản tới nâng cao, nên phần cơ bản cũng gần trùng với nhóm từ hay gặp nhất. Bạn cứ đi tuần tự là ổn.',
      },
    ],
  },
  {
    by: 2,
    daysAgo: 5,
    hour: 19,
    title: 'Chia sẻ mẫu sổ ghi từ mới của mình',
    body: 'Mình ghi mỗi từ theo bốn dòng: từ, phiên âm, nghĩa, và một câu tự đặt. Quan trọng nhất là câu tự đặt, phải liên quan tới đời sống của mình thì mới nhớ được.\n\nMình đính kèm danh sách từ tuần này để mọi người tham khảo cách ghi nhé.',
    likedBy: [1, 3, 4],
    textFile: {
      fileName: 'so-tu-vung-tuan-nay.txt',
      content: [
        'SỔ TỪ VỰNG — TUẦN NÀY',
        '',
        '1. commute /kəˈmjuːt/ — đi lại giữa nhà và nơi làm việc',
        '   I commute to the office by bus every morning.',
        '',
        '2. deadline /ˈdedlaɪn/ — hạn chót',
        '   The deadline for this report is Friday afternoon.',
        '',
        '3. overwhelmed /ˌəʊvəˈwelmd/ — bị quá tải, choáng ngợp',
        '   I felt overwhelmed by the amount of homework last week.',
        '',
        '4. consistent /kənˈsɪstənt/ — đều đặn, nhất quán',
        '   Being consistent matters more than studying for many hours.',
        '',
        '5. curious /ˈkjʊəriəs/ — tò mò, ham tìm hiểu',
        '   She is curious about how other people learn languages.',
      ].join('\n'),
    },
    comments: [
      {
        by: 4,
        hoursAfter: 5,
        body: 'Cảm ơn bạn, mình hay ghi mỗi nghĩa nên học xong không biết dùng thế nào. Sẽ thử thêm câu tự đặt.',
      },
      {
        by: 3,
        hoursAfter: 25,
        body: 'Mình thêm một cột nữa là "từ dễ nhầm", ví dụ ghi "affect" thì ghi kèm "effect" để phân biệt luôn.',
      },
    ],
  },
  {
    by: 3,
    daysAgo: 3,
    hour: 22,
    title: 'Thì hiện tại hoàn thành: mình hay sai chỗ nào?',
    body: 'Mình làm bài quiz phần thì hiện tại hoàn thành toàn sai. Cứ thấy có "yesterday" hay "last week" là mình vẫn dùng "have done". Ai giải thích giúp mình quy tắc dễ nhớ với ạ.',
    likedBy: [1, 2, 5, 6],
    comments: [
      {
        by: 1,
        hoursAfter: 2,
        body: 'Mẹo đơn giản: hiện tại hoàn thành không đi với mốc thời gian đã kết thúc. "yesterday", "last week", "in 2020" đều là mốc đã xong nên phải dùng quá khứ đơn.',
      },
      {
        by: 6,
        hoursAfter: 12,
        body: 'Mình nhớ theo kiểu này: hiện tại hoàn thành là chuyện quá khứ nhưng còn liên quan tới bây giờ. "I have lost my keys" nghĩa là giờ vẫn chưa tìm thấy. Còn "I lost my keys yesterday" thì chỉ kể lại, có thể đã tìm thấy rồi.',
      },
      {
        by: 3,
        hoursAfter: 14,
        body: 'Cách của bạn Chi dễ hình dung quá, cảm ơn cả nhà!',
      },
    ],
  },
  {
    by: 4,
    daysAgo: 1,
    hour: 20,
    title: 'Nên học ngữ pháp trước hay tập nói trước?',
    body: 'Mình học ngữ pháp khá ổn, làm bài tập điểm cao, nhưng tới lúc nói thì đứng hình vì mải nghĩ đúng sai. Có nên tạm gác ngữ pháp lại để tập nói trước không ạ?',
    likedBy: [2, 5],
    image: {
      fileName: 'ket-qua-quiz-cua-minh.png',
      bands: [
        [142, 145, 65],
        [90, 73, 92],
        [214, 217, 160],
      ],
    },
    comments: [
      {
        by: 5,
        hoursAfter: 3,
        body: 'Không phải gác lại, mà đổi cách dùng. Ngữ pháp nên học để nhận ra khi nghe/đọc, còn lúc nói thì kệ nó đã. Nói sai mà người ta hiểu vẫn tốt hơn là im lặng vì sợ sai.',
      },
      {
        by: 2,
        hoursAfter: 16,
        body: 'Mình từng y hệt bạn. Cách mình thoát ra là tự nói một mình mỗi tối 5 phút, kể lại hôm nay làm gì. Không ai nghe nên không ngại, mà vẫn quen miệng.',
      },
    ],
  },
];
