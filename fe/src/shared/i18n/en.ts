import type { Dictionary } from './language';

/**
 * Bản dịch tiếng Anh. Khoá là câu tiếng Việt gốc trong code (xem `language.tsx`).
 *
 * Thiếu một câu thì câu đó hiện tiếng Việt và console cảnh báo ở môi trường dev —
 * giao diện không bao giờ vỡ vì quên dịch. Kiểm tra còn thiếu gì:
 *   node fe/scripts/check-translations.mjs
 *
 * Có hai nhóm khoá:
 *   1. câu gọi thẳng t('…') trong component
 *   2. nhãn nằm trong bảng dữ liệu (labels.ts, mục sidebar, bản đồ breadcrumb…) được
 *      đưa qua t() ở chỗ hiển thị — script kiểm tra không thấy được nhóm này, nên khi
 *      thêm nhãn mới vào các bảng đó phải nhớ thêm bản dịch ở đây.
 */
export const EN: Dictionary = {
  // --- Khung app: điều hướng, thanh trên cùng ---------------------------------
  'Tổng quan': 'Overview',
  'Học': 'Learn',
  'Từ vựng': 'Vocabulary',
  'Ôn tập': 'Review',
  'Quiz': 'Quiz',
  'Thông báo': 'Notifications',
  'Thói quen': 'Habits',
  'Mục tiêu': 'Goals',
  'Duy trì': 'Keep it up',
  'Quản trị': 'Administration',
  'Tổng quan hệ thống': 'System overview',
  'Tài khoản': 'Accounts',
  'Lượt truy cập': 'Access log',
  'Nội dung học tập': 'Learning content',
  'Gửi thông báo': 'Send notification',
  'Trang cá nhân': 'Profile',
  'Bảng xếp hạng': 'Leaderboard',
  'So sánh điểm học tập với những người học khác': 'See how your XP compares with other learners',
  'Chưa ai có điểm trong khoảng này': 'Nobody has scored in this period yet',
  // Ba nhãn hạng và hai nhãn tiêu chí đi qua t() bằng khoá động nên script check:i18n
  // không quét được — thêm hoặc sửa nhãn ở PODIUM_STYLES/METRIC_LABELS thì phải tự
  // cập nhật ở đây.
  'Hạng nhất': 'First place',
  'Hạng nhì': 'Second place',
  'Hạng ba': 'Third place',
  'Xếp theo': 'Rank by',
  'Điểm học tập': 'XP earned',
  'lượt': 'activities',
  'Học vài phút là bạn đứng đầu bảng ngay.': 'A few minutes of study puts you straight on top.',
  '{n} người có điểm trong khoảng này': {
    one: '{n} learner scored in this period',
    other: '{n} learners scored in this period',
  },
  'Đăng xuất': 'Log out',
  'Thu gọn': 'Collapse',
  'Thu gọn thanh điều hướng': 'Collapse sidebar',
  'Mở rộng thanh điều hướng': 'Expand sidebar',
  'Mở menu': 'Open menu',
  'Đóng menu': 'Close menu',
  'Đường dẫn': 'Breadcrumb',
  'Chọn ngôn ngữ': 'Choose language',
  'Chọn chế độ giao diện': 'Choose theme',
  'Sáng': 'Light',
  'Tối': 'Dark',
  'Theo hệ thống': 'System',
  'Xu — bấm để tới khu phần thưởng': 'Coins — tap to open rewards',
  'Chuỗi ngày học': 'Learning streak',
  'Chuỗi ngày học — đã đứt': 'Learning streak — broken',
  'Cấp {level} · {xp} XP': 'Level {level} · {xp} XP',
  'Thống kê': 'Statistics',
  'Bài học': 'Lesson',
  'Flashcard': 'Flashcards',
  'Quản lý tài khoản': 'Account management',
  'Không tìm thấy trang': 'Page not found',

  // --- Trang 404 ---------------------------------------------------------------
  'Không tìm thấy trang này': 'This page does not exist',
  'Đường dẫn dưới đây không tồn tại, hoặc đã được đổi sang chỗ khác.':
    'The path below does not exist, or it has been moved somewhere else.',
  'Làm mới': 'Reload',
  'Về trang chủ': 'Go home',

  // --- Lỗi chung ---------------------------------------------------------------
  'Phần "{feature}" gặp lỗi': 'Something went wrong in "{feature}"',
  'Các phần khác vẫn hoạt động bình thường. Vui lòng thử tải lại.':
    'Everything else still works. Please try reloading.',
  'Thử lại': 'Try again',
  'Đóng thông báo': 'Dismiss',
  'Dữ liệu không hợp lệ': 'Invalid data',

  // --- Đăng nhập / đăng ký ------------------------------------------------------
  'Chào mừng trở lại': 'Welcome back',
  'Tiếp tục hành trình học tiếng Anh của bạn': 'Continue your English learning journey',
  'Mật khẩu': 'Password',
  'Nhập mật khẩu': 'Enter your password',
  'Đang đăng nhập...': 'Signing in...',
  'Đăng nhập': 'Sign in',
  'Chưa có tài khoản?': "Don't have an account?",
  'Đăng ký miễn phí': 'Sign up free',
  'Đã có tài khoản?': 'Already have an account?',
  'Họ tên': 'Full name',
  'Nguyễn Văn A': 'Jane Doe',
  'Tạo mật khẩu': 'Create a password',
  'Ít nhất 8 ký tự, gồm cả chữ và số': 'At least 8 characters, with both letters and numbers',
  'Đang tạo tài khoản...': 'Creating account...',
  'Tạo tài khoản': 'Create account',
  'Ẩn mật khẩu': 'Hide password',
  'Hiện mật khẩu': 'Show password',
  'Độ mạnh: {level}': 'Strength: {level}',
  'Quá yếu': 'Very weak',
  'Yếu': 'Weak',
  'Khá': 'Fair',
  'Tốt': 'Strong',
  'Học tiếng Anh đều đặn, mỗi ngày một chút': 'Learn English steadily, a little every day',
  'Vấn đề không nằm ở thiếu tài liệu, mà ở việc duy trì. ENG//HABIT giúp bạn biến việc học thành thói quen và thấy rõ mình đang tiến bộ.':
    'The problem is rarely a lack of material — it is keeping at it. ENG//HABIT turns studying into a habit and shows you the progress you are making.',
  'Ứng dụng hỗ trợ xây dựng và duy trì thói quen học tiếng Anh':
    'An app for building and keeping an English learning habit',
  'Theo dõi số ngày học liên tiếp để duy trì động lực mỗi ngày':
    'Track your consecutive learning days to stay motivated',
  'Ôn tập thông minh': 'Smart review',
  'Flashcard tự tính lịch ôn theo mức độ bạn nhớ từng từ':
    'Flashcards schedule themselves based on how well you remember each word',
  'Thống kê rõ ràng': 'Clear statistics',
  'Nhìn lại cả năm học của bạn chỉ trong một biểu đồ':
    'See a whole year of learning in a single chart',

  // --- Tổng quan người học ------------------------------------------------------
  'Xin chào, {name}': 'Hi, {name}',
  'bạn': 'there',
  '(bạn)': '(you)',
  'Cùng xem tiến độ học tập của bạn hôm nay': "Here is today's learning progress",
  'Chuỗi hiện tại': 'Current streak',
  'ngày': 'days',
  'Học hôm nay để giữ chuỗi': 'Study today to keep your streak',
  'Học hôm nay để bắt đầu lại': 'Study today to start again',
  'Lên cấp {n}': 'To level {n}',
  'Còn {n} XP nữa': '{n} XP to go',
  'Ngày có học': 'Active days',
  'Tổng hoạt động': 'Total activities',
  'Kỷ lục chuỗi': 'Longest streak',
  'Kỷ lục': 'Record',
  'Từ trước tới nay': 'All time',
  '{n} ngày': { one: '{n} day', other: '{n} days' },
  'HỌC NGAY HÔM NAY': 'START LEARNING',
  'ÔN TẬP': 'REVIEW',
  'Ôn nhanh': 'Quick review',
  'Làm tiếp từ chỗ đang dở': 'Pick up where you left off',
  'HỌC BÀI': 'LESSONS',
  'ÔN FLASHCARD': 'FLASHCARDS',
  '{n} từ cần ôn lại': { one: '{n} word to review', other: '{n} words to review' },
  'Đã xong phần cần ôn': 'Nothing left to review',
  '{n} từ tới hạn hôm nay': { one: '{n} card due today', other: '{n} cards due today' },
  'Đã ôn hết hôm nay': 'All caught up today',
  '7 ngày': '7 days',
  'Tuần này': 'This week',
  'Tháng này': 'This month',
  '90 ngày': '90 days',
  '12 tháng': '12 months',
  'Hoạt động theo ngày': 'Daily activity',
  'Khoảng thời gian': 'Time range',
  'Không tải được thống kê': 'Could not load statistics',
  '90 ngày gần đây': 'Last 90 days',
  'Lịch học cả năm': 'A full year of learning',
  'Bấm vào một ngày để xem hôm đó bạn đã học gì. Ô càng đậm là học càng nhiều.':
    'Tap any day to see what you did. The darker the cell, the more you studied.',
  'Phạm vi lịch': 'Calendar range',
  'Không tải được lịch học': 'Could not load the calendar',
  'Tiến độ mục tiêu': 'Goal progress',
  'Quản lý': 'Manage',

  // Thẻ mở đầu và việc cần làm hôm nay
  'Kỷ lục {n} ngày': 'Record: {n} days',
  '{n} XP': '{n} XP',
  'Còn {n} XP nữa để lên cấp {level}': '{n} XP to reach level {level}',
  'HỌC ĐỂ GIỮ CHUỖI': 'STUDY TO KEEP THE STREAK',
  'Việc hôm nay': 'Today',
  'Bạn đã xong hết phần cần ôn.': 'You are all caught up.',
  'Làm tiếp từ chỗ đang dở.': 'Pick up where you left off.',
  '{n} thẻ tới hạn': { one: '{n} card due', other: '{n} cards due' },
  'Luyện lại từ sai': 'Practise your mistakes',
  '{n} từ cần luyện': { one: '{n} word to practise', other: '{n} words to practise' },
  'Không còn từ sai': 'No mistakes left',
  '{n}% ngày có học': '{n}% of days studied',
  'Bạn chưa đặt mục tiêu nào': 'You have not set any goals',
  'Đặt mục tiêu đầu tiên': 'Set your first goal',

  // --- Biểu đồ & lịch hoạt động --------------------------------------------------
  '{n} hoạt động': { one: '{n} activity', other: '{n} activities' },
  '{activities} hoạt động trong {days} ngày': '{activities} activities across {days} days',
  'không học': 'no study',
  'Bấm vào một ô để xem ngày đó': 'Tap a cell to see that day',
  'Ít': 'Less',
  'Nhiều': 'More',
  'Chọn một cột để xem chi tiết từng ngày': 'Pick a column to see that day in detail',
  'Chưa có dữ liệu hoạt động.': 'No activity data yet.',

  // --- Phần thưởng ---------------------------------------------------------------
  'ĐIỂM DANH · NHẬN {n} XU': 'CHECK IN · GET {n} COINS',
  'ĐÃ ĐIỂM DANH HÔM NAY': 'CHECKED IN TODAY',
  'Đã nhận {n} xu': 'Received {n} coins',
  'Nhiệm vụ': 'Missions',
  'Giữ chuỗi': 'Streak freeze',
  'Mua': 'Buy',
  'Kho tối đa {n} vật phẩm': 'Your stock holds at most {n} items',
  'Cần {price} xu, bạn có {coins}': 'Costs {price} coins, you have {coins}',
  'Mua 1 vật phẩm với {price} xu': 'Buy one for {price} coins',
  'Đã mua 1 vật phẩm giữ chuỗi': 'Bought a streak freeze',
  'Nhận {n} xu': 'Claim {n} coins',
  'Hoàn thành nhiệm vụ để nhận thưởng': 'Finish the mission to claim its reward',
  '+{n} xu': '+{n} coins',
  'Đã nhận': 'Claimed',
  'Học 5 từ mới': 'Learn 5 new words',
  'Ôn 10 thẻ': 'Review 10 cards',
  'Check-in 1 thói quen': 'Check in one habit',

  // --- Lộ trình & bài học ---------------------------------------------------------
  'Lộ trình học': 'Learning path',
  'Hoàn thành từng bài để mở khoá bài tiếp theo': 'Finish each lesson to unlock the next one',
  'Ôn lại từ sai': 'Practice past mistakes',
  '{n} từ bạn từng trả lời sai': { one: '{n} word you answered wrong', other: '{n} words you answered wrong' },
  'Luyện lại để nhớ chắc hơn': 'Practise them until they stick',
  '{done}/{total} bài': '{done}/{total} lessons',
  'Hoàn thành bài trước để mở khoá': 'Finish the previous lesson to unlock this one',
  'Chưa có nội dung học': 'No learning content yet',
  'Quản trị viên cần thêm chủ đề và từ vựng trước.': 'An administrator needs to add topics and vocabulary first.',
  'Bạn không còn từ nào cần ôn lại': 'You have no mistakes left to practise',
  'Trả lời đúng 2 lần liên tiếp là một từ được gỡ khỏi danh sách này.':
    'Answer a word correctly twice in a row and it leaves this list.',
  'Về lộ trình': 'Back to path',
  'Không tải được bài học': 'Could not load the lesson',
  'Bài học không có câu hỏi nào': 'This lesson has no questions',
  'Thoát bài học': 'Leave lesson',
  'Hãy trả lời để tiếp tục': 'Answer to continue',
  'Câu tiếp theo': 'Next question',
  'Nộp bài': 'Submit',
  'Đang nộp bài...': 'Submitting...',
  'Đạt {percent}% — bạn đã qua bài này': 'Scored {percent}% — you passed this lesson',
  'Đạt {percent}% — cần đúng từ 70% để qua bài': 'Scored {percent}% — you need 70% to pass',
  'Quay lại': 'Back',
  'Những câu cần xem lại ({n})': 'Worth another look ({n})',
  'Các từ này đã được thêm vào mục "Ôn lại từ sai" để bạn luyện tiếp.':
    'These words were added to "Practice past mistakes" so you can drill them.',
  'Từ này có {n} chữ cái': 'This word has {n} letters',
  'Bắt đầu bằng chữ "{letter}"': 'It starts with "{letter}"',
  'Gõ từ tiếng Anh...': 'Type the English word...',
  'Gõ từ bạn nghe được...': 'Type the word you hear...',
  'Chọn từ bên dưới để ghép câu': 'Tap the words below to build the sentence',
  'Chọn một từ ở cột trái': 'Pick a word in the left column',
  'Giờ chọn nghĩa tương ứng ở cột phải': 'Now pick its meaning on the right',
  'Nghe lại': 'Play again',
  'Bấm loa để nghe lại': 'Tap the speaker to hear it again',
  'Trình duyệt không phát âm được — từ cần nghe là': 'Your browser cannot speak — the word is',
  'Tạm dừng': 'Pause',

  // --- Từ vựng & flashcard ---------------------------------------------------------
  'Từ vựng theo chủ đề': 'Vocabulary by topic',
  'Chọn chủ đề để bắt đầu học từ mới': 'Pick a topic to start learning new words',
  'Chưa có chủ đề nào': 'No topics yet',
  'Quản trị viên cần thêm nội dung học tập': 'An administrator needs to add learning content',
  '{n} từ vựng': { one: '{n} word', other: '{n} words' },
  '← Chủ đề khác': '← Other topics',
  'Chủ đề này chưa có từ nào': 'This topic has no words yet',
  'Chủ đề này chưa có từ vựng': 'This topic has no vocabulary yet',
  '+ Học từ này': '+ Learn this word',
  'Đang học': 'Learning',
  'Ôn tập flashcard': 'Flashcard review',
  'Thẻ {current} / {total}': 'Card {current} of {total}',
  'Hiện nghĩa': 'Show meaning',
  'Bạn nhớ từ này ở mức nào?': 'How well do you remember this word?',
  'Lựa chọn của bạn quyết định khi nào từ này xuất hiện lại (thuật toán SM-2)':
    'Your answer decides when this word comes back (SM-2 algorithm)',
  'Quên rồi': 'Forgot',
  'Ôn lại ngày mai': 'Back tomorrow',
  'Khó nhớ': 'Hard',
  'Ôn lại sớm': 'Back soon',
  'Nhớ được': 'Good',
  'Giãn cách bình thường': 'Normal spacing',
  'Rất dễ': 'Easy',
  'Giãn cách dài hơn': 'Longer spacing',
  'Bạn đã ôn hết từ cho hôm nay': 'You have reviewed everything for today',
  'Quay lại vào ngày mai, hoặc thêm từ mới vào danh sách học để ôn tiếp.':
    'Come back tomorrow, or add new words to keep reviewing.',
  'Hoàn thành phiên ôn tập': 'Review session complete',
  'Bạn đã ôn {n} từ. Hoạt động đã được ghi nhận vào chuỗi ngày học.':
    'You reviewed {n} words. It has been recorded in your streak.',
  'Tải phiên mới': 'Load a new session',

  // --- Quiz --------------------------------------------------------------------------
  'Kiểm tra kiến thức': 'Test your knowledge',
  'Làm quiz để củng cố những gì đã học': 'Take a quiz to reinforce what you have learned',
  'Chưa có bài quiz nào': 'No quizzes yet',
  'Quản trị viên cần thêm nội dung': 'An administrator needs to add content',
  '{n} câu hỏi': { one: '{n} question', other: '{n} questions' },
  'Bắt đầu làm': 'Start',
  'Lịch sử làm bài': 'Attempt history',
  'Không tải được đề bài': 'Could not load the quiz',
  'Đã trả lời {answered} / {total} câu': 'Answered {answered} of {total}',
  'Thoát': 'Exit',
  'Câu {n}.': 'Q{n}.',
  'Hãy trả lời tất cả các câu trước khi nộp': 'Answer every question before submitting',
  'Kết quả': 'Result',
  'Đạt {percent}%': 'Scored {percent}%',
  'Chi tiết đáp án': 'Answer details',
  'Bạn chọn:': 'You chose:',
  'Đáp án đúng:': 'Correct answer:',
  'Tổng điểm': 'Total score',
  'Bài quiz': 'Quiz',

  // --- Thói quen ---------------------------------------------------------------------
  'Thói quen học tập': 'Learning habits',
  'Check-in mỗi ngày để giữ chuỗi và hình thành thói quen bền vững':
    'Check in daily to keep your streak and build a lasting habit',
  'Thêm thói quen': 'Add habit',
  'Đóng': 'Close',
  'Chưa có thói quen nào': 'No habits yet',
  'Bắt đầu với một thói quen nhỏ và cụ thể, ví dụ: học 10 từ vựng mỗi ngày.':
    'Start with something small and specific, for example: learn 10 words a day.',
  'Tạo thói quen đầu tiên': 'Create your first habit',
  'Tên thói quen': 'Habit name',
  'Ví dụ: Học 20 từ vựng': 'For example: Learn 20 words',
  'Tần suất': 'Frequency',
  'Ngày trong tuần': 'Days of the week',
  'Chọn các ngày trong tuần': 'Pick the days of the week',
  'Giờ nhắc (tuỳ chọn)': 'Reminder time (optional)',
  'Theo múi giờ của bạn': 'In your own time zone',
  'Đang tạo...': 'Creating...',
  'Tạo thói quen': 'Create habit',
  'Các ngày: {days}': 'Days: {days}',
  'Đã check-in "{name}"': 'Checked in "{name}"',
  'Xoá thói quen "{name}"? Lịch sử check-in cũng sẽ mất.':
    'Delete the habit "{name}"? Its check-in history goes with it.',
  'Đã xoá thói quen': 'Habit deleted',
  'Xoá thói quen': 'Delete habit',
  'Đã xong': 'Done',
  'Check-in': 'Check in',
  '{n}/7 ngày': '{n}/7 days',
  '{date} — đã check-in': '{date} — checked in',
  'Hằng ngày': 'Daily',
  'Hằng tuần': 'Weekly',
  'Tuỳ chọn': 'Custom',
  'Tuỳ chọn theo thứ': 'Custom weekdays',

  // --- Mục tiêu ------------------------------------------------------------------------
  'Mục tiêu học tập': 'Learning goals',
  'Đặt mục tiêu cụ thể để theo dõi tiến độ mỗi ngày': 'Set concrete goals to track progress each day',
  '+ Thêm mục tiêu': '+ Add goal',
  'Chưa có mục tiêu nào': 'No goals yet',
  'Ví dụ: học 20 từ vựng mỗi ngày': 'For example: learn 20 words a day',
  'Bắt đầu xây dựng thói quen học mỗi ngày': 'Start building a daily learning habit',
  'Loại mục tiêu': 'Goal type',
  'Chỉ tiêu': 'Target',
  'Chu kỳ': 'Period',
  'Tạo mục tiêu': 'Create goal',
  'Xoá mục tiêu này?': 'Delete this goal?',
  '✓ Hoàn thành': '✓ Done',
  'Hoàn thành': 'Completed',
  'Số từ vựng học mỗi ngày': 'Words learned per day',
  'Số lượt ôn tập mỗi ngày': 'Reviews per day',
  'Số bài quiz mỗi tuần': 'Quizzes per week',
  'Chuỗi ngày học liên tiếp': 'Consecutive learning days',
  'Mỗi ngày': 'Daily',
  'Mỗi tuần': 'Weekly',

  // --- Thông báo -------------------------------------------------------------------------
  'Nhắc học': 'Reminder',
  'Chuỗi sắp đứt': 'Streak at risk',
  'Tới hạn ôn': 'Review due',
  'Từ sai': 'Mistakes',
  'Đạt mục tiêu': 'Goal reached',
  'Nhắc nhở học tập, cảnh báo chuỗi ngày và thông báo từ hệ thống':
    'Study reminders, streak warnings and system announcements',
  'Tất cả': 'All',
  'Chưa đọc': 'Unread',
  'Đã đọc': 'Read',
  'Đánh dấu đã đọc hết': 'Mark all as read',
  'Chưa có thông báo nào': 'No notifications yet',
  'Chưa có thông báo nào. Nhắc nhở học sẽ xuất hiện ở đây.':
    'No notifications yet. Study reminders will show up here.',
  'Không còn thông báo chưa đọc': 'No unread notifications',
  'Nhắc nhở học hằng ngày sẽ xuất hiện ở đây theo giờ bạn đặt trong trang cá nhân.':
    'Daily reminders appear here at the time you set on your profile page.',
  'Xem tất cả thông báo': 'See all notifications',
  'Xoá thông báo': 'Delete notification',
  'Thông báo, {n} chưa đọc': 'Notifications, {n} unread',
  'vừa xong': 'just now',
  '{n} phút trước': { one: '{n} minute ago', other: '{n} minutes ago' },
  '{n} giờ trước': { one: '{n} hour ago', other: '{n} hours ago' },
  '{n} ngày trước': { one: '{n} day ago', other: '{n} days ago' },
  'Cài đặt nhắc nhở': 'Reminder settings',
  'Bật nhắc nhở học tập': 'Turn on study reminders',
  'Tắt thì không nhận bất kỳ nhắc nhở tự động nào.': 'When off, you get no automatic reminders at all.',
  'Giờ nhắc': 'Reminder time',
  'Theo múi giờ trong trang cá nhân của bạn.': 'Uses the time zone from your profile.',
  'Chọn ít nhất một ngày, hoặc tắt hẳn nhắc nhở.': 'Pick at least one day, or turn reminders off entirely.',
  'Cảnh báo chuỗi sắp đứt': 'Streak-at-risk warning',
  'Gửi lúc 21:30 nếu hôm đó bạn chưa học và đang có chuỗi.':
    'Sent at 21:30 if you have a streak and have not studied that day.',
  'Nhắc thẻ tới hạn ôn': 'Mention cards due',
  'Lời nhắc hằng ngày sẽ kèm số thẻ flashcard cần ôn.':
    'Daily reminders will include how many cards are due.',
  'Nhắc nhở chỉ gửi khi hôm đó bạn chưa học — học rồi thì hệ thống im lặng.':
    'Reminders only go out if you have not studied that day — once you have, the app stays quiet.',
  'Lưu cài đặt': 'Save settings',
  'Đã lưu cài đặt nhắc nhở': 'Reminder settings saved',
  'Các lời nhắc trong ngày': 'Daily reminders',
  'Đã đặt {n}/{max} lời nhắc': '{n} of {max} reminders set',
  'Thêm lời nhắc': 'Add reminder',
  'Đã đạt số lời nhắc tối đa': 'You have reached the maximum number of reminders',
  'Chưa có lời nhắc nào. Thêm một lời nhắc để hệ thống nhắc bạn học.':
    'No reminders yet. Add one and the app will nudge you.',
  'Cả tuần': 'Every day',
  'Lời nhắc lúc {time}': 'Reminder at {time}',
  'Sửa lời nhắc': 'Edit reminder',
  'Đã cập nhật lời nhắc': 'Reminder updated',
  'Xoá lời nhắc': 'Delete reminder',
  'Xoá lời nhắc lúc {time}?': 'Delete the {time} reminder?',
  'Đã xoá lời nhắc': 'Reminder deleted',
  'Đã thêm lời nhắc': 'Reminder added',
  'Tên lời nhắc (tuỳ chọn)': 'Name (optional)',
  'Ví dụ: Trước khi đi làm': 'For example: Before work',
  'Chọn ít nhất một ngày cho lời nhắc này.': 'Pick at least one day for this reminder.',
  'Huỷ': 'Cancel',

  // --- Trang cá nhân ---------------------------------------------------------------------
  'Thông tin tài khoản và tiến độ học tập': 'Account details and learning progress',
  'Thông tin tài khoản quản trị': 'Administrator account details',
  'Khu quản trị': 'Admin area',
  'Tham gia từ {date}': 'Joined {date}',
  'Cấp {from} → {to}': 'Level {from} → {to}',
  'còn {n} XP': '{n} XP to go',
  'Tiến độ học tập': 'Learning progress',
  'Thông tin cá nhân': 'Personal details',
  'Tải ảnh lên': 'Upload photo',
  'Đổi ảnh': 'Change photo',
  'Gỡ ảnh': 'Remove photo',
  'Đã đổi ảnh đại diện': 'Profile photo updated',
  'Đã gỡ ảnh đại diện': 'Profile photo removed',
  'Ảnh JPG, PNG hoặc WebP. Ảnh sẽ được thu nhỏ và cắt vuông tự động.':
    'JPG, PNG or WebP. The image is resized and cropped to a square automatically.',
  'Không đọc được ảnh này. Hãy thử một ảnh khác.': 'Could not read this image. Try another one.',
  'Chỉ nhận ảnh JPG, PNG hoặc WebP': 'Only JPG, PNG or WebP images are accepted',
  'Ảnh không đúng định dạng': 'That is not a valid image',
  'Ảnh rỗng': 'The image is empty',
  'Ảnh quá lớn (tối đa 200KB)': 'Image is too large (200KB max)',
  'Không đổi được email sau khi đăng ký': 'Email cannot be changed after signing up',
  'Múi giờ': 'Time zone',
  'Quyết định mốc kết thúc một ngày học, ảnh hưởng tới chuỗi ngày và thống kê':
    'Decides when a learning day ends — it affects your streak and statistics',
  'Trình duyệt đang ở múi giờ': 'Your browser time zone is',
  ', khác với cài đặt tài khoản.': ', which differs from your account setting.',
  'Cập nhật theo trình duyệt': 'Use browser time zone',
  'Đã cập nhật múi giờ': 'Time zone updated',
  'Lưu thay đổi': 'Save changes',
  'Đã lưu thông tin': 'Details saved',
  'Đổi mật khẩu': 'Change password',
  'Mật khẩu hiện tại': 'Current password',
  'Mật khẩu mới': 'New password',
  'Nhập lại mật khẩu mới': 'Repeat new password',
  'Mật khẩu mới nhập lại không khớp': 'The two new passwords do not match',
  'Đổi mật khẩu sẽ đăng xuất tài khoản này khỏi mọi thiết bị khác.':
    'Changing your password signs this account out of every other device.',
  'Đã đổi mật khẩu': 'Password changed',
  'Xem thống kê': 'View statistics',

  // --- Quản trị: tổng quan -------------------------------------------------------------------
  'Tình trạng vận hành, quy mô người dùng và mức độ sử dụng':
    'Operational health, user base and usage levels',
  'Không tải được số liệu hệ thống': 'Could not load system metrics',
  'Người dùng': 'Users',
  '+{n} trong 7 ngày': '+{n} in 7 days',
  'Hoạt động 7 ngày': 'Active in 7 days',
  '{percent}% tổng số người dùng': '{percent}% of all users',
  'Phiên đang mở': 'Open sessions',
  '{n} lượt đăng nhập / 7 ngày': '{n} sign-ins / 7 days',
  'Đăng nhập thất bại': 'Failed sign-ins',
  '7 ngày qua': 'Last 7 days',
  '30 ngày qua': 'Last 30 days',
  '90 ngày qua': 'Last 90 days',
  'Cơ cấu tài khoản': 'Account breakdown',
  'Cơ cấu hoạt động': 'Activity breakdown',
  'Kho nội dung': 'Content library',
  'Người học tích cực nhất': 'Most active learners',
  '{n} lượt': '{n} times',
  'Chưa có hoạt động nào được ghi nhận.': 'No activity recorded yet.',
  'Database kết nối tốt': 'Database connected',
  'Mất kết nối database': 'Database unreachable',
  'Số liệu cập nhật lúc {time} · tự làm mới mỗi phút · Node {node} · môi trường {env} · API đã chạy {uptime}':
    'Updated at {time} · refreshes every minute · Node {node} · environment {env} · API up for {uptime}',
  '{days} ngày {hours} giờ': '{days}d {hours}h',
  '{hours} giờ {minutes} phút': '{hours}h {minutes}m',
  '{n} phút': '{n}m',
  'Học trong 24 giờ': 'Studied in 24 hours',
  'Hoạt động tháng này': 'Activity this month',
  'Mới trong 30 ngày': 'New in 30 days',
  'Đang hoạt động': 'Active',
  'Đã khoá': 'Locked',
  'Bị khoá': 'Locked',
  'Quản trị viên': 'Administrator',
  'Người học': 'Learner',
  'Chủ đề': 'Topics',
  'Câu hỏi quiz': 'Quiz questions',
  'Lượt hoạt động': 'Activity events',
  'Lượt làm quiz': 'Quiz attempts',
  'Học từ vựng': 'Vocabulary learned',
  'Ôn flashcard': 'Flashcards reviewed',
  'Làm quiz': 'Quizzes taken',
  'Check-in thói quen': 'Habit check-ins',

  // --- Quản trị: tài khoản ----------------------------------------------------------------------
  'Tìm kiếm, phân quyền, khoá và xoá tài khoản người dùng':
    'Search, assign roles, lock and delete user accounts',
  'Tìm người dùng': 'Search users',
  'Tìm theo tên, tên tài khoản hoặc email': 'Search by name, username or email',
  'Lọc theo vai trò': 'Filter by role',
  'Mọi vai trò': 'All roles',
  'Chỉ quản trị viên': 'Administrators only',
  'Chỉ người học': 'Learners only',
  'Lọc theo trạng thái': 'Filter by status',
  'Mọi trạng thái': 'All statuses',
  'Sắp xếp': 'Sort',
  'Mới đăng ký nhất': 'Newest first',
  'Cũ nhất': 'Oldest first',
  'Đăng nhập gần đây': 'Recently signed in',
  'Học nhiều nhất': 'Most active',
  'Không tìm thấy tài khoản nào': 'No accounts found',
  'Thử bỏ bớt bộ lọc hoặc đổi từ khoá tìm kiếm.': 'Try clearing a filter or changing your search.',
  'Vai trò': 'Role',
  'Trạng thái': 'Status',
  'Hoạt động': 'Activity',
  'Đăng nhập gần nhất': 'Last sign-in',
  'Chưa bao giờ': 'Never',
  'Chi tiết tài khoản': 'Account details',
  'Đang tải…': 'Loading…',
  'Chuỗi dài nhất': 'Longest streak',
  'Từ đã học': 'Words learned',
  'Ngày tạo': 'Created',
  'Học gần nhất': 'Last studied',
  'Trạng thái tài khoản': 'Account status',
  'Cấp quyền quản trị': 'Grant admin',
  'Đã cấp quyền quản trị': 'Admin rights granted',
  'Chuyển thành người học': 'Make learner',
  'Đã chuyển thành người học': 'Changed to learner',
  'Khoá tài khoản': 'Lock account',
  'Khoá không xoá dữ liệu học tập — mở khoá là người dùng vào lại được như cũ.':
    'Locking keeps all learning data — unlock and the user is back exactly as before.',
  'Đã khoá tài khoản và thu hồi phiên đăng nhập': 'Account locked and sessions revoked',
  'Mở khoá': 'Unlock',
  'Đã mở khoá tài khoản': 'Account unlocked',
  // --- Hộp thoại chi tiết tài khoản (3 tab) ---
  // 'Thông tin cá nhân' và 'Thống kê' đã có sẵn ở nơi khác. Riêng khoá này nằm trong
  // mảng hằng số TABS nên script check:i18n không quét được — thêm tab mới phải tự
  // cập nhật ở đây.
  'Hoạt động gần đây': 'Recent activity',
  'Phần thông tin': 'Section',
  'Định danh': 'Identity',
  'Email': 'Email',
  'Các ô số liệu tính từ lúc tạo tài khoản đến hiện tại.':
    'The figures below cover everything since the account was created.',
  // ('Cơ cấu hoạt động' đã có ở màn Tổng quan hệ thống — dùng lại khoá đó.)
  'Tần suất {n} ngày gần đây': 'Frequency over the last {n} days',
  'Loại': 'Type',
  'Chi tiết': 'Details',
  'Chưa ghi nhận hoạt động nào cho tài khoản này.': 'No activity recorded for this account yet.',

  'Xoá tài khoản': 'Delete account',
  'Xoá vĩnh viễn {email}?\n\nToàn bộ {n} hoạt động, chuỗi ngày và tiến độ học sẽ mất và không khôi phục được. Nếu chỉ muốn chặn đăng nhập, hãy dùng "Khoá tài khoản".':
    'Permanently delete {email}?\n\nAll {n} activities, streaks and learning progress will be lost for good. If you only want to block sign-in, use "Lock account" instead.',
  'Đã xoá tài khoản': 'Account deleted',
  'Xoá': 'Delete',
  'Trang {page} / {totalPages} · {total} bản ghi': 'Page {page} of {totalPages} · {total} records',
  'Trước': 'Previous',
  'Sau': 'Next',

  // --- Quản trị: lượt truy cập -------------------------------------------------------------------
  'Lịch sử đăng nhập, phiên đang mở và các lần đăng nhập thất bại':
    'Sign-in history, open sessions and failed attempts',
  'Lượt đăng nhập': 'Sign-ins',
  'Người dùng khác nhau': 'Distinct users',
  'Lượt đăng nhập theo ngày': 'Sign-ins per day',
  'Nhật ký đăng nhập': 'Sign-in log',
  'Lọc theo kết quả': 'Filter by result',
  'Chỉ thành công': 'Successful only',
  'Chỉ thất bại': 'Failed only',
  'Thành công': 'Success',
  'Thất bại': 'Failed',
  'Chưa có lượt truy cập nào': 'No access records yet',
  'Nhật ký bắt đầu được ghi từ lần đăng nhập tiếp theo.': 'Logging starts from the next sign-in.',
  'Chưa có lượt đăng nhập nào được ghi lại.': 'No sign-ins have been recorded.',
  'Thời điểm': 'Time',
  'Địa chỉ IP': 'IP address',
  'Thiết bị': 'Device',
  'Email không tồn tại': 'No such email',
  'Sai mật khẩu': 'Wrong password',
  'Tài khoản bị khoá': 'Account locked',
  '(ngày gần nhất — rê chuột để xem ngày khác)': '(latest day — hover to see others)',

  // --- Quản trị: nội dung -------------------------------------------------------------------------
  'Chủ đề và từ vựng dùng chung cho mọi người học': 'Topics and vocabulary shared by every learner',
  'Tên chủ đề mới': 'New topic name',
  'Ví dụ: Travel English': 'For example: Travel English',
  'Thêm chủ đề': 'Add topic',
  'Đang thêm...': 'Adding...',
  'Chọn một chủ đề': 'Pick a topic',
  'Chọn chủ đề bên trái để quản lý từ vựng': 'Pick a topic on the left to manage its vocabulary',
  'Xoá chủ đề "{name}"? Toàn bộ từ vựng và quiz thuộc chủ đề sẽ mất.':
    'Delete the topic "{name}"? All of its vocabulary and quizzes go with it.',
  'Thêm từ mới': 'Add a word',
  'Thêm từ vựng': 'Add vocabulary',
  'Từ': 'Word',
  'Nghĩa': 'Meaning',
  'Phiên âm (tuỳ chọn)': 'Phonetic (optional)',
  'Câu ví dụ (tuỳ chọn)': 'Example sentence (optional)',
  'Trình độ': 'Level',
  'Cơ bản': 'Beginner',
  'Trung cấp': 'Intermediate',
  'Nâng cao': 'Advanced',

  // --- Quản trị: gửi thông báo ---------------------------------------------------------------------
  'Thông báo thủ công tới người dùng, hiện trong chuông thông báo của họ':
    'A manual message to users, shown in their notification bell',
  'Gửi cho': 'Send to',
  'Tất cả người dùng': 'All users',
  'Tiêu đề': 'Title',
  'Ví dụ: Bổ sung 20 từ vựng chủ đề Du lịch': 'For example: 20 new Travel words added',
  'Nội dung': 'Body',
  'Nội dung ngắn gọn, người đọc chỉ liếc qua trong chuông thông báo.':
    'Keep it short — people only glance at it in the bell.',
  '{n}/500 ký tự': '{n}/500 characters',
  'Đường dẫn kèm theo (không bắt buộc)': 'Link (optional)',
  'Đường dẫn trong app, vd "/learn". Bỏ trống thì thông báo không bấm được.':
    'An in-app path such as "/learn". Leave it empty and the notification is not clickable.',
  'Gửi tới {n} người': 'Send to {n} people',
  'Gửi thông báo này tới {n} người dùng? Đã gửi thì không thu hồi được.':
    'Send this to {n} users? It cannot be taken back.',
  'Đã gửi tới {n} người dùng': 'Sent to {n} users',
  'Xem trước': 'Preview',
  'Tiêu đề thông báo': 'Notification title',
  'Nội dung thông báo sẽ hiện ở đây.': 'The notification body will appear here.',
  'Đây là cách thông báo hiện ra trong chuông của người nhận.':
    'This is how it looks in the recipient\'s bell.',
  'Thông báo thủ công gửi ngay, không phụ thuộc giờ nhắc của người dùng và không bị tắt bởi cài đặt nhắc nhở tự động — vì vậy chỉ dùng cho việc thật sự cần báo.':
    'Manual notifications go out immediately, ignore each user\'s reminder time and are not silenced by their automatic reminder settings — so use them only when something really needs saying.',
  'Hoạt động học 30 ngày qua': 'Learning activity, last 30 days',
  'Tổng {n} lượt hoạt động từ trước tới nay': '{n} activities recorded all time',
  'Người học đang làm gì nhiều nhất': 'What learners do most',
  'Xếp theo tổng số lượt hoạt động': 'Ranked by total activities',
  'Số liệu tra cứu': 'Reference figures',
  'Cơ cấu tài khoản và kho nội dung': 'Account mix and content library',

  // --- Báo cáo học tập theo khoảng tự chọn -----------------------------------
  'Báo cáo': 'Report',
  'Báo cáo học tập': 'Learning report',
  'Chọn một khoảng thời gian để xem bạn đã học được gì và đạt bao nhiêu so với mục tiêu.':
    'Pick a date range to see what you learned and how far you got against your goals.',

  // Bộ chọn khoảng
  '30 ngày': '30 days',
  'Từ ngày': 'From',
  'Đến ngày': 'To',
  'Ngày bắt đầu phải trước hoặc trùng ngày kết thúc': 'The start date must be on or before the end date',
  'Không tải được báo cáo': 'Could not load the report',
  'Khoảng này chưa có hoạt động nào': 'No activity in this range',
  'Hãy chọn một khoảng khác, hoặc bắt đầu học hôm nay để lần sau báo cáo có số liệu.':
    'Pick another range, or start learning today so the next report has something to show.',

  // Tổng kết hiệu quả
  'Tổng kết hiệu quả': 'Effectiveness summary',
  'trên 100': 'out of 100',
  'Xuất sắc': 'Excellent',
  'Cần cải thiện': 'Needs work',
  'Bạn học rất đều và bám sát mục tiêu. Cứ giữ nhịp này.':
    'You are learning consistently and staying on target. Keep this rhythm.',
  'Nhịp học ổn định. Thêm vài ngày nữa trong tuần là đạt mức xuất sắc.':
    'A steady rhythm. A few more days each week and you reach excellent.',
  'Bạn có học nhưng còn ngắt quãng. Học ít mỗi ngày tốt hơn dồn một hôm.':
    'You are learning, but in bursts. A little every day beats one long session.',
  'Khoảng này bạn nghỉ khá nhiều. Thử hạ mục tiêu xuống mức dễ giữ hơn.':
    'You missed a lot of days here. Try lowering the goal to something easier to keep.',
  'Điểm tính theo mức độ đều đặn. Đặt mục tiêu để báo cáo chấm thêm phần hoàn thành mục tiêu.':
    'The score reflects consistency only. Set a goal and the report will score goal completion too.',
  'Điểm tính từ mức độ đều đặn ({consistency}%) và tỷ lệ đạt mục tiêu ({goal}%).':
    'Scored from consistency ({consistency}%) and goal completion ({goal}%).',

  // Đối chiếu với kỳ trước
  'So với kỳ trước': 'Vs previous period',
  '{from} → {to}': '{from} → {to}',
  'Số hoạt động': 'Activities',
  'Điểm kinh nghiệm': 'Experience points',
  '{percent}%': '{percent}%',
  'mới': 'new',

  // Đã làm được gì
  'Đã làm được gì': 'What you got done',
  'Từ {from} đến {to}, tổng {days} ngày.': 'From {from} to {to}, {days} days in total.',
  'Lượt ôn tập': 'Reviews',
  '{active}/{total} ngày': '{active}/{total} days',
  '{percent}% số ngày': '{percent}% of days',
  'Chuỗi dài nhất trong kỳ': 'Longest streak in range',
  'Ngày học nhiều nhất': 'Busiest day',
  'Tổng {n} hoạt động, thu được {xp} XP': '{n} activities in total, earning {xp} XP',

  // Tiến độ mục tiêu trong khoảng
  'Chỉ tiêu đã quy đổi sang {days} ngày của khoảng đang xem.':
    'Targets converted to the {days} days you are viewing.',
  'Bạn chưa đặt mục tiêu nào cho khoảng này. Đặt mục tiêu để báo cáo đối chiếu được kết quả.':
    'You have no goals covering this range. Set one so the report has something to measure against.',
  'Mục tiêu {target} mỗi kỳ, quy đổi thành {expected} cho khoảng này.':
    'Goal of {target} per period, which comes to {expected} for this range.',
  'So chuỗi dài nhất đạt được với mục tiêu {target} ngày.':
    'Comparing your longest streak against the {target}-day goal.',
  'Trung bình đạt {percent}% các mục tiêu đã đặt.': 'On average you hit {percent}% of the goals you set.',

  // --- Cộng đồng: diễn đàn hỏi đáp -------------------------------------------
  'Cộng đồng': 'Community',
  'Đặt câu hỏi, chia sẻ kinh nghiệm học tiếng Anh với mọi người.':
    'Ask questions and share what works for learning English.',

  // Danh sách và bộ lọc
  'Mới nhất': 'Newest',
  'Nhiều tim nhất': 'Most loved',
  'Bài của tôi': 'My posts',
  'Tìm': 'Search',
  'Tìm trong tiêu đề và nội dung': 'Search titles and content',
  'Không tải được danh sách bài viết': 'Could not load the posts',
  'Chưa có bài viết nào': 'No posts yet',
  'Hãy là người mở đầu — đặt một câu hỏi cho cộng đồng.':
    'Be the first — ask the community a question.',
  'Không có bài nào khớp': 'No posts match',
  'Thử bỏ bớt bộ lọc hoặc từ khoá khác.': 'Try clearing a filter or using different words.',
  'Trang {page}/{total}': 'Page {page} of {total}',
  '{n} ảnh': { one: '{n} image', other: '{n} images' },
  '{n} tệp': { one: '{n} file', other: '{n} files' },

  // Soạn bài
  'Đăng bài': 'New post',
  'Đặt câu hỏi hoặc chia sẻ': 'Ask a question or share something',
  'Ví dụ: Làm sao để nhớ từ vựng lâu?': 'For example: How do I remember vocabulary longer?',
  'Mô tả cụ thể giúp người khác trả lời dễ hơn.': 'The more detail you give, the easier it is to help.',
  '{n}/10000 ký tự': '{n}/10000 characters',
  'Đính kèm': 'Attach',
  'Tối đa {n} tệp, mỗi tệp {size}KB. Nhận ảnh, PDF và TXT.':
    'Up to {n} files, {size}KB each. Images, PDF and TXT.',
  'Mỗi bài chỉ đính kèm tối đa {n} tệp': 'A post can have at most {n} attachments',
  'Gỡ tệp {name}': 'Remove {name}',
  'Đã đăng bài': 'Post published',

  // Chi tiết bài viết
  'Bài viết': 'Post',
  'Cấp {n}': 'Level {n}',
  'Không tải được bài viết': 'Could not load the post',
  'Quay lại danh sách': 'Back to list',
  'Thả tim': 'Like',
  'Xoá bài viết': 'Delete post',
  'Xoá bài viết này? Thao tác không thể hoàn tác.': 'Delete this post? This cannot be undone.',
  'Đã xoá bài viết': 'Post deleted',
  'Tải tệp về': 'Download file',
  'Không tải được ảnh': 'Image failed',

  // Bình luận
  'Bình luận ({n})': 'Comments ({n})',
  'Viết bình luận của bạn…': 'Write a comment…',
  'Gửi': 'Send',
  'Chưa có bình luận nào. Hãy là người đầu tiên trả lời.':
    'No comments yet. Be the first to reply.',
  'Xoá bình luận': 'Delete comment',
  'Xoá bình luận này?': 'Delete this comment?',
  'Đã xoá bình luận': 'Comment deleted',

  // --- Tên tài khoản & quên mật khẩu ---
  'Tên tài khoản': 'Username',
  'Email hoặc tên tài khoản': 'Email or username',
  'ban@example.com hoặc tentaikhoan': 'you@example.com or username',
  'vidu: nguyenvana': 'e.g. johndoe',
  'Dùng để đăng nhập. Chỉ gồm chữ không dấu, số và . _ -':
    'Used to sign in. Letters, numbers and . _ - only',

  'Quên mật khẩu': 'Forgot password',
  'Quên mật khẩu?': 'Forgot your password?',
  'Quay lại đăng nhập': 'Back to sign in',
  'Nhập email hoặc tên tài khoản của bạn. Quản trị viên sẽ xem xét yêu cầu.':
    'Enter your email or username. An administrator will review your request.',
  'Đang kiểm tra...': 'Checking...',
  'Đã gửi yêu cầu': 'Request sent',
  'Quản trị viên đã nhận được yêu cầu của bạn. Vui lòng quay lại sau khi được duyệt.':
    'An administrator has received your request. Come back once it has been approved.',
  'Yêu cầu đang chờ duyệt': 'Request pending approval',
  'Đã gửi yêu cầu, đợi quản trị viên xác nhận':
    'Request already sent, waiting for an administrator to confirm',
  'Đã hiểu': 'Got it',
  'Yêu cầu của bạn đã bị từ chối': 'Your request was rejected',
  'Gửi lại yêu cầu': 'Send another request',

  'Đặt mật khẩu mới': 'Set a new password',
  'Yêu cầu của bạn đã được duyệt. Nhập mật khẩu mới để tiếp tục.':
    'Your request has been approved. Enter a new password to continue.',
  'Nhập mật khẩu mới': 'Enter a new password',
  'Xác nhận mật khẩu mới': 'Confirm new password',
  // 'Nhập lại mật khẩu mới' đã có sẵn ở phần đổi mật khẩu trong trang cá nhân — dùng lại
  // đúng khoá đó, không khai thêm bản thứ hai.
  'Đang đổi mật khẩu...': 'Changing password...',
  'Xác nhận': 'Confirm',
  'Đổi mật khẩu thành công': 'Password changed successfully',

  // --- Khu quản trị: quản lý yêu cầu ---
  'Quản lý yêu cầu': 'Request management',
  'Xét duyệt yêu cầu cấp lại mật khẩu của người dùng': 'Review password reset requests from users',
  // Hai khoá này nằm trong mảng hằng số `TABS` nên script check:i18n KHÔNG quét được —
  // thêm hoặc đổi nhãn tab thì phải tự sửa ở đây (xem CLAUDE.md, mục ngôn ngữ).
  'Yêu cầu': 'Requests',
  'Nhật ký': 'Log',
  'Loại danh sách': 'List type',
  'Không có yêu cầu nào đang chờ': 'No pending requests',
  'Khi người dùng gửi yêu cầu cấp lại mật khẩu, yêu cầu sẽ hiện ở đây.':
    'When someone asks for a password reset, their request will appear here.',
  'Nhật ký còn trống': 'The log is empty',
  'Các yêu cầu đã duyệt hoặc từ chối sẽ được ghi lại ở đây.':
    'Approved or rejected requests are recorded here.',
  'Gửi lúc {time}': 'Sent at {time}',
  'Người thực hiện': 'Handled by',
  'Lý do từ chối': 'Rejection reason',
  'Chưa đổi mật khẩu': 'Password not changed yet',
  'Từ chối': 'Reject',
  'Từ chối yêu cầu': 'Reject request',
  'Người dùng sẽ đọc được lý do này, nên hãy nói rõ họ cần làm gì tiếp theo.':
    'The user will read this reason, so make it clear what they should do next.',
  'Ví dụ: Không xác minh được danh tính. Vui lòng liên hệ trực tiếp giáo vụ.':
    'Example: Could not verify your identity. Please contact the academic office directly.',
  'Lý do:': 'Reason:',
  'Lý do không hợp lệ': 'Invalid reason',
  'Đã duyệt yêu cầu': 'Request approved',
  'Đã từ chối yêu cầu': 'Request rejected',
  'Đã xác nhận': 'Approved',
  'Đã từ chối': 'Rejected',
  'Quản trị viên đã bị xoá': 'Deleted administrator',
  'Yêu cầu cấp lại mật khẩu': 'Password reset request',

  // --- Nhóm lớp ---------------------------------------------------------------
  'Nhóm lớp': 'Groups',
  'Tạo nhóm để trao đổi nội bộ, hoặc tham gia nhóm đã có': 'Create a group to talk privately, or join an existing one',
  'Nhóm của tôi': 'My groups',
  'Bạn chưa ở nhóm nào': "You're not in any group yet",
  'Tạo một nhóm mới, hoặc tìm nhóm công khai bên dưới để xin vào.':
    'Create a new group, or find a public one below and ask to join.',
  'Tạo nhóm': 'Create group',
  'Tên nhóm': 'Group name',
  'Ví dụ: Lớp tiếng Anh K65': 'For example: English class K65',
  'Mô tả nhóm': 'Group description',
  'Không bắt buộc — vài dòng để người khác biết nhóm này làm gì':
    'Optional — a line or two so people know what this group is for',
  'Nhóm công khai': 'Public group',
  'Ai cũng tìm thấy nhóm này khi tìm theo tên.': 'Anyone can find this group by name.',
  'Nhóm riêng tư: chỉ vào được nếu biết mã 8 số của nhóm.':
    'Private group: only people with the 8-digit code can join.',
  'Phê duyệt thành viên': 'Approve members',
  'Người xin vào phải chờ trưởng nhóm duyệt.': 'People who ask to join wait for a leader to approve.',
  'Ai có mã hoặc tìm thấy nhóm đều vào được ngay.': 'Anyone with the code or who finds the group joins straight away.',
  'Đã tạo nhóm, mã nhóm là {code}': 'Group created, the code is {code}',

  'Vào nhóm bằng mã': 'Join with a code',
  'Mã nhóm': 'Group code',
  'Gồm {n} chữ số': '{n} digits',
  'Không tìm thấy nhóm nào có mã này': 'No group found with this code',
  'Tìm nhóm công khai': 'Find a public group',
  'Tìm theo tên nhóm': 'Search by group name',
  'Không có nhóm công khai nào khớp': 'No public group matches',
  'Nhóm riêng tư không hiện ở đây — muốn vào thì cần mã 8 số.':
    'Private groups never show up here — you need the 8-digit code.',

  'Công khai': 'Public',
  'Riêng tư': 'Private',
  'Trưởng nhóm': 'Leader',
  'Bạn là trưởng nhóm': "You're a leader",
  'Thành viên': 'Members',
  '{n} thành viên': { one: '{n} member', other: '{n} members' },
  '{n} bài đăng': { one: '{n} post', other: '{n} posts' },
  '{n} chờ duyệt': { one: '{n} waiting', other: '{n} waiting' },
  'Mở nhóm': 'Open group',
  'Xin vào nhóm': 'Ask to join',
  'Vào nhóm': 'Join group',
  'Đang chờ trưởng nhóm duyệt': 'Waiting for a leader to approve',
  'Đã vào nhóm': 'Joined the group',
  'Đã gửi yêu cầu, chờ trưởng nhóm duyệt': 'Request sent, waiting for a leader to approve',

  'Về danh sách nhóm': 'Back to groups',
  'Bạn không xem được nhóm này': "You can't view this group",
  'Nhóm không tồn tại, hoặc bạn chưa phải thành viên.': "The group doesn't exist, or you're not a member yet.",
  'Bảng tin': 'Feed',
  'Cài đặt': 'Settings',
  'Đăng bài trong nhóm': 'Post in this group',
  'Nhóm chưa có bài nào': 'No posts in this group yet',
  'Đăng bài đầu tiên để bắt đầu trao đổi với cả nhóm.': 'Write the first post to get the group talking.',

  'Thêm thành viên': 'Add member',
  'Nhập tên tài khoản hoặc email của người đã có tài khoản':
    'Enter the username or email of someone who already has an account',
  'Thêm': 'Add',
  'Đã thêm {name} vào nhóm': 'Added {name} to the group',
  'Chuỗi': 'Streak',
  'Phong trưởng nhóm': 'Make leader',
  'Hạ quyền': 'Remove leader role',
  'Xoá khỏi nhóm': 'Remove from group',
  'Xoá {name} khỏi nhóm?': 'Remove {name} from the group?',

  'Khi có người xin vào nhóm, yêu cầu sẽ hiện ở đây và bạn nhận được thông báo.':
    "When someone asks to join, the request shows up here and you'll get a notification.",
  'Duyệt': 'Approve',
  'Đã duyệt': 'Approved',

  'Đã lưu thông tin nhóm': 'Group details saved',
  'Tắt thì nhóm biến mất khỏi ô tìm kiếm, chỉ vào được bằng mã {code}':
    'Turn this off and the group disappears from search — only the code {code} gets people in',
  'Tắt thì người tìm được nhóm sẽ vào thẳng, không cần bạn duyệt.':
    'Turn this off and anyone who finds the group joins without your approval.',
  'Vùng nguy hiểm': 'Danger zone',
  'Xoá nhóm sẽ mất toàn bộ bài đăng và danh sách thành viên. Không khôi phục được.':
    'Deleting the group destroys every post and the member list. This cannot be undone.',
  'Xoá nhóm': 'Delete group',
  'Xoá vĩnh viễn nhóm "{name}"?': 'Permanently delete the group "{name}"?',
  'Đã xoá nhóm': 'Group deleted',
  'Rời nhóm': 'Leave group',
  'Rời khỏi nhóm "{name}"?': 'Leave the group "{name}"?',
  'Đã rời nhóm': 'Left the group',

  // Nhãn loại thông báo (notification-display.tsx)
  'Yêu cầu vào nhóm': 'Join request',
  'Được duyệt vào nhóm': 'Join approved',
  'Yêu cầu vào nhóm bị từ chối': 'Join rejected',

  // --- Quản lý nhóm (quản trị viên) -------------------------------------------
  'Quản lý nhóm': 'Manage groups',
  'Giám sát nhóm lớp do người học lập, gửi cảnh báo và chặn nhóm vi phạm':
    'Watch over learner-created groups, send warnings and block groups that break the rules',
  'Tìm nhóm': 'Search groups',
  'Tìm theo tên nhóm hoặc mã': 'Search by group name or code',
  'Lọc theo quyền riêng tư': 'Filter by visibility',
  'Công khai và riêng tư': 'Public and private',
  'Chỉ nhóm công khai': 'Public only',
  'Chỉ nhóm riêng tư': 'Private only',
  'Đang bị chặn': 'Blocked',
  'Mới lập nhất': 'Newest',
  'Nhiều thành viên nhất': 'Most members',
  'Nhiều bài đăng nhất': 'Most posts',
  'Không có nhóm nào khớp': 'No group matches',
  'Nhóm': 'Group',
  'Nhóm không còn trưởng nhóm': 'This group has no leader',
  'Bài đăng': 'Posts',
  'Xem': 'View',
  'Trang {page} / {total}': 'Page {page} of {total}',

  'Thông tin nhóm': 'Group details',
  'Nhóm đang bị chặn': 'This group is blocked',
  'Chặn lúc {time}': 'Blocked at {time}',
  'Quyền riêng tư': 'Visibility',
  'Chờ duyệt': 'Waiting',
  'Bật': 'On',
  'Tắt': 'Off',
  'Bài mới nhất': 'Latest post',
  'Bài đăng gần đây': 'Recent posts',

  'Gửi cảnh báo vi phạm': 'Send a warning',
  'Nội dung cảnh báo': 'Warning message',
  'Ví dụ: Nhóm có bài đăng sai nội quy, đề nghị trưởng nhóm rà soát lại.':
    'For example: This group has posts that break the rules — leaders, please review them.',
  'Mọi thành viên trong nhóm đều nhận được thông báo này.': 'Every member of the group receives this notification.',
  'Gửi cảnh báo': 'Send warning',
  'Đã gửi cảnh báo tới {n} thành viên': { one: 'Warning sent to {n} member', other: 'Warning sent to {n} members' },

  'Chặn nhóm': 'Block group',
  'Lý do chặn nhóm': 'Reason for blocking',
  'Ví dụ: Nhóm chia sẻ nội dung vi phạm nội quy học tập.':
    'For example: This group shares content that breaks the study rules.',
  'Thành viên nhóm sẽ đọc đúng câu này khi mở nhóm, nên viết cho họ hiểu.':
    'Group members read this exact text when they open the group, so write it for them.',
  'Đã chặn nhóm': 'Group blocked',
  'Mở chặn nhóm': 'Unblock group',
  'Đã mở chặn nhóm': 'Group unblocked',

  'Nhóm này đang bị chặn': 'This group is blocked',
  'Bị chặn lúc {time} bởi quản trị viên. Liên hệ quản trị viên nếu bạn cho rằng có nhầm lẫn.':
    'Blocked at {time} by an administrator. Contact them if you think this is a mistake.',

  // Nhãn loại thông báo mới
  'Cảnh báo vi phạm': 'Rule warning',
  'Nhóm bị chặn': 'Group blocked',
  'Nhóm được mở chặn': 'Group unblocked',

  // --- Hộp thoại xác nhận -----------------------------------------------------
  'Bạn có chắc muốn tiếp tục?': 'Are you sure you want to continue?',
  'Xoá mục tiêu': 'Delete goal',
  'Tiến độ đã đạt của mục tiêu sẽ không còn được theo dõi.':
    'The progress recorded for this goal will no longer be tracked.',
  'Xoá thói quen "{name}"?': 'Delete the habit "{name}"?',
  'Lịch sử check-in của thói quen này cũng mất theo và không khôi phục được.':
    'Its check-in history goes with it and cannot be recovered.',
  'Xoá bài viết này?': 'Delete this post?',
  'Bình luận và tệp đính kèm của bài cũng mất theo. Thao tác không thể hoàn tác.':
    'Its comments and attachments go with it. This cannot be undone.',
  'Gửi thông báo tới {n} người dùng?': {
    one: 'Send this notification to {n} user?',
    other: 'Send this notification to {n} users?',
  },
  'Đã gửi thì không thu hồi được.': "Once sent, it can't be taken back.",
  'Người này sẽ mất quyền đọc bài trong nhóm, nhưng vẫn xin vào lại được.':
    'They lose access to the group feed, but can ask to join again.',
  'Toàn bộ bài đăng và danh sách thành viên sẽ mất. Không khôi phục được.':
    'Every post and the member list will be gone. This cannot be recovered.',
  'Bạn sẽ không đọc được bài trong nhóm nữa cho tới khi vào lại.':
    "You won't be able to read the group feed until you join again.",
  'Xoá vĩnh viễn {email}?': 'Permanently delete {email}?',
  'Toàn bộ {n} hoạt động, chuỗi ngày và tiến độ học sẽ mất và không khôi phục được. Nếu chỉ muốn chặn đăng nhập, hãy dùng "Khoá tài khoản".':
    'All {n} activities, the streak and every bit of learning progress will be gone for good. To block sign-in only, use "Lock account" instead.',
  'Xoá chủ đề': 'Delete topic',
  'Xoá chủ đề "{name}"?': 'Delete the topic "{name}"?',
  'Toàn bộ từ vựng và quiz thuộc chủ đề này sẽ mất theo.':
    'Every word and quiz under this topic goes with it.',

  // --- Bộ lọc diễn đàn ---------------------------------------------------------
  'Lọc': 'Filter',
  'Bài tôi đã thích': 'Posts I liked',
  'Có tệp đính kèm': 'With attachments',
  'Chưa có trả lời': 'No replies yet',
  'Bỏ tất cả bộ lọc ({n})': 'Clear all filters ({n})',
  'Các bộ lọc cộng dồn với nhau — bỏ bớt một cái hoặc đổi từ khoá.':
    'Filters stack on top of each other — drop one or change your search.',

  'Đăng bài viết': 'New post',

  'Xác nhận hủy đăng bài?': 'Discard this post?',
  'Nội dung bạn đang soạn sẽ mất.': "What you've written will be lost.",
  'Hủy đăng bài': 'Discard',
  'Tiếp tục soạn': 'Keep writing',

  // --- Lịch hoạt động khi chưa có dữ liệu ---
  'Chưa có ngày học nào': 'No study days yet',
  'Học một bài bất kỳ hôm nay là ô đầu tiên sáng lên, và chuỗi ngày của bạn bắt đầu.':
    'Study anything today and the first square lights up — that starts your streak.',
  'Học ngay': 'Start learning',

  // --- Xu và chuỗi ngày là hai thứ khác nhau ---
  'NHẬN {n} XU MỖI NGÀY': 'CLAIM {n} COINS TODAY',
  'ĐÃ NHẬN XU HÔM NAY': 'COINS CLAIMED TODAY',
  'Xu không tính vào chuỗi ngày. Muốn giữ chuỗi, hãy học một bài, ôn thẻ, làm quiz hoặc check-in một thói quen.':
    'Coins do not count toward your streak. To keep it alive, study a lesson, review cards, take a quiz or check in a habit.',
  'Hôm nay đã được tính': "Today already counts",
  'Hôm nay chưa được tính — học một bài để giữ chuỗi':
    "Today doesn't count yet — study something to keep the streak",

  // --- Nhóm lớp: hai tab, bộ lọc và vào nhóm bằng mã ---
  'Khám phá nhóm': 'Discover groups',
  'Nhập ID nhóm': 'Enter group ID',
  'Yêu cầu vào': 'Ask to join',
  'Là thành viên': 'Member',
  'Là trưởng nhóm': 'Group leader',
  'Lọc theo vai trò trong nhóm': 'Filter by role in group',
  'Bạn chưa làm trưởng nhóm ở nhóm nào': 'You do not lead any group yet',
  'Bạn là trưởng nhóm ở tất cả các nhóm của mình': 'You lead every group you belong to',
  'Chọn "Tất cả" để xem lại toàn bộ nhóm của bạn.': 'Pick "All" to see every group you belong to.',
  'Tạo một nhóm mới, hoặc sang tab Khám phá nhóm để xin vào một nhóm công khai.':
    'Create a group, or open the Discover groups tab to ask to join a public one.',
};
