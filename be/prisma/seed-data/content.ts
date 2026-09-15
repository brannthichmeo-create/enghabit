import { VocabLevel } from '@prisma/client';

/**
 * Nội dung học tập mẫu: chủ đề và từ vựng.
 *
 * Tách khỏi seed.ts để seed.ts chỉ lo logic ghi DB, còn nội dung sửa ở đây —
 * dễ thêm chủ đề mới mà không đụng vào code.
 *
 * Đây là các bộ thẻ "Hệ thống" (ownerId null). Bộ thẻ do người học tự tạo nằm ở
 * `seed-data/library.ts`. Câu trắc nghiệm sinh tự động từ chính từ vựng bên dưới,
 * xem shared/src/study/multiple-choice.ts.
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
  {
    name: 'Food & Cooking',
    description: 'Từ vựng về món ăn, nguyên liệu và cách nấu nướng trong bếp',
    level: VocabLevel.BEGINNER,
    words: [
      { word: 'ingredient', meaning: 'nguyên liệu', phonetic: '/ɪnˈɡriːdiənt/', example: 'Mix all the ingredients in a large bowl.' },
      { word: 'recipe', meaning: 'công thức nấu ăn', phonetic: '/ˈresəpi/', example: 'This recipe comes from my grandmother.' },
      { word: 'boil', meaning: 'luộc, đun sôi', phonetic: '/bɔɪl/', example: 'Boil the eggs for eight minutes.' },
      { word: 'fry', meaning: 'chiên, rán', phonetic: '/fraɪ/', example: 'Fry the onions until they turn golden.' },
      { word: 'spicy', meaning: 'cay', phonetic: '/ˈspaɪsi/', example: 'Thai food is often quite spicy.' },
      { word: 'leftovers', meaning: 'đồ ăn thừa', phonetic: '/ˈleftoʊvərz/', example: 'We had leftovers for lunch the next day.' },
      { word: 'portion', meaning: 'khẩu phần', phonetic: '/ˈpɔːrʃn/', example: 'The restaurant serves large portions.' },
      { word: 'appetite', meaning: 'sự thèm ăn', phonetic: '/ˈæpɪtaɪt/', example: 'Swimming always gives me a big appetite.' },
    ],
  },
  {
    name: 'Health & Fitness',
    description: 'Từ vựng về sức khoẻ, luyện tập thể thao và khám bệnh',
    level: VocabLevel.INTERMEDIATE,
    words: [
      { word: 'symptom', meaning: 'triệu chứng', phonetic: '/ˈsɪmptəm/', example: 'A sore throat is a common symptom of a cold.' },
      { word: 'prescription', meaning: 'đơn thuốc', phonetic: '/prɪˈskrɪpʃn/', example: 'The doctor gave me a prescription for antibiotics.' },
      { word: 'workout', meaning: 'buổi tập luyện', phonetic: '/ˈwɜːrkaʊt/', example: 'I do a 30-minute workout every morning.' },
      { word: 'stretch', meaning: 'giãn cơ', phonetic: '/stretʃ/', example: 'Stretch your legs before you run.' },
      { word: 'nutrition', meaning: 'dinh dưỡng', phonetic: '/nuˈtrɪʃn/', example: 'Good nutrition helps you recover faster.' },
      { word: 'injury', meaning: 'chấn thương', phonetic: '/ˈɪndʒəri/', example: 'He missed the match because of a knee injury.' },
      { word: 'recover', meaning: 'hồi phục', phonetic: '/rɪˈkʌvər/', example: 'She recovered quickly after the surgery.' },
      { word: 'posture', meaning: 'tư thế', phonetic: '/ˈpɒstʃər/', example: 'Sitting all day can ruin your posture.' },
    ],
  },
  {
    name: 'Job Interview',
    description: 'Từ vựng và cụm từ hay gặp khi đi phỏng vấn xin việc',
    level: VocabLevel.INTERMEDIATE,
    words: [
      { word: 'candidate', meaning: 'ứng viên', phonetic: '/ˈkændɪdət/', example: 'We interviewed five candidates for the role.' },
      { word: 'résumé', meaning: 'sơ yếu lý lịch', phonetic: '/ˈrezəmeɪ/', example: 'Please attach your résumé to the email.' },
      { word: 'strength', meaning: 'điểm mạnh', phonetic: '/streŋθ/', example: 'Teamwork is one of my greatest strengths.' },
      { word: 'weakness', meaning: 'điểm yếu', phonetic: '/ˈwiːknəs/', example: 'Talk about a weakness you are working on.' },
      { word: 'salary', meaning: 'mức lương', phonetic: '/ˈsæləri/', example: 'What salary do you expect for this position?' },
      { word: 'probation', meaning: 'thời gian thử việc', phonetic: '/proʊˈbeɪʃn/', example: 'The probation period lasts two months.' },
      { word: 'qualification', meaning: 'bằng cấp, trình độ', phonetic: '/ˌkwɒlɪfɪˈkeɪʃn/', example: 'She has the right qualifications for the job.' },
      { word: 'reference', meaning: 'người giới thiệu', phonetic: '/ˈrefrəns/', example: 'My former manager agreed to be my reference.' },
    ],
  },
  {
    name: 'Environment',
    description: 'Từ vựng học thuật về môi trường, biến đổi khí hậu và phát triển bền vững',
    level: VocabLevel.ADVANCED,
    words: [
      { word: 'emission', meaning: 'khí thải', phonetic: '/iˈmɪʃn/', example: 'The factory cut its carbon emissions by half.' },
      { word: 'renewable', meaning: 'tái tạo được', phonetic: '/rɪˈnuːəbl/', example: 'Solar power is a renewable source of energy.' },
      { word: 'deforestation', meaning: 'nạn phá rừng', phonetic: '/diːˌfɒrɪˈsteɪʃn/', example: 'Deforestation threatens many species.' },
      { word: 'sustainable', meaning: 'bền vững', phonetic: '/səˈsteɪnəbl/', example: 'We need a more sustainable way of farming.' },
      { word: 'biodiversity', meaning: 'đa dạng sinh học', phonetic: '/ˌbaɪoʊdaɪˈvɜːrsəti/', example: 'Coral reefs are rich in biodiversity.' },
      { word: 'pollutant', meaning: 'chất gây ô nhiễm', phonetic: '/pəˈluːtənt/', example: 'Plastic is a major pollutant in the ocean.' },
      { word: 'drought', meaning: 'hạn hán', phonetic: '/draʊt/', example: 'The drought destroyed most of the crops.' },
      { word: 'mitigate', meaning: 'giảm nhẹ', phonetic: '/ˈmɪtɪɡeɪt/', example: 'Planting trees can help mitigate climate change.' },
    ],
  },
];
