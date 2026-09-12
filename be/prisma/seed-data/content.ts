import { VocabLevel } from '@prisma/client';

/**
 * Nội dung học tập mẫu: chủ đề và từ vựng.
 *
 * Tách khỏi seed.ts để seed.ts chỉ lo logic ghi DB, còn nội dung sửa ở đây —
 * dễ thêm chủ đề mới mà không đụng vào code.
 *
 * Không còn câu hỏi quiz soạn tay ở đây: đề Kiểm tra (chế độ "Exam") giờ sinh tự động
 * từ chính từ vựng bên dưới, xem be/src/modules/lessons/exam.service.ts.
 */

export interface WordSeed {
  word: string;
  meaning: string;
  phonetic: string;
  example: string;
}

export interface TopicSeed {
  name: string;
  description: string;
  level: VocabLevel;
  words: WordSeed[];
}

export const TOPICS: TopicSeed[] = [
  {
    name: 'Daily Conversation',
    description: 'Từ vựng giao tiếp hằng ngày, dùng trong các tình huống thường gặp',
    level: VocabLevel.BEGINNER,
    words: [
      { word: 'greeting', meaning: 'lời chào', phonetic: '/ˈɡriːtɪŋ/', example: 'She gave me a warm greeting at the door.' },
      { word: 'appointment', meaning: 'cuộc hẹn', phonetic: '/əˈpɔɪntmənt/', example: 'I have an appointment with the dentist at 3pm.' },
      { word: 'grocery', meaning: 'hàng tạp hoá', phonetic: '/ˈɡroʊsəri/', example: 'She went grocery shopping after work.' },
      { word: 'neighbour', meaning: 'hàng xóm', phonetic: '/ˈneɪbər/', example: 'My neighbour helped me carry the boxes.' },
      { word: 'weather', meaning: 'thời tiết', phonetic: '/ˈweðər/', example: 'The weather is lovely this morning.' },
      { word: 'apologise', meaning: 'xin lỗi', phonetic: '/əˈpɒlədʒaɪz/', example: 'He apologised for being late.' },
      { word: 'borrow', meaning: 'mượn', phonetic: '/ˈbɒroʊ/', example: 'Can I borrow your pen for a moment?' },
      { word: 'schedule', meaning: 'lịch trình', phonetic: '/ˈskedʒuːl/', example: 'My schedule is quite full this week.' },
    ],
  },
  {
    name: 'Business English',
    description: 'Từ vựng dùng trong môi trường công sở, họp hành và email công việc',
    level: VocabLevel.INTERMEDIATE,
    words: [
      { word: 'deadline', meaning: 'hạn chót', phonetic: '/ˈdedlaɪn/', example: 'We must meet the deadline by Friday.' },
      { word: 'negotiate', meaning: 'đàm phán', phonetic: '/nɪˈɡoʊʃieɪt/', example: 'They negotiated a better contract.' },
      { word: 'stakeholder', meaning: 'bên liên quan', phonetic: '/ˈsteɪkhoʊldər/', example: 'Please inform all stakeholders of the change.' },
      { word: 'revenue', meaning: 'doanh thu', phonetic: '/ˈrevənuː/', example: 'Annual revenue grew by 12 percent.' },
      { word: 'invoice', meaning: 'hoá đơn', phonetic: '/ˈɪnvɔɪs/', example: 'We sent the invoice last Monday.' },
      { word: 'recruit', meaning: 'tuyển dụng', phonetic: '/rɪˈkruːt/', example: 'We plan to recruit five engineers.' },
      { word: 'agenda', meaning: 'chương trình nghị sự', phonetic: '/əˈdʒendə/', example: 'The agenda was sent before the meeting.' },
      { word: 'outsource', meaning: 'thuê ngoài', phonetic: '/ˈaʊtsɔːrs/', example: 'They outsource customer support.' },
    ],
  },
  {
    name: 'Travel & Transportation',
    description: 'Từ vựng khi đi du lịch, sân bay, khách sạn và phương tiện di chuyển',
    level: VocabLevel.BEGINNER,
    words: [
      { word: 'departure', meaning: 'sự khởi hành', phonetic: '/dɪˈpɑːrtʃər/', example: 'The departure time is 7:45am.' },
      { word: 'luggage', meaning: 'hành lý', phonetic: '/ˈlʌɡɪdʒ/', example: 'My luggage was too heavy.' },
      { word: 'boarding pass', meaning: 'thẻ lên máy bay', phonetic: '/ˈbɔːrdɪŋ pæs/', example: 'Please show your boarding pass.' },
      { word: 'reservation', meaning: 'sự đặt chỗ', phonetic: '/ˌrezərˈveɪʃn/', example: 'I made a reservation for two nights.' },
      { word: 'delay', meaning: 'sự trì hoãn', phonetic: '/dɪˈleɪ/', example: 'The flight had a two-hour delay.' },
      { word: 'itinerary', meaning: 'lịch trình chuyến đi', phonetic: '/aɪˈtɪnəreri/', example: 'Our itinerary includes three cities.' },
      { word: 'currency', meaning: 'tiền tệ', phonetic: '/ˈkʌrənsi/', example: 'You can exchange currency at the airport.' },
      { word: 'destination', meaning: 'điểm đến', phonetic: '/ˌdestɪˈneɪʃn/', example: 'Our final destination is Da Nang.' },
    ],
  },
  {
    name: 'Technology & Internet',
    description: 'Từ vựng công nghệ, máy tính và Internet thường gặp',
    level: VocabLevel.INTERMEDIATE,
    words: [
      { word: 'password', meaning: 'mật khẩu', phonetic: '/ˈpæswɜːrd/', example: 'Choose a strong password.' },
      { word: 'download', meaning: 'tải xuống', phonetic: '/ˈdaʊnloʊd/', example: 'The download finished in a minute.' },
      { word: 'browser', meaning: 'trình duyệt', phonetic: '/ˈbraʊzər/', example: 'Open the link in another browser.' },
      { word: 'backup', meaning: 'bản sao lưu', phonetic: '/ˈbækʌp/', example: 'Always keep a backup of your data.' },
      { word: 'encrypt', meaning: 'mã hoá', phonetic: '/ɪnˈkrɪpt/', example: 'The app encrypts all messages.' },
      { word: 'bandwidth', meaning: 'băng thông', phonetic: '/ˈbændwɪdθ/', example: 'Video calls use a lot of bandwidth.' },
      { word: 'update', meaning: 'bản cập nhật', phonetic: '/ˈʌpdeɪt/', example: 'A security update is available.' },
      { word: 'device', meaning: 'thiết bị', phonetic: '/dɪˈvaɪs/', example: 'You can use the app on any device.' },
    ],
  },
  {
    name: 'Academic Writing',
    description: 'Từ vựng học thuật dùng trong bài luận, báo cáo và nghiên cứu',
    level: VocabLevel.ADVANCED,
    words: [
      { word: 'hypothesis', meaning: 'giả thuyết', phonetic: '/haɪˈpɒθəsɪs/', example: 'The hypothesis was supported by the data.' },
      { word: 'methodology', meaning: 'phương pháp luận', phonetic: '/ˌmeθəˈdɒlədʒi/', example: 'Chapter three explains the methodology.' },
      { word: 'significant', meaning: 'có ý nghĩa, đáng kể', phonetic: '/sɪɡˈnɪfɪkənt/', example: 'There was a significant difference between groups.' },
      { word: 'conclude', meaning: 'kết luận', phonetic: '/kənˈkluːd/', example: 'We conclude that the method is effective.' },
      { word: 'literature review', meaning: 'tổng quan tài liệu', phonetic: '/ˈlɪtrətʃər rɪˈvjuː/', example: 'The literature review covers ten years of research.' },
      { word: 'empirical', meaning: 'thực nghiệm', phonetic: '/ɪmˈpɪrɪkl/', example: 'The claim lacks empirical evidence.' },
      { word: 'framework', meaning: 'khung lý thuyết', phonetic: '/ˈfreɪmwɜːrk/', example: 'We adopted a theoretical framework.' },
      { word: 'limitation', meaning: 'hạn chế', phonetic: '/ˌlɪmɪˈteɪʃn/', example: 'One limitation is the small sample size.' },
    ],
  },
];
