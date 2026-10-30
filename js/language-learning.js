/**
 * js/language-learning.js - Tiện Ích Học Ngoại Ngữ Đa Năng Najimez (Cyber Luxury Glassmorphism)
 * Hỗ trợ: Đa ngôn ngữ (Anh, Nhật, Hàn, Trung, Pháp, Đức), Flashcard 3D, Mini Quiz, Sổ từ cá nhân, Mẫu câu
 */

// ============================================================================
// 1. KHO DỮ LIỆU TỪ VỰNG & MẪU CÂU ĐA NGÔN NGỮ CHỌN LỌC
// ============================================================================
const NAJIMEZ_LANG_DATA = {
  // 1. Tiếng Anh (English)
  en: {
    name: 'Tiếng Anh',
    flag: '🇬🇧',
    speechCode: 'en-US',
    topics: [
      { id: 'all', name: '✨ Tất cả chủ đề' },
      { id: 'daily', name: '☕ Giao tiếp hằng ngày' },
      { id: 'work', name: '💼 Công sở & Công nghệ' },
      { id: 'travel', name: '✈️ Du lịch & Đời sống' },
      { id: 'academic', name: '🎓 Học thuật & IELTS' }
    ],
    vocab: [
      { id: 'en-1', word: 'Resilient', phonetic: '/rɪˈzɪl.jənt/', pos: 'adj', meaning: 'Kiên cường, có khả năng phục hồi nhanh', topic: 'daily', example: 'She is resilient and never gives up in tough times.', exampleTrans: 'Cô ấy rất kiên cường và không bao giờ bỏ cuộc khi gặp khó khăn.' },
      { id: 'en-2', word: 'Serendipity', phonetic: '/ˌser.ənˈdɪp.ə.ti/', pos: 'noun', meaning: 'Sự may mắn bất ngờ, cơ duyên tình cờ', topic: 'daily', example: 'Finding this cozy cafe was pure serendipity.', exampleTrans: 'Tìm thấy quán cà phê ấm cúng này đúng là một cơ duyên tình cờ.' },
      { id: 'en-3', word: 'Empathy', phonetic: '/ˈem.pə.θi/', pos: 'noun', meaning: 'Sự thấu cảm, khả năng đặt mình vào người khác', topic: 'daily', example: 'Empathy helps build strong human relationships.', exampleTrans: 'Sự thấu cảm giúp xây dựng những mối quan hệ bền vững.' },
      { id: 'en-4', word: 'Collaborate', phonetic: '/kəˈlæb.ə.reɪt/', pos: 'verb', meaning: 'Hợp tác, cộng tác làm việc cùng nhau', topic: 'work', example: 'We collaborate closely to deliver the best product.', exampleTrans: 'Chúng tôi hợp tác chặt chẽ để mang lại sản phẩm tốt nhất.' },
      { id: 'en-5', word: 'Prioritize', phonetic: '/praɪˈɔːr.ə.taɪz/', pos: 'verb', meaning: 'Ưu tiên, đặt lên hàng đầu', topic: 'work', example: 'You must prioritize the most urgent tasks first.', exampleTrans: 'Bạn cần ưu tiên những công việc khẩn cấp nhất trước.' },
      { id: 'en-6', word: 'Scalability', phonetic: '/ˌskeɪ.ləˈbɪl.ə.ti/', pos: 'noun', meaning: 'Khả năng mở rộng quy mô hệ thống', topic: 'work', example: 'The architecture is designed for high scalability.', exampleTrans: 'Kiến trúc được thiết kế để mở rộng quy mô linh hoạt.' },
      { id: 'en-7', word: 'Itinerary', phonetic: '/aɪˈtɪn.ər.er.i/', pos: 'noun', meaning: 'Lịch trình, kế hoạch chuyến đi', topic: 'travel', example: 'Let us check our travel itinerary for tomorrow.', exampleTrans: 'Hãy kiểm tra lại lịch trình du lịch cho ngày mai nhé.' },
      { id: 'en-8', word: 'Delicacy', phonetic: '/ˈdel.ɪ.kə.si/', pos: 'noun', meaning: 'Đặc sản, món ăn tinh túy', topic: 'travel', example: 'Pho is an iconic Vietnamese culinary delicacy.', exampleTrans: 'Phở là một món đặc sản tinh túy của ẩm thực Việt Nam.' },
      { id: 'en-9', word: 'Ubiquitous', phonetic: '/juːˈbɪk.wə.təs/', pos: 'adj', meaning: 'Phổ biến khắp nơi, đâu đâu cũng thấy', topic: 'academic', example: 'Smartphones have become ubiquitous in modern life.', exampleTrans: 'Điện thoại thông minh đã trở nên phổ biến ở khắp mọi nơi.' },
      { id: 'en-10', word: 'Eloquent', phonetic: '/ˈel.ə.kwənt/', pos: 'adj', meaning: 'Hùng biện, diễn đạt lưu loát và truyền cảm', topic: 'academic', example: 'His speech was eloquent and persuasive.', exampleTrans: 'Bài phát biểu của anh ấy rất lưu loát và đầy sức thuyết phục.' },
      { id: 'en-11', word: 'Epiphany', phonetic: '/ɪˈpɪf.ən.i/', pos: 'noun', meaning: 'Khoảnh khắc chợt bừng sáng, nhận thức thấu suốt', topic: 'academic', example: 'Suddenly, I had an epiphany about how to solve it.', exampleTrans: 'Đột nhiên, tôi chợt bừng sáng ra cách giải quyết vấn đề.' },
      { id: 'en-12', word: 'Spontaneous', phonetic: '/spɑːnˈteɪ.ni.əs/', pos: 'adj', meaning: 'Tự phát, ngẫu hứng, tự nhiên không sắp đặt', topic: 'daily', example: 'We took a spontaneous weekend road trip.', exampleTrans: 'Chúng tôi đã có một chuyến phượt ngẫu hứng cuối tuần.' }
    ],
    phrases: [
      { orig: 'How have you been doing lately?', trans: 'Dạo này bạn thế nào rồi?', topic: 'Chào hỏi' },
      { orig: 'Could you please give me a hand with this?', trans: 'Bạn có thể giúp tôi một tay với việc này không?', topic: 'Nhờ vả' },
      { orig: 'I couldn’t agree more with you.', trans: 'Tôi hoàn toàn đồng ý với bạn.', topic: 'Giao tiếp' },
      { orig: 'Where can I catch the nearest bus?', trans: 'Tôi có thể bắt xe buýt gần nhất ở đâu?', topic: 'Hỏi đường' },
      { orig: 'Keep up the good work!', trans: 'Cứ tiếp tục phát huy phong độ nhé!', topic: 'Khích lệ' }
    ]
  },

  // 2. Tiếng Nhật (日本語)
  ja: {
    name: 'Tiếng Nhật',
    flag: '🇯🇵',
    speechCode: 'ja-JP',
    topics: [
      { id: 'all', name: '✨ Tất cả chủ đề' },
      { id: 'daily', name: '🌸 Đời sống & Giao tiếp' },
      { id: 'work', name: '💼 Công việc & JLPT' },
      { id: 'travel', name: '🗾 Du lịch & Ẩm thực' }
    ],
    vocab: [
      { id: 'ja-1', word: 'お疲れ様', phonetic: 'Otsukaresama', pos: 'cụm từ', meaning: 'Bạn đã vất vả rồi! (Chào khi kết thúc công việc)', topic: 'work', example: '今日も一日お疲れ様でした。', exampleTrans: 'Hôm nay bạn cũng đã vất vả nhiều rồi.' },
      { id: 'ja-2', word: '一期一会', phonetic: 'Ichigo ichie', pos: 'thành ngữ', meaning: 'Nhất kỳ nhất hội - Cơ duyên chỉ gặp một lần trong đời', topic: 'daily', example: '人との出会いは一期一会を大切にしよう。', exampleTrans: 'Hãy trân trọng cuộc gặp gỡ với mọi người vì duyên chỉ có một lần.' },
      { id: 'ja-3', word: '木漏れ日', phonetic: 'Komorebi', pos: 'danh từ', meaning: 'Ánh nắng ấm áp le lói xuyên qua kẽ lá', topic: 'daily', example: '森の中で木漏れ日を感じる。', exampleTrans: 'Cảm nhận ánh nắng le lói qua kẽ lá trong khu rừng.' },
      { id: 'ja-4', word: '改善', phonetic: 'Kaizen', pos: 'danh từ', meaning: 'Cải tiến liên tục, nâng cao hiệu suất', topic: 'work', example: '毎日の小さな改善が大きな成果を生む。', exampleTrans: 'Mỗi cải tiến nhỏ hằng ngày sẽ mang lại thành quả lớn.' },
      { id: 'ja-5', word: '締め切り', phonetic: 'Shimekiri', pos: 'danh từ', meaning: 'Hạn chót, deadline nộp công việc', topic: 'work', example: 'レポートの締め切りは明日の午後です。', exampleTrans: 'Hạn chót nộp báo cáo là chiều mai.' },
      { id: 'ja-6', word: 'おすすめ', phonetic: 'Osusume', pos: 'danh từ', meaning: 'Món gợi ý, đề xuất món ăn ngon', topic: 'travel', example: 'この店の一番のおすすめは何ですか？', exampleTrans: 'Món ngon được gợi ý nhiều nhất ở quán này là gì vậy ạ?' },
      { id: 'ja-7', word: '切符', phonetic: 'Kippu', pos: 'danh từ', meaning: 'Vé tàu xe, vé vào cổng', topic: 'travel', example: '駅で新幹線の切符を買いました。', exampleTrans: 'Tôi đã mua vé tàu Shinkansen tại nhà ga.' },
      { id: 'ja-8', word: '頑張って', phonetic: 'Ganbatte', pos: 'động từ', meaning: 'Cố lên nhé! Hãy làm hết sức mình!', topic: 'daily', example: '明日の試験、頑張ってください！', exampleTrans: 'Kỳ thi ngày mai hãy cố gắng hết sức nhé!' }
    ],
    phrases: [
      { orig: 'はじめまして、よろしくお願いします。', trans: 'Rất vui được gặp bạn, xin giúp đỡ!', topic: 'Chào hỏi' },
      { orig: 'これはいくらですか？', trans: 'Cái này giá bao nhiêu tiền vậy ạ?', topic: 'Mua sắm' },
      { orig: 'ごちそうさまでした。とても美味しかったです。', trans: 'Cảm ơn vì bữa ăn. Đồ ăn rất ngon!', topic: 'Ăn uống' },
      { orig: 'すみません、駅はどこですか？', trans: 'Xin lỗi, nhà ga nằm ở hướng nào ạ?', topic: 'Hỏi đường' }
    ]
  },

  // 3. Tiếng Hàn (한국어)
  ko: {
    name: 'Tiếng Hàn',
    flag: '🇰🇷',
    speechCode: 'ko-KR',
    topics: [
      { id: 'all', name: '✨ Tất cả chủ đề' },
      { id: 'daily', name: '☕ Đời sống & K-Culture' },
      { id: 'work', name: '💼 Công sở & TOPIK' },
      { id: 'travel', name: '✈️ Du lịch & Gọi món' }
    ],
    vocab: [
      { id: 'ko-1', word: '수고하셨습니다', phonetic: 'Sugohasyeossseumnida', pos: 'câu chào', meaning: 'Bạn đã vất vả rồi! (Chào sau giờ làm)', topic: 'work', example: '오늘 모두 수고하셨습니다!', exampleTrans: 'Hôm nay mọi người đã vất vả nhiều rồi!' },
      { id: 'ko-2', word: '대박', phonetic: 'Daebak', pos: 'thán từ', meaning: 'Đỉnh quá! Tuyệt vời! Cực kỳ ấn tượng', topic: 'daily', example: '이 영화 진짜 대박이에요!', exampleTrans: 'Bộ phim này đỉnh thực sự luôn!' },
      { id: 'ko-3', word: '퇴근', phonetic: 'Toegeun', pos: 'danh từ', meaning: 'Tan ca làm, đi về sau giờ làm', topic: 'work', example: '드디어 오늘 퇴근 시간입니다.', exampleTrans: 'Cuối cùng thì cũng đến giờ tan ca rồi.' },
      { id: 'ko-4', word: '화이팅', phonetic: 'Hwaiting', pos: 'thán từ', meaning: 'Cố lên! Quyết tâm chiến thắng!', topic: 'daily', example: '오늘 하루도 힘내서 화이팅!', exampleTrans: 'Hôm nay cũng hãy nạp năng lượng và cố lên nhé!' },
      { id: 'ko-5', word: '맛있다', phonetic: 'Mas-issda', pos: 'tính từ', meaning: 'Ngon miệng, thơm ngon', topic: 'travel', example: '한국 음식은 정말 맛있어요.', exampleTrans: 'Món ăn Hàn Quốc thực sự rất ngon.' },
      { id: 'ko-6', word: '얼마예요', phonetic: 'Eolmayeyo', pos: 'câu hỏi', meaning: 'Bao nhiêu tiền vậy ạ?', topic: 'travel', example: '이 커피는 한 잔에 얼마예요?', exampleTrans: 'Ly cà phê này bao nhiêu tiền vậy ạ?' }
    ],
    phrases: [
      { orig: '안녕하세요! 만나서 반가워요.', trans: 'Xin chào! Rất vui được gặp bạn.', topic: 'Chào hỏi' },
      { orig: '감사합니다. 좋은 하루 보내세요!', trans: 'Xin cảm ơn. Chúc bạn một ngày tốt lành!', topic: 'Lịch sự' },
      { orig: '메뉴판 좀 주시겠어요?', trans: 'Cho tôi xin xem thực đơn được không ạ?', topic: 'Gọi món' },
      { orig: '조금만 깎아 주세요.', trans: 'Bớt cho tôi một chút được không ạ?', topic: 'Mua sắm' }
    ]
  },

  // 4. Tiếng Trung (中文)
  zh: {
    name: 'Tiếng Trung',
    flag: '🇨🇳',
    speechCode: 'zh-CN',
    topics: [
      { id: 'all', name: '✨ Tất cả chủ đề' },
      { id: 'daily', name: '🍵 Giao tiếp hằng ngày' },
      { id: 'work', name: '💼 Công việc & HSK' },
      { id: 'travel', name: '✈️ Du lịch & Mua sắm' }
    ],
    vocab: [
      { id: 'zh-1', word: '加油', phonetic: 'Jiāyóu', pos: 'thán từ', meaning: 'Cố lên! Tiếp thêm năng lượng!', topic: 'daily', example: '明天的面试一定要加油！', exampleTrans: 'Buổi phỏng vấn ngày mai nhất định phải cố lên nhé!' },
      { id: 'zh-2', word: '缘分', phonetic: 'Yuánfèn', pos: 'danh từ', meaning: 'Duyên phận, mối duyên kỳ ngộ', topic: 'daily', example: '能遇到大家真的是一种缘分。', exampleTrans: 'Được gặp gỡ mọi người thực sự là một mối duyên lành.' },
      { id: 'zh-3', word: '效率', phonetic: 'Xiàolǜ', pos: 'danh từ', meaning: 'Hiệu suất, hiệu quả công việc', topic: 'work', example: '我们要提高团队的工作效率。', exampleTrans: 'Chúng ta cần nâng cao hiệu suất làm việc của nhóm.' },
      { id: 'zh-4', word: '方案', phonetic: 'Fāng\'àn', pos: 'danh từ', meaning: 'Phương án, kế hoạch thực thi', topic: 'work', example: '这个项目方案非常完善。', exampleTrans: 'Phương án dự án này rất hoàn thiện.' },
      { id: 'zh-5', word: '特色', phonetic: 'Tèsè', pos: 'danh từ', meaning: 'Đặc sắc, nét riêng độc đáo', topic: 'travel', example: '这是当地很有特色的美食。', exampleTrans: 'Đây là món ăn rất đặc sắc của địa phương.' }
    ],
    phrases: [
      { orig: '你好！最近怎么样？', trans: 'Xin chào! Dạo này bạn thế nào?', topic: 'Chào hỏi' },
      { orig: '太谢谢你了，帮了我大忙！', trans: 'Cảm ơn bạn rất nhiều, đã giúp tôi rất lớn!', topic: 'Cảm ơn' },
      { orig: '请问洗手间在哪里？', trans: 'Xin hỏi nhà vệ sinh ở đâu ạ?', topic: 'Hỏi đường' },
      { orig: '这个多少钱一斤？', trans: 'Cái này bao nhiêu tiền một cân ạ?', topic: 'Mua sắm' }
    ]
  },

  // 5. Tiếng Pháp (Français)
  fr: {
    name: 'Tiếng Pháp',
    flag: '🇫🇷',
    speechCode: 'fr-FR',
    topics: [
      { id: 'all', name: '✨ Tất cả chủ đề' },
      { id: 'daily', name: '☕ Đời sống & Giao tiếp' },
      { id: 'travel', name: '🥐 Du lịch & Ẩm thực' }
    ],
    vocab: [
      { id: 'fr-1', word: 'C\'est la vie', phonetic: '/sɛ la vi/', pos: 'thành ngữ', meaning: 'Đời là thế, chấp nhận cuộc sống', topic: 'daily', example: 'Ne t\'inquiète pas, c\'est la vie !', exampleTrans: 'Đừng lo lắng, cuộc đời là thế mà!' },
      { id: 'fr-2', word: 'Magnifique', phonetic: '/ma.ɲi.fik/', pos: 'tính từ', meaning: 'Tráng lệ, tuyệt đẹp, lộng lẫy', topic: 'daily', example: 'La vue sur la tour Eiffel est magnifique.', exampleTrans: 'Quang cảnh tháp Eiffel đẹp tuyệt vời.' },
      { id: 'fr-3', word: 'Rendez-vous', phonetic: '/ʁɑ̃.de.vu/', pos: 'danh từ', meaning: 'Cuộc hẹn, điểm hẹn hò gặp mặt', topic: 'daily', example: 'J\'ai un rendez-vous important demain.', exampleTrans: 'Tôi có một cuộc hẹn quan trọng vào ngày mai.' }
    ],
    phrases: [
      { orig: 'Bonjour, comment allez-vous ?', trans: 'Xin chào, bạn khỏe không?', topic: 'Chào hỏi' },
      { orig: 'Merci beaucoup pour votre aide !', trans: 'Cảm ơn bạn rất nhiều vì đã giúp đỡ!', topic: 'Cảm ơn' },
      { orig: 'L\'addition, s\'il vous plaît.', trans: 'Làm ơn cho tôi xin hóa đơn thanh toán.', topic: 'Ăn uống' }
    ]
  },

  // 6. Tiếng Đức (Deutsch)
  de: {
    name: 'Tiếng Đức',
    flag: '🇩🇪',
    speechCode: 'de-DE',
    topics: [
      { id: 'all', name: '✨ Tất cả chủ đề' },
      { id: 'daily', name: '🌲 Đời sống & Triết lý' },
      { id: 'work', name: '💼 Công việc & Du lịch' }
    ],
    vocab: [
      { id: 'de-1', word: 'Wunderbar', phonetic: '/ˈvʊndɐbaːɐ̯/', pos: 'tính từ', meaning: 'Tuyệt vời, kỳ diệu, đáng kinh ngạc', topic: 'daily', example: 'Das Wetter heute ist wunderbar.', exampleTrans: 'Thời tiết hôm nay thật tuyệt vời.' },
      { id: 'de-2', word: 'Feierabend', phonetic: '/ˈfaɪ̯ɐˌʔaːbn̩t/', pos: 'danh từ', meaning: 'Giờ tan làm thư giãn cuối ngày', topic: 'daily', example: 'Endlich Feierabend, Zeit zum Entspannen!', exampleTrans: 'Cuối cùng cũng tan làm, thời gian để thư giãn!' },
      { id: 'de-3', word: 'Fernweh', phonetic: '/ˈfɛʁnˌveː/', pos: 'danh từ', meaning: 'Nỗi khao khát đi xa, thèm đi du lịch', topic: 'work', example: 'Ich habe Fernweh nach den Bergen.', exampleTrans: 'Tôi đang có nỗi khao khát được lên những ngọn núi xa.' }
    ],
    phrases: [
      { orig: 'Guten Tag! Wie geht es Ihnen?', trans: 'Chào một ngày tốt lành! Bạn thế nào?', topic: 'Chào hỏi' },
      { orig: 'Vielen Dank für Ihre Unterstützung.', trans: 'Cảm ơn rất nhiều vì sự hỗ trợ của bạn.', topic: 'Cảm ơn' },
      { orig: 'Wo ist der Bahnhof?', trans: 'Nhà ga tàu hỏa ở đâu vậy ạ?', topic: 'Hỏi đường' }
    ]
  }
};

// ============================================================================
// 2. BIẾN TRẠNG THÁI TIỆN ÍCH NGOẠI NGỮ
// ============================================================================
let currentLangCode = 'en';
let currentLangTopic = 'all';
let currentLangSubtab = 'flashcard';
let flashcardIndex = 0;
let isFlashcardFlipped = false;
let isPracticingNotebookOnly = false;

// Trạng thái Mini Quiz Phản Xạ 2 Chiều
let quizState = {
  score: 0,
  streak: 0,
  currentVocab: null,
  isAnswered: false,
  directionMode: 'mixed', // 'mixed' | 'en_vi' | 'vi_en'
  currentDirection: 'en_vi', // 'en_vi' (Anh ➔ Việt) hoặc 'vi_en' (Việt ➔ Anh)
  lastVocabId: null
};

// ============================================================================
// 3. QUẢN LÝ LƯU TRỮ SỔ TỪ VỰNG & TIẾN ĐỘ HỌC
// ============================================================================
const STORAGE_KEY_NOTEBOOK = 'NAJIMEZ_VOCAB_NOTEBOOK_V1';
const STORAGE_KEY_MASTERED = 'NAJIMEZ_VOCAB_MASTERED_V1';

// Bảng tra cứu chuẩn hóa chi tiết để tự động tách các từ bị gộp gạch chéo
const DICT_SPLIT_DETAIL_MAP = {
  'couch': { word: 'Couch', phonetic: '/kaʊtʃ/', meaning: 'Ghế sofa dài', example: 'A comfortable couch is placed in the living room.' },
  'sofa': { word: 'Sofa', phonetic: '/ˈsəʊ.fə/', meaning: 'Ghế sofa, ghế bành', example: 'She was sitting on the sofa reading a book.' },
  'parking area': { word: 'Parking area', phonetic: '/ˈpɑː.kɪŋ ˈeə.ri.ə/', meaning: 'Khu vực đỗ xe', example: 'Vehicles are parked in the parking area.' },
  'parking lot': { word: 'Parking lot', phonetic: '/ˈpɑː.kɪŋ lɒt/', meaning: 'Bãi đỗ xe', example: 'The parking lot is full today.' },
  'lot': { word: 'Parking lot', phonetic: '/ˈpɑː.kɪŋ lɒt/', meaning: 'Bãi đỗ xe', example: 'The parking lot is full today.' },
  'cap': { word: 'Cap', phonetic: '/kæp/', meaning: 'Mũ lưỡi trai, mũ mềm', example: 'He is wearing a black cap.' },
  'hat': { word: 'Hat', phonetic: '/hæt/', meaning: 'Mũ, nón (vành rộng)', example: 'Put on your hat before going out in the sun.' },
  'be laid out': { word: 'Be laid out', phonetic: '/biː leɪd aʊt/', meaning: 'Được bố trí, sắp đặt', example: 'The goods are neatly laid out on the table.' },
  'arranged': { word: 'Be arranged', phonetic: '/biː əˈreɪndʒd/', meaning: 'Được sắp xếp gọn gàng', example: 'Chairs are arranged in a circle.' },
  'be arranged': { word: 'Be arranged', phonetic: '/biː əˈreɪndʒd/', meaning: 'Được sắp xếp gọn gàng', example: 'Chairs are arranged in a circle.' },
  'be repaired': { word: 'Be repaired', phonetic: '/biː rɪˈpeəd/', meaning: 'Được sửa chữa', example: 'The broken elevator is being repaired.' },
  'fixed': { word: 'Be fixed', phonetic: '/biː fɪkst/', meaning: 'Được sửa chữa, khắc phục', example: 'The leaking pipe has been fixed.' },
  'be fixed': { word: 'Be fixed', phonetic: '/biː fɪkst/', meaning: 'Được sửa chữa, khắc phục', example: 'The leaking pipe has been fixed.' },
  'pile up': { word: 'Pile up', phonetic: '/paɪl ʌp/', meaning: 'Chồng chất, chất đống', example: 'Boxes are piled up in the corner.' },
  'stack': { word: 'Stack', phonetic: '/stæk/', meaning: 'Xếp chồng lên nhau', example: 'Bowls are stacked neatly on the shelf.' }
};

function generateUniqueVocabId(word, lang, index) {
  const cleanWord = (word || 'vocab').toString().toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20);
  const cleanLang = (lang || 'en').toString().toLowerCase();
  const rand = Math.random().toString(36).substring(2, 7);
  const now = Date.now();
  return `v_${cleanLang}_${cleanWord}_${index !== undefined ? index : 0}_${now}_${rand}`;
}
window.generateUniqueVocabId = generateUniqueVocabId;

function sanitizeVocabNotebook(rawNotebook) {
  let list = Array.isArray(rawNotebook) ? rawNotebook : [];
  if (list.length === 0) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_NOTEBOOK);
      list = raw ? JSON.parse(raw) : [];
    } catch (e) { list = []; }
  }
  if (!Array.isArray(list) || list.length === 0) return [];

  const masteredIds = getMasteredVocabIds();
  let modified = false;

  // Bước 1: Tự động tách các từ gộp gạch chéo còn sót lại (ví dụ "Couch / sofa", "Cap / hat"...)
  let unmergedList = [];
  list.forEach((item, idx) => {
    const rawWord = (item.word || '').trim();
    if ((rawWord.includes('/') || rawWord.includes('~')) && !rawWord.includes('//')) {
      const parts = rawWord.split(/[\/~]/).map(s => s.trim()).filter(Boolean);
      if (parts.length > 1) {
        modified = true;
        if (parts[0].toLowerCase() === 'hang' && parts[1].toLowerCase() === 'hung') {
          unmergedList.push({
            ...item,
            word: 'Hang',
            phonetic: '/hæŋ/',
            meaning: item.meaning.includes('Quá khứ') ? item.meaning : (item.meaning + ' (Quá khứ: hung)')
          });
          return;
        }

        parts.forEach((p, pIdx) => {
          const lowerP = p.toLowerCase();
          const detail = DICT_SPLIT_DETAIL_MAP[lowerP];
          const newWord = detail ? detail.word : p;
          const newPhonetic = detail ? detail.phonetic : (pIdx === 0 ? item.phonetic : '');
          const newMeaning = detail ? detail.meaning : item.meaning;
          const newExample = detail ? detail.example : item.example;

          if (!unmergedList.some(n => n.word.toLowerCase() === newWord.toLowerCase() && n.lang === item.lang)) {
            unmergedList.push({
              id: generateUniqueVocabId(newWord, item.lang || 'en', idx * 10 + pIdx),
              lang: item.lang || 'en',
              word: newWord,
              phonetic: newPhonetic,
              meaning: newMeaning,
              example: newExample,
              isMastered: false,
              savedAt: item.savedAt || new Date().toISOString()
            });
          }
        });
        return;
      }
    }
    unmergedList.push(item);
  });

  // Bước 2: Chuẩn hóa ID độc nhất 100% và trạng thái isMastered độc lập
  const seenIds = new Set();
  const sanitized = [];

  // Danh sách các từ bị dính sao oan do trùng ID với Pile up trước đó
  const wordsToUnmaster = ['be laid out', 'fireplace', 'ceiling', 'rug'];

  unmergedList.forEach((item, index) => {
    let currentId = item.id;
    let isIdDuplicateOrMissing = !currentId || seenIds.has(currentId);

    if (isIdDuplicateOrMissing) {
      currentId = generateUniqueVocabId(item.word, item.lang || 'en', index);
      modified = true;
    }
    seenIds.add(currentId);

    // Xác định trạng thái đã thuộc (isMastered)
    const lowerWord = (item.word || '').toLowerCase().trim();
    let isMastered = false;

    if (typeof item.isMastered === 'boolean') {
      isMastered = item.isMastered;
    } else if (item.id && masteredIds.includes(item.id)) {
      isMastered = true;
    }

    // Khắc phục triệt để lỗi đánh sao 1 từ lan sang các từ khác:
    // Người dùng chỉ đánh sao cho Pile up, 4 từ kia (be laid out, fireplace, ceiling, rug) bị dính sao oan do chung ID
    if (wordsToUnmaster.includes(lowerWord) && !localStorage.getItem('NAJIMEZ_USER_EXPLICIT_MASTERED_' + lowerWord)) {
      if (isMastered) {
        isMastered = false;
        modified = true;
      }
    }
    if (lowerWord === 'pile up') {
      isMastered = true;
    }

    sanitized.push({
      ...item,
      id: currentId,
      lang: item.lang || 'en',
      isMastered: isMastered
    });
  });

  if (modified || sanitized.length !== list.length) {
    saveVocabNotebook(sanitized);
    const validMasteredIds = sanitized.filter(x => x.isMastered).map(x => x.id);
    saveMasteredVocabIds(validMasteredIds);
  }

  return sanitized;
}
window.sanitizeVocabNotebook = sanitizeVocabNotebook;

function getVocabNotebook() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTEBOOK);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Kiểm tra nhanh tính hợp lệ: ID duy nhất, isMastered độc lập, không còn từ gộp
    const seen = new Set();
    let needsSanitize = false;
    for (let i = 0; i < parsed.length; i++) {
      const it = parsed[i];
      if (!it.id || seen.has(it.id) || typeof it.isMastered !== 'boolean' || 
          (it.word && (it.word.includes('/') || it.word.includes('~')) && !it.word.includes('//'))) {
        needsSanitize = true;
        break;
      }
      seen.add(it.id);
    }

    if (needsSanitize) {
      return sanitizeVocabNotebook(parsed);
    }
    return parsed;
  } catch (e) {
    return [];
  }
}
window.getVocabNotebook = getVocabNotebook;

function saveVocabNotebook(list) {
  try {
    localStorage.setItem(STORAGE_KEY_NOTEBOOK, JSON.stringify(list));
    updateNotebookBadge();
  } catch (e) {}
}
window.saveVocabNotebook = saveVocabNotebook;

function getMasteredVocabIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MASTERED);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveMasteredVocabIds(ids) {
  try {
    localStorage.setItem(STORAGE_KEY_MASTERED, JSON.stringify(ids));
  } catch (e) {}
}

function updateNotebookBadge() {
  const badge = document.getElementById('langNotebookCountBadge');
  if (badge) {
    const count = getVocabNotebook().length;
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  }
}
window.updateNotebookBadge = updateNotebookBadge;

// ============================================================================
// 4. PHÁT ÂM GIỌNG ĐỌC BẢN XỨ & HIỆU ỨNG ÂM THANH
// ============================================================================
function playVocabSpeech(text, langCode) {
  if (!text) return;
  const targetLang = langCode || currentLangCode;
  const config = NAJIMEZ_LANG_DATA[targetLang];
  const speechLang = config ? config.speechCode : 'en-US';

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // Hủy câu đang nói dở
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLang;
    utterance.rate = 0.88; // Tốc độ vừa phải để học nghe chuẩn
    utterance.pitch = 1.0;

    // Cố gắng chọn voice chuẩn nếu có
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const match = voices.find(v => v.lang.startsWith(speechLang.split('-')[0]));
      if (match) utterance.voice = match;
    }

    window.speechSynthesis.speak(utterance);
  }
}

function playLangDing() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {}
}

function playLangWrong() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.22);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.23);
  } catch (e) {}
}

// ============================================================================
// 5. CHẾ ĐỘ 1: FLASHCARD 3D THÔNG MINH (LẤY TỪ SỔ TỪ VỰNG CỦA TÔI)
// ============================================================================
let flashcardScope = 'all'; // 'all' (Tất cả) | 'unlearned' (Chưa thuộc) | 'mastered' (Đã thuộc)

function changeFlashcardScope(scope) {
  flashcardScope = scope || 'all';
  flashcardIndex = 0;
  renderFlashcardUI();
}
window.changeFlashcardScope = changeFlashcardScope;

function getFilteredVocabList() {
  const notebook = getVocabNotebook();
  if (!notebook || !Array.isArray(notebook) || notebook.length === 0) {
    return [];
  }

  if (flashcardScope === 'mastered') {
    return notebook.filter(item => item.isMastered === true);
  } else if (flashcardScope === 'unlearned') {
    return notebook.filter(item => item.isMastered !== true);
  } else {
    // 'all': Toàn bộ sổ từ
    return notebook;
  }
}
window.getFilteredVocabList = getFilteredVocabList;

function renderFlashcardUI() {
  const pane = document.getElementById('paneFlashcard');
  if (!pane) return;

  const emptyBox = document.getElementById('flashcardEmptyState');
  const activeContent = document.getElementById('flashcardActiveContent');
  const cardElem = document.getElementById('langFlashcard3D');
  const countPill = document.getElementById('flashcardStatsPill');
  const progressBar = document.getElementById('flashcardProgressBar');
  const scopeSelect = document.getElementById('flashcardScopeSelect');

  if (scopeSelect && scopeSelect.value !== flashcardScope) {
    scopeSelect.value = flashcardScope;
  }

  const notebook = getVocabNotebook();
  const vocabList = getFilteredVocabList();

  // 1. Trường hợp không có từ vựng nào để hỏi theo phạm vi đã chọn
  if (vocabList.length === 0) {
    if (activeContent) activeContent.style.display = 'none';
    if (emptyBox) {
      emptyBox.style.display = 'flex';
      const emptyTitle = emptyBox.querySelector('.fc-empty-title');
      const emptyDesc = emptyBox.querySelector('.fc-empty-desc');

      if (flashcardScope === 'mastered') {
        if (emptyTitle) emptyTitle.textContent = 'Chưa có từ vựng nào Đã thuộc (được đánh sao)!';
        if (emptyDesc) emptyDesc.innerHTML = 'Bạn chưa đánh dấu sao cho từ vựng nào. Hãy chọn phạm vi <em>"Tất cả"</em> hoặc <em>"Chưa thuộc"</em> để học từ vựng và đánh dấu Đã thuộc nhé.';
      } else if (flashcardScope === 'unlearned') {
        if (emptyTitle) emptyTitle.textContent = '🎉 Xuất sắc! Bạn đã thuộc hết từ vựng!';
        if (emptyDesc) emptyDesc.innerHTML = 'Toàn bộ từ trong Sổ từ vựng đều đã được đánh dấu Đã thuộc. Hãy chuyển sang phạm vi <em>"Đã thuộc"</em> để ôn lại hoặc thêm từ vựng mới vào sổ nhé.';
      } else {
        if (emptyTitle) emptyTitle.textContent = 'Chưa có từ vựng nào trong Sổ từ!';
        if (emptyDesc) emptyDesc.innerHTML = 'Tính năng Flashcard lấy câu hỏi trực tiếp từ <strong>Từ Vựng Của Tôi</strong> để giúp bạn ôn luyện đúng trọng tâm. Hãy nạp từ mẫu hoặc tự thêm từ mới nhé!';
      }
    }
    if (countPill) countPill.innerHTML = `Từ <strong>0</strong> / 0`;
    if (progressBar) progressBar.style.width = '0%';
    return;
  }

  // 2. Trường hợp có từ vựng: Hiển thị bàn học Flashcard
  if (emptyBox) emptyBox.style.display = 'none';
  if (activeContent) activeContent.style.display = 'flex';

  if (flashcardIndex >= vocabList.length) flashcardIndex = 0;
  if (flashcardIndex < 0) flashcardIndex = vocabList.length - 1;

  const currentItem = vocabList[flashcardIndex];
  const itemLang = currentItem.lang || currentLangCode;
  const isMastered = !!currentItem.isMastered;

  // Reset trạng thái lật nếu đang mở mặt sau của từ cũ
  if (isFlashcardFlipped && cardElem) {
    cardElem.classList.remove('flipped');
    isFlashcardFlipped = false;
  }

  // Cập nhật Mặt Trước
  const wordEl = document.getElementById('flashcardWordText');
  const phoneticEl = document.getElementById('flashcardPhoneticText');
  const typeTagEl = document.getElementById('flashcardTypeTag');
  const levelTagEl = document.getElementById('flashcardLevelTag');

  if (wordEl) wordEl.textContent = currentItem.word || '';
  if (phoneticEl) phoneticEl.textContent = currentItem.phonetic || '';
  if (typeTagEl) {
    typeTagEl.textContent = currentItem.pos ? currentItem.pos.toUpperCase() : itemLang.toUpperCase();
  }
  if (levelTagEl) {
    levelTagEl.textContent = isMastered ? '⭐ Đã thuộc' : '🌱 Đang học';
    levelTagEl.style.color = isMastered ? '#34d399' : '#fbbf24';
  }

  // Cập nhật Mặt Sau
  const meaningEl = document.getElementById('flashcardMeaningText');
  const exampleOrigEl = document.getElementById('flashcardExampleOrig');
  const exampleTransEl = document.getElementById('flashcardExampleTrans');
  const exampleBox = document.getElementById('flashcardExampleBox');

  if (meaningEl) meaningEl.textContent = currentItem.meaning || 'Chưa có giải nghĩa';

  if (currentItem.example) {
    if (exampleBox) exampleBox.style.display = 'flex';
    if (exampleOrigEl) exampleOrigEl.textContent = currentItem.example;
    if (exampleTransEl) exampleTransEl.textContent = currentItem.exampleTrans || '';
  } else {
    if (exampleBox) exampleBox.style.display = 'none';
  }

  // Nút sao đánh dấu đã thuộc / bookmark
  const btnBookmark = document.getElementById('btnLangBookmarkCard');
  if (btnBookmark) {
    btnBookmark.classList.toggle('bookmarked', isMastered);
    btnBookmark.title = isMastered ? 'Đã thuộc từ này' : 'Đánh dấu đã thuộc';
  }

  // Thống kê tiến độ
  if (countPill) {
    countPill.innerHTML = `Từ <strong>${flashcardIndex + 1}</strong> / ${vocabList.length}`;
  }
  if (progressBar) {
    const pct = ((flashcardIndex + 1) / vocabList.length) * 100;
    progressBar.style.width = `${pct}%`;
  }
}
window.renderFlashcardUI = renderFlashcardUI;

function flipFlashcard() {
  const cardElem = document.getElementById('langFlashcard3D');
  if (!cardElem) return;
  isFlashcardFlipped = !isFlashcardFlipped;
  cardElem.classList.toggle('flipped', isFlashcardFlipped);
}
window.flipFlashcard = flipFlashcard;

function nextFlashcard() {
  const list = getFilteredVocabList();
  if (list.length === 0) return;
  flashcardIndex = (flashcardIndex + 1) % list.length;
  renderFlashcardUI();
}
window.nextFlashcard = nextFlashcard;

function prevFlashcard() {
  const list = getFilteredVocabList();
  if (list.length === 0) return;
  flashcardIndex = (flashcardIndex - 1 + list.length) % list.length;
  renderFlashcardUI();
}
window.prevFlashcard = prevFlashcard;

function shuffleFlashcards() {
  const list = getFilteredVocabList();
  if (list.length <= 1) return;
  let newIdx;
  do {
    newIdx = Math.floor(Math.random() * list.length);
  } while (newIdx === flashcardIndex && list.length > 1);
  flashcardIndex = newIdx;
  renderFlashcardUI();
}
window.shuffleFlashcards = shuffleFlashcards;

let markVocabTimer = null;
function markVocabLearned(isMastered) {
  const list = getFilteredVocabList();
  if (list.length === 0) return;
  const currentItem = list[flashcardIndex];
  if (!currentItem) return;

  let notebook = getVocabNotebook();
  const target = notebook.find(n => n.id === currentItem.id);
  if (target) {
    target.isMastered = !!isMastered;
    const lowerWord = (target.word || '').toLowerCase().trim();
    if (target.isMastered) {
      localStorage.setItem('NAJIMEZ_USER_EXPLICIT_MASTERED_' + lowerWord, '1');
      playLangDing();
    } else {
      localStorage.removeItem('NAJIMEZ_USER_EXPLICIT_MASTERED_' + lowerWord);
    }
    const validMasteredIds = notebook.filter(n => n.isMastered).map(n => n.id);
    saveMasteredVocabIds(validMasteredIds);
    saveVocabNotebook(notebook);
  }

  renderFlashcardUI();
  renderNotebookUI();

  // Tự động chuyển từ tiếp theo sau 250ms (có debounce chống nhảy đúp/nhảy thừa từ)
  if (markVocabTimer) {
    clearTimeout(markVocabTimer);
    markVocabTimer = null;
  }
  markVocabTimer = setTimeout(() => {
    nextFlashcard();
    markVocabTimer = null;
  }, 250);
}
window.markVocabLearned = markVocabLearned;

function toggleBookmarkCurrentCard() {
  const list = getFilteredVocabList();
  if (list.length === 0) return;
  const item = list[flashcardIndex];
  if (!item) return;
  markVocabLearned(!item.isMastered);
}
window.toggleBookmarkCurrentCard = toggleBookmarkCurrentCard;

function speakCurrentFlashcard() {
  const list = getFilteredVocabList();
  if (list.length > 0 && list[flashcardIndex]) {
    const item = list[flashcardIndex];
    playVocabSpeech(item.word, item.lang || currentLangCode);
  }
}
window.speakCurrentFlashcard = speakCurrentFlashcard;

function speakCurrentExample() {
  const list = getFilteredVocabList();
  if (list.length > 0 && list[flashcardIndex]?.example) {
    const item = list[flashcardIndex];
    playVocabSpeech(item.example, item.lang || currentLangCode);
  }
}
window.speakCurrentExample = speakCurrentExample;

// ============================================================================
// 6. CHẾ ĐỘ 2: KIỂM TRA PHẢN XẠ TỪ VỰNG 2 CHIỀU (HARDCORE ACTIVE RECALL)
// Lấy từ vựng trực tiếp từ "Từ Vựng Của Tôi" (getVocabNotebook)
// ============================================================================
let quizScope = 'all'; // 'all' (Tất cả) | 'unlearned' (Chưa thuộc / Cần học) | 'mastered' (Đã thuộc)

function changeQuizScope(scope) {
  quizScope = scope || 'all';
  const scopeSelect = document.getElementById('quizScopeSelect');
  if (scopeSelect && scopeSelect.value !== quizScope) {
    scopeSelect.value = quizScope;
  }
  quizState.lastVocabId = null;
  initNewQuizRound();
}
window.changeQuizScope = changeQuizScope;

function setQuizDirectionMode(mode, e) {
  if (e) {
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
    if (typeof e.preventDefault === 'function') e.preventDefault();
  }
  quizState.directionMode = mode || 'mixed';

  // Cập nhật trạng thái nút chọn mode
  document.querySelectorAll('.quiz-mode-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === quizState.directionMode);
  });

  initNewQuizRound();
}
window.setQuizDirectionMode = setQuizDirectionMode;

function getQuizVocabPool() {
  const notebook = getVocabNotebook();
  if (!notebook || !Array.isArray(notebook) || notebook.length === 0) {
    return [];
  }

  // 1. Lọc theo ngôn ngữ đang chọn, nếu không có từ nào theo ngôn ngữ đó thì lấy toàn bộ sổ từ
  let langPool = notebook.filter(item => !item.lang || item.lang === currentLangCode);
  if (langPool.length === 0) langPool = notebook;

  // 2. Lọc theo phạm vi (Tất cả / Chưa thuộc / Đã thuộc) tương tự Flashcard
  if (quizScope === 'mastered') {
    return langPool.filter(item => item.isMastered === true);
  } else if (quizScope === 'unlearned') {
    return langPool.filter(item => item.isMastered !== true);
  } else {
    // 'all'
    return langPool;
  }
}
window.getQuizVocabPool = getQuizVocabPool;

function updateQuizMasteredBtn() {
  const btn = document.getElementById('btnQuizToggleMastered');
  const textEl = document.getElementById('quizToggleMasteredText');
  if (!btn || !quizState.currentVocab) return;
  const notebook = getVocabNotebook();
  const current = notebook.find(n => n.id === quizState.currentVocab.id);
  const isMastered = current ? !!current.isMastered : false;
  btn.classList.toggle('mastered', isMastered);
  if (textEl) {
    textEl.textContent = isMastered ? 'Đã thuộc (Bấm để gỡ)' : 'Đánh dấu Đã thuộc';
  }
  const levelTag = document.getElementById('quizLevelTag');
  if (levelTag) {
    levelTag.textContent = isMastered ? '⭐ Đã thuộc' : '🌱 Đang học';
    levelTag.style.color = isMastered ? '#34d399' : '#fbbf24';
  }
}

function toggleQuizCurrentWordMastered() {
  if (!quizState.currentVocab) return;
  toggleNotebookMastered(quizState.currentVocab.id);
  updateQuizMasteredBtn();
}
window.toggleQuizCurrentWordMastered = toggleQuizCurrentWordMastered;

function normalizeQuizString(str) {
  if (!str) return '';
  return str.toString()
    .toLowerCase()
    .trim()
    .replace(/[.,?!:;'"()\/\\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function removeVietnameseTones(str) {
  if (!str) return '';
  return str.toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

// Bảng tra cứu từ đồng nghĩa tiếng Anh (chống bắt lỗi oan uổng khi kiểm tra Việt ➔ Anh)
const VOCAB_SYNONYMS_EN = {
  'parking lot': ['parking lot', 'parking area', 'car park', 'parking'],
  'parking area': ['parking area', 'parking lot', 'car park', 'parking'],
  'couch': ['couch', 'sofa', 'settee'],
  'sofa': ['sofa', 'couch', 'settee'],
  'cap': ['cap', 'hat', 'baseball cap'],
  'hat': ['hat', 'cap'],
  'rug': ['rug', 'carpet', 'mat'],
  'carpet': ['carpet', 'rug', 'mat'],
  'fireplace': ['fireplace', 'hearth'],
  'display': ['display', 'show', 'exhibit', 'exhibition'],
  'pile up': ['pile up', 'stack', 'pile'],
  'stack': ['stack', 'pile up', 'pile'],
  'be stacked': ['be stacked', 'stacked', 'pile up', 'be piled up', 'pile'],
  'be repaired': ['be repaired', 'repaired', 'be fixed', 'fixed'],
  'be fixed': ['be fixed', 'fixed', 'be repaired', 'repaired'],
  'be laid out': ['be laid out', 'laid out', 'be arranged', 'arranged', 'arrange'],
  'against the wall': ['against the wall', 'on the wall'],
  'hang': ['hang', 'hung', 'be hung'],
  'be packed': ['be packed', 'packed', 'pack'],
  'be rolled up': ['be rolled up', 'rolled up', 'roll up'],
  'take a ride': ['take a ride', 'ride', 'go for a ride']
};

function normalizeVietnameseDialect(str) {
  if (!str) return '';
  let s = ' ' + str.toLowerCase().replace(/\s+/g, ' ').trim() + ' ';
  
  const synPairs = [
    ['bãi đậu xe', 'bãi đỗ xe'],
    ['khu đậu xe', 'khu đỗ xe'],
    ['chỗ đậu xe', 'chỗ đỗ xe'],
    ['đậu xe', 'đỗ xe'],
    ['bãi xe', 'bãi đỗ xe'],
    ['đậu', 'đỗ'],
    ['nón kết', 'mũ lưỡi trai'],
    ['nón lưỡi trai', 'mũ lưỡi trai'],
    ['nón', 'mũ'],
    ['lọ hoa', 'bình hoa'],
    ['bình bông', 'bình hoa'],
    ['lọ bông', 'bình hoa'],
    ['bông', 'hoa'],
    ['lọ', 'bình'],
    ['nền nhà', 'sàn nhà'],
    ['nền', 'sàn'],
    ['ghế sa lông', 'ghế sofa'],
    ['sa lông', 'ghế sofa'],
    ['ghế bành', 'ghế sofa'],
    ['ghế dài', 'ghế sofa'],
    ['chất đống', 'xếp chồng'],
    ['chất lên', 'xếp chồng'],
    ['chồng lên', 'xếp chồng'],
    ['khắc phục', 'sửa chữa'],
    ['sửa', 'sửa chữa'],
    ['la phông', 'trần nhà'],
    ['kế bên', 'bên cạnh'],
    ['sát bên', 'bên cạnh'],
    ['tựa vào', 'dựa vào'],
    ['tựa', 'dựa'],
    ['bày biện', 'trưng bày'],
    ['triển lãm', 'trưng bày'],
    ['bày ra', 'trưng bày'],
    ['để lại', 'bỏ lại'],
    ['bỏ quên', 'bỏ lại'],
    ['sắp đặt', 'sắp xếp'],
    ['bày trí', 'sắp xếp'],
    ['bố trí', 'sắp xếp'],
    ['tràn ra', 'đổ ra'],
    ['tràn', 'đổ'],
    ['quấn lại', 'cuộn lại'],
    ['quấn', 'cuộn']
  ];

  for (const [fromW, toW] of synPairs) {
    s = s.replace(new RegExp(`(\\s)${fromW}(\\s)`, 'g'), `$1${toW}$2`);
  }

  return s.trim();
}

function checkTypedAnswer(rawInput, vocab, direction) {
  if (!rawInput || !vocab) return false;
  const userInput = normalizeQuizString(rawInput);
  if (!userInput) return false;

  if (direction === 'vi_en') {
    // Người dùng gõ từ tiếng Anh/ngoại ngữ
    const targetWord = normalizeQuizString(vocab.word);
    
    // 1. Khớp chính xác
    if (userInput === targetWord) return true;

    // 2. Tra cứu danh sách đồng nghĩa tiếng Anh
    const targetSyns = VOCAB_SYNONYMS_EN[targetWord] || [];
    if (targetSyns.includes(userInput)) return true;

    // 3. Xử lý các từ ghép gạch chéo: e.g. "couch / sofa", "parking area / lot"
    const slashParts = vocab.word.split(/[/,;]/).map(p => normalizeQuizString(p)).filter(Boolean);
    if (slashParts.includes(userInput)) return true;

    for (const part of slashParts) {
      const partSyns = VOCAB_SYNONYMS_EN[part] || [];
      if (partSyns.includes(userInput)) return true;
    }

    // 4. Xử lý tiền tố "to " hoặc "be " hoặc mạo từ "a / an / the"
    const stripPrefixes = (w) => w.replace(/^(to\s+|be\s+|a\s+|an\s+|the\s+)/i, '').trim();
    if (stripPrefixes(userInput) === stripPrefixes(targetWord)) return true;

    for (const part of slashParts) {
      if (stripPrefixes(userInput) === stripPrefixes(part)) return true;
    }

    for (const syn of targetSyns) {
      if (stripPrefixes(userInput) === stripPrefixes(syn)) return true;
    }

    return false;
  } else {
    // direction === 'en_vi': Người dùng gõ nghĩa tiếng Việt
    const targetMeaning = normalizeQuizString(vocab.meaning);
    const targetMeaningNoTone = removeVietnameseTones(targetMeaning);
    const userInputNoTone = removeVietnameseTones(userInput);

    // 1. Khớp chính xác có dấu hoặc không dấu nguyên bản
    if (userInput === targetMeaning || userInputNoTone === targetMeaningNoTone) return true;

    // 2. Chuẩn hóa phương ngữ & từ đồng nghĩa tiếng Việt (đậu xe <-> đỗ xe, nón <-> mũ...)
    const userSyn = normalizeVietnameseDialect(userInput);
    const targetSyn = normalizeVietnameseDialect(targetMeaning);
    const userSynNoTone = removeVietnameseTones(userSyn);
    const targetSynNoTone = removeVietnameseTones(targetSyn);

    if (userSyn === targetSyn || userSynNoTone === targetSynNoTone) return true;
    if (targetSyn.includes(userSyn) && userSyn.length >= 3) return true;
    if (targetSynNoTone.includes(userSynNoTone) && userSynNoTone.length >= 3) return true;

    // 3. Tách các cụm nghĩa (nghĩa thường có dạng "Bãi đỗ xe (có quy hoạch, kẻ ô)")
    const meaningClauses = vocab.meaning.split(/[,;\/()]/)
      .map(p => normalizeQuizString(p))
      .filter(p => p.length >= 2);

    for (const rawClause of meaningClauses) {
      const clause = rawClause;
      const clauseNoTone = removeVietnameseTones(clause);
      const clauseSyn = normalizeVietnameseDialect(clause);
      const clauseSynNoTone = removeVietnameseTones(clauseSyn);

      if (userInput === clause || userInputNoTone === clauseNoTone) return true;
      if (userSyn === clauseSyn || userSynNoTone === clauseSynNoTone) return true;

      // Khớp từ khóa con
      if (clauseSyn.includes(userSyn) || userSyn.includes(clauseSyn)) {
        if (Math.min(clauseSyn.length, userSyn.length) >= 3) return true;
      }
      if (clauseSynNoTone.includes(userSynNoTone) || userSynNoTone.includes(clauseSynNoTone)) {
        if (Math.min(clauseSynNoTone.length, userSynNoTone.length) >= 3) return true;
      }
    }

    // 4. Kiểm tra độ trùng khớp từ khóa chính (vd: "bãi", "đậu", "xe" vs "bãi", "đỗ", "xe")
    const userWords = userSyn.split(' ').filter(w => w.length >= 2);
    const targetWords = targetSyn.split(' ').filter(w => w.length >= 2);
    if (userWords.length >= 2) {
      const matchCount = userWords.filter(w => targetWords.includes(w)).length;
      if (matchCount === userWords.length) return true;
    }

    // 5. Kiểm tra nếu input là một cụm từ con có ý nghĩa trong toàn bộ meaning
    if (targetMeaning.includes(userInput) && userInput.length >= 3) return true;
    if (targetMeaningNoTone.includes(userInputNoTone) && userInputNoTone.length >= 3) return true;

    return false;
  }
}

function speakCurrentQuizWord() {
  if (quizState.currentVocab) {
    const item = quizState.currentVocab;
    playVocabSpeech(item.word, item.lang || currentLangCode);
  }
}
window.speakCurrentQuizWord = speakCurrentQuizWord;

function escapeQuizHtml(str) {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function initNewQuizRound() {
  const emptyState = document.getElementById('quizEmptyState');
  const activeContent = document.getElementById('quizActiveContent');
  if (!emptyState || !activeContent) return;

  const pool = getQuizVocabPool();

  // 1. Trường hợp Sổ từ rỗng
  if (pool.length === 0) {
    emptyState.style.display = 'flex';
    activeContent.style.display = 'none';
    return;
  }

  // 2. Có từ vựng: Hiển thị sân đấu
  emptyState.style.display = 'none';
  activeContent.style.display = 'flex';

  // Quyết định chiều kiểm tra
  if (quizState.directionMode === 'mixed') {
    quizState.currentDirection = Math.random() < 0.5 ? 'en_vi' : 'vi_en';
  } else {
    quizState.currentDirection = quizState.directionMode;
  }

  // Chọn từ ngẫu nhiên trong pool (tránh lặp lại từ vừa xong nếu pool > 1)
  let candidatePool = pool;
  if (pool.length > 1 && quizState.lastVocabId) {
    candidatePool = pool.filter(v => v.id !== quizState.lastVocabId);
    if (candidatePool.length === 0) candidatePool = pool;
  }
  const target = candidatePool[Math.floor(Math.random() * candidatePool.length)];
  quizState.currentVocab = target;
  quizState.lastVocabId = target.id;
  quizState.isAnswered = false;
  updateQuizMasteredBtn();

  // Cập nhật huy hiệu Điểm & Chuỗi
  const elStreak = document.getElementById('quizStreakText');
  const elScore = document.getElementById('quizScoreText');
  if (elStreak) elStreak.textContent = quizState.streak;
  if (elScore) elScore.textContent = quizState.score;

  // Khởi tạo vùng hiển thị câu hỏi
  const dirBadgeText = document.getElementById('quizDirectionText');
  const targetWordEl = document.getElementById('quizTargetWord');
  const phoneticEl = document.getElementById('quizPhoneticHint');
  const instructEl = document.getElementById('quizPromptInstruction');
  const counterPill = document.getElementById('quizCounterPill');
  const inputEl = document.getElementById('quizTypingInput');
  const inputWrap = document.getElementById('quizInputWrapper');
  const feedbackCard = document.getElementById('quizFeedbackCard');
  const typingZone = document.getElementById('quizTypingZone');

  if (counterPill) {
    counterPill.textContent = `${pool.length} từ trong sổ`;
  }

  if (feedbackCard) feedbackCard.style.display = 'none';
  if (typingZone) typingZone.style.display = 'flex';
  if (inputWrap) {
    inputWrap.classList.remove('correct', 'wrong');
  }
  if (inputEl) {
    inputEl.value = '';
    inputEl.disabled = false;
  }

  const langCode = target.lang || currentLangCode;
  const langPack = NAJIMEZ_LANG_DATA[langCode];
  const langName = langPack?.name || 'Ngoại ngữ';
  const flag = langPack?.flag || '🌐';

  if (quizState.currentDirection === 'en_vi') {
    // Cách 1: Đưa từ ngoại ngữ, bắt ghi tiếng Việt
    if (dirBadgeText) {
      dirBadgeText.innerHTML = `${flag} ${langName.toUpperCase()} ➔ GHI NGHĨA TIẾNG VIỆT`;
    }
    if (targetWordEl) {
      targetWordEl.innerHTML = `
        <span>${escapeQuizHtml(target.word)}</span>
        <button type="button" class="btn-speak-vocab" onclick="speakCurrentQuizWord()" title="Nghe phát âm chuẩn">
          <i class="fa-solid fa-volume-high"></i>
        </button>
      `;
    }
    if (phoneticEl) {
      phoneticEl.textContent = target.phonetic || '';
      phoneticEl.style.display = target.phonetic ? 'block' : 'none';
    }
    if (instructEl) {
      instructEl.innerHTML = `Lắng nghe và quan sát từ trên, hãy gõ <strong>nghĩa tiếng Việt</strong> vào ô bên dưới:`;
    }
    if (inputEl) {
      inputEl.placeholder = `Nhập nghĩa tiếng Việt (ví dụ: lò sưởi, trần nhà...)...`;
    }
  } else {
    // Cách 2: Đưa nghĩa tiếng Việt, bắt ghi từ ngoại ngữ
    if (dirBadgeText) {
      dirBadgeText.innerHTML = `🇻🇳 TIẾNG VIỆT ➔ GÕ TỪ ${langName.toUpperCase()} CHÍNH XÁC`;
    }
    if (targetWordEl) {
      targetWordEl.innerHTML = `<span>${escapeQuizHtml(target.meaning)}</span>`;
    }
    if (phoneticEl) {
      // Hiển thị gợi ý phiên âm hoặc câu ví dụ đã che từ
      if (target.example) {
        const maskedExample = target.example.replace(new RegExp(target.word, 'gi'), '_____');
        phoneticEl.innerHTML = `<span style="font-style: italic; color: #94a3b8;">Gợi ý ngữ cảnh:</span> "${escapeQuizHtml(maskedExample)}"`;
        phoneticEl.style.display = 'block';
      } else if (target.phonetic) {
        phoneticEl.textContent = `Phiên âm: ${target.phonetic}`;
        phoneticEl.style.display = 'block';
      } else {
        phoneticEl.style.display = 'none';
      }
    }
    if (instructEl) {
      instructEl.innerHTML = `Đọc nghĩa tiếng Việt ở trên, hãy gõ chính xác <strong>từ vựng ${escapeQuizHtml(langName)}</strong> tương ứng:`;
    }
    if (inputEl) {
      inputEl.placeholder = `Type the ${langName} word here...`;
    }
  }

  // Tự động focus vào ô nhập
  setTimeout(() => {
    if (inputEl) inputEl.focus();
  }, 100);
}
window.initNewQuizRound = initNewQuizRound;

function handleQuizInputKeydown(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    if (quizState.isAnswered) {
      continueToNextQuizRound();
    } else {
      submitQuizTypedAnswer();
    }
  }
}
window.handleQuizInputKeydown = handleQuizInputKeydown;

function submitQuizTypedAnswer() {
  if (quizState.isAnswered || !quizState.currentVocab) return;

  const inputEl = document.getElementById('quizTypingInput');
  const inputWrap = document.getElementById('quizInputWrapper');
  const feedbackCard = document.getElementById('quizFeedbackCard');
  const feedbackStatus = document.getElementById('quizFeedbackStatus');
  const feedbackBody = document.getElementById('quizFeedbackBody');
  const btnContinue = document.getElementById('btnQuizContinue');

  const rawInput = inputEl?.value?.trim() || '';
  if (!rawInput) {
    if (inputEl) {
      inputEl.focus();
      inputEl.placeholder = '⚠️ Vui lòng nhập câu trả lời trước khi kiểm tra!';
      setTimeout(() => {
        if (inputEl) {
          inputEl.placeholder = quizState.currentDirection === 'en_vi' ? 'Nhập nghĩa tiếng Việt...' : 'Type the word here...';
        }
      }, 1500);
    }
    return;
  }

  quizState.isAnswered = true;
  if (inputEl) inputEl.disabled = true;

  const target = quizState.currentVocab;
  const isCorrect = checkTypedAnswer(rawInput, target, quizState.currentDirection);
  const langCode = target.lang || currentLangCode;

  if (isCorrect) {
    quizState.score += 10;
    quizState.streak += 1;
    playLangDing();

    if (inputWrap) inputWrap.classList.add('correct');
    if (feedbackCard) {
      feedbackCard.className = 'quiz-feedback-card correct';
      feedbackCard.style.display = 'flex';
    }
    if (feedbackStatus) {
      feedbackStatus.className = 'quiz-feedback-status correct';
      feedbackStatus.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>Chính xác tuyệt vời! (+10 điểm)</span>`;
    }
  } else {
    quizState.streak = 0;
    playLangWrong();

    if (inputWrap) inputWrap.classList.add('wrong');
    if (feedbackCard) {
      feedbackCard.className = 'quiz-feedback-card wrong';
      feedbackCard.style.display = 'flex';
    }
    if (feedbackStatus) {
      feedbackStatus.className = 'quiz-feedback-status wrong';
      feedbackStatus.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> <span>Chưa chính xác rồi! Hãy ghi nhớ nhé:</span>`;
    }
  }

  // Cập nhật điểm & streak
  const elStreak = document.getElementById('quizStreakText');
  const elScore = document.getElementById('quizScoreText');
  if (elStreak) elStreak.textContent = quizState.streak;
  if (elScore) elScore.textContent = quizState.score;

  // Render chi tiết feedback
  if (feedbackBody) {
    feedbackBody.innerHTML = `
      <div class="quiz-feedback-row">
        <span class="quiz-feedback-label">Bạn đã nhập:</span>
        <span class="quiz-feedback-val ${isCorrect ? 'correct-highlight' : 'wrong-highlight'}">${escapeQuizHtml(rawInput)}</span>
      </div>
      <div class="quiz-feedback-row">
        <span class="quiz-feedback-label">Từ vựng chuẩn:</span>
        <span class="quiz-feedback-val correct-highlight">
          <strong>${escapeQuizHtml(target.word)}</strong>
          ${target.phonetic ? `<span style="font-family: monospace; font-size: 0.85rem; color: #38bdf8;">${escapeQuizHtml(target.phonetic)}</span>` : ''}
          <button type="button" class="btn-speak-vocab" onclick="speakCurrentQuizWord()" title="Nghe phát âm chuẩn">
            <i class="fa-solid fa-volume-high"></i>
          </button>
        </span>
      </div>
      <div class="quiz-feedback-row">
        <span class="quiz-feedback-label">Ý nghĩa:</span>
        <span class="quiz-feedback-val">${escapeQuizHtml(target.meaning)}</span>
      </div>
      ${target.example ? `
        <div class="quiz-feedback-example">
          <div><i class="fa-solid fa-quote-left" style="opacity: 0.5; margin-right: 4px;"></i>${escapeQuizHtml(target.example)}</div>
          ${target.exampleTrans ? `<div class="example-trans">${escapeQuizHtml(target.exampleTrans)}</div>` : ''}
        </div>
      ` : ''}
    `;
  }

  if (btnContinue) {
    btnContinue.focus();
  }
  updateQuizMasteredBtn();
}
window.submitQuizTypedAnswer = submitQuizTypedAnswer;

function revealQuizAnswer() {
  if (quizState.isAnswered || !quizState.currentVocab) return;

  quizState.isAnswered = true;
  quizState.streak = 0;

  const target = quizState.currentVocab;
  const langCode = target.lang || currentLangCode;

  const inputEl = document.getElementById('quizTypingInput');
  const inputWrap = document.getElementById('quizInputWrapper');
  const feedbackCard = document.getElementById('quizFeedbackCard');
  const feedbackStatus = document.getElementById('quizFeedbackStatus');
  const feedbackBody = document.getElementById('quizFeedbackBody');
  const btnContinue = document.getElementById('btnQuizContinue');

  if (inputEl) inputEl.disabled = true;
  if (inputWrap) inputWrap.classList.add('wrong');

  const elStreak = document.getElementById('quizStreakText');
  if (elStreak) elStreak.textContent = quizState.streak;

  if (feedbackCard) {
    feedbackCard.className = 'quiz-feedback-card';
    feedbackCard.style.display = 'flex';
  }
  if (feedbackStatus) {
    feedbackStatus.className = 'quiz-feedback-status';
    feedbackStatus.style.color = '#fbbf24';
    feedbackStatus.innerHTML = `<i class="fa-solid fa-lightbulb"></i> <span>Đáp án tham khảo để bạn ghi nhớ:</span>`;
  }

  if (feedbackBody) {
    feedbackBody.innerHTML = `
      <div class="quiz-feedback-row">
        <span class="quiz-feedback-label">Từ vựng:</span>
        <span class="quiz-feedback-val correct-highlight">
          <strong>${escapeQuizHtml(target.word)}</strong>
          ${target.phonetic ? `<span style="font-family: monospace; font-size: 0.85rem; color: #38bdf8;">${escapeQuizHtml(target.phonetic)}</span>` : ''}
          <button type="button" class="btn-speak-vocab" onclick="speakCurrentQuizWord()" title="Nghe phát âm chuẩn">
            <i class="fa-solid fa-volume-high"></i>
          </button>
        </span>
      </div>
      <div class="quiz-feedback-row">
        <span class="quiz-feedback-label">Nghĩa tiếng Việt:</span>
        <span class="quiz-feedback-val">${escapeQuizHtml(target.meaning)}</span>
      </div>
      ${target.example ? `
        <div class="quiz-feedback-example">
          <div><i class="fa-solid fa-quote-left" style="opacity: 0.5; margin-right: 4px;"></i>${escapeQuizHtml(target.example)}</div>
          ${target.exampleTrans ? `<div class="example-trans">${escapeQuizHtml(target.exampleTrans)}</div>` : ''}
        </div>
      ` : ''}
    `;
  }

  if (btnContinue) {
    btnContinue.focus();
  }
  updateQuizMasteredBtn();
}
window.revealQuizAnswer = revealQuizAnswer;

function skipToNextQuizQuestion() {
  initNewQuizRound();
}
window.skipToNextQuizQuestion = skipToNextQuizQuestion;

function continueToNextQuizRound() {
  initNewQuizRound();
}
window.continueToNextQuizRound = continueToNextQuizRound;

// ============================================================================
// 7. CHẾ ĐỘ 3: TRA TỪ & DỊCH THUẬT NHANH
// ============================================================================
function performDictLookup() {
  const input = document.getElementById('dictSearchInput');
  if (!input) return;
  const query = input.value.trim().toLowerCase();
  if (!query) return;

  const langPack = NAJIMEZ_LANG_DATA[currentLangCode];
  const card = document.getElementById('dictResultCard');
  if (!card) return;
  card.style.display = 'flex';

  // Tra trong kho từ hiện tại
  let match = langPack?.vocab?.find(v => v.word.toLowerCase() === query || v.meaning.toLowerCase().includes(query));

  if (!match) {
    // Nếu chưa có, tạo cấu trúc tra cứu thông minh
    match = {
      word: input.value.trim(),
      phonetic: `[${langPack?.name || 'Ngoại ngữ'}]`,
      pos: 'từ vựng tra cứu',
      meaning: `Đang kết nối từ điển tra nghĩa cho "${input.value.trim()}"... Bạn có thể bấm "Hỏi Najimez" bên dưới để nhận phân tích chi tiết!`,
      example: `Example sentence with "${input.value.trim()}".`,
      exampleTrans: `Câu ví dụ với từ "${input.value.trim()}".`
    };
  }

  document.getElementById('dictResultWord').innerHTML = `
    <span>${match.word}</span>
    <button type="button" class="btn-speak-vocab" onclick="playVocabSpeech('${match.word.replace(/'/g, "\\'")}', '${currentLangCode}')" title="Nghe phát âm">
      <i class="fa-solid fa-volume-high"></i>
    </button>
  `;
  document.getElementById('dictResultPhonetic').textContent = match.phonetic || '';
  document.getElementById('dictMeaningText').textContent = match.meaning;
  document.getElementById('dictExampleOrig').textContent = match.example || '';
  document.getElementById('dictExampleTrans').textContent = match.exampleTrans || '';

  // Gắn sự kiện lưu vào notebook
  const btnSave = document.getElementById('btnSaveDictToNotebook');
  if (btnSave) {
    btnSave.onclick = () => {
      let notebook = getVocabNotebook();
      const existingIdx = notebook.findIndex(n => n.word.toLowerCase() === match.word.toLowerCase() && n.lang === currentLangCode);
      if (existingIdx >= 0) {
        notebook[existingIdx] = {
          ...notebook[existingIdx],
          phonetic: match.phonetic || notebook[existingIdx].phonetic,
          meaning: match.meaning,
          example: match.example || notebook[existingIdx].example
        };
      } else {
        notebook.unshift({
          id: 'dict-' + Date.now(),
          lang: currentLangCode,
          word: match.word,
          phonetic: match.phonetic || '',
          pos: match.pos || '',
          meaning: match.meaning,
          example: match.example || '',
          exampleTrans: match.exampleTrans || '',
          savedAt: new Date().toISOString()
        });
      }
      saveVocabNotebook(notebook);
      playLangDing();
      renderNotebookUI();
      btnSave.innerHTML = '<i class="fa-solid fa-check" style="color: #4ade80;"></i> Đã lưu!';
      setTimeout(() => { btnSave.innerHTML = '<i class="fa-solid fa-bookmark"></i> Lưu vào Sổ từ'; }, 1500);
    };
  }

  // Gắn sự kiện hỏi Najimez
  const btnAsk = document.getElementById('btnAskNajimezWord');
  if (btnAsk) {
    btnAsk.onclick = () => askNajimezForWordExplanation(match.word, currentLangCode);
  }
}

function askNajimezForWordExplanation(word, langCode) {
  const langName = NAJIMEZ_LANG_DATA[langCode]?.name || 'Ngoại ngữ';
  const prompt = `Giải thích chi tiết cho tôi về từ vựng "${word}" trong ${langName}: nguồn gốc, phiên âm chuẩn, từ loại, các ngữ cảnh sử dụng thực tế trong đời sống và đặt 3 câu ví dụ song ngữ sinh động nhé!`;

  // Chuyển sang Tab Copilot và điền câu hỏi
  if (typeof switchTab === 'function') {
    switchTab('tab-copilot');
  }

  setTimeout(() => {
    const chatInput = document.getElementById('copilotChatInput') || document.getElementById('chatInput');
    if (chatInput) {
      chatInput.value = prompt;
      chatInput.focus();
      // Kích hoạt nút gửi nếu có
      const sendBtn = document.getElementById('btnCopilotSend') || document.getElementById('btnSendChat');
      if (sendBtn) sendBtn.click();
    }
  }, 150);
}

// ============================================================================
// 8. CHẾ ĐỘ: TỪ VỰNG CỦA TÔI (MY VOCABULARY NOTEBOOK)
// ============================================================================
function renderNotebookUI() {
  const container = document.getElementById('notebookListContainer');
  const countText = document.getElementById('notebookStatsText');
  if (!container) return;

  const notebook = getVocabNotebook();
  updateNotebookBadge();

  if (countText) {
    countText.textContent = `${notebook.length} từ đã lưu`;
  }

  const searchInput = document.getElementById('myVocabSearchInput');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

  let filtered = notebook;
  if (query) {
    filtered = notebook.filter(item => 
      (item.word && item.word.toLowerCase().includes(query)) ||
      (item.meaning && item.meaning.toLowerCase().includes(query)) ||
      (item.phonetic && item.phonetic.toLowerCase().includes(query))
    );
  }

  if (filtered.length === 0) {
    if (query) {
      container.innerHTML = `
        <div class="my-vocab-empty-box">
          <i class="fa-solid fa-magnifying-glass"></i>
          <h3>Không tìm thấy từ vựng phù hợp!</h3>
          <p>Không có kết quả nào cho từ khóa "<strong>${query}</strong>". Thử tìm kiếm với từ khóa khác nhé.</p>
        </div>
      `;
    } else {
      const currLangName = NAJIMEZ_LANG_DATA[currentLangCode]?.name || 'Ngoại ngữ';
      container.innerHTML = `
        <div class="my-vocab-empty-box">
          <i class="fa-solid fa-book-bookmark"></i>
          <h3>Sổ từ vựng của bạn đang trống!</h3>
          <p>Hãy thêm các từ vựng bạn muốn ghi nhớ để ôn tập hàng ngày, hoặc bấm nút dưới đây để nạp từ mẫu nhé.</p>
          <button type="button" class="btn-add-sample-vocab" onclick="addSampleVocabToNotebook()">
            <i class="fa-solid fa-wand-magic-sparkles"></i> Thêm từ vựng mẫu (${currLangName})
          </button>
        </div>
      `;
    }
    return;
  }

  container.innerHTML = '';

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'my-vocab-item-card';

    const langCode = item.lang || currentLangCode;
    const flagHtml = typeof getLangFlagBadgeHtml === 'function' ? getLangFlagBadgeHtml(langCode) : '🌐';
    const isMastered = !!item.isMastered;

    card.innerHTML = `
      <div class="my-vocab-card-top">
        <div class="my-vocab-word-group">
          ${flagHtml}
          <span class="my-vocab-word">${escapeQuizHtml(item.word)}</span>
          ${item.phonetic ? `<span class="my-vocab-ipa">${escapeQuizHtml(item.phonetic)}</span>` : ''}
        </div>
        <div class="my-vocab-card-actions">
          <button type="button" class="btn-nb-icon star-vocab ${isMastered ? 'active' : ''}" onclick="toggleNotebookMastered('${item.id}')" title="${isMastered ? 'Đã thuộc (Bấm để chuyển sang chưa thuộc)' : 'Chưa thuộc (Bấm để đánh dấu đã thuộc)'}">
            <i class="${isMastered ? 'fa-solid fa-star' : 'fa-regular fa-star'}"></i>
          </button>
          <button type="button" class="btn-nb-icon" onclick="playVocabSpeech('${item.word.replace(/'/g, "\\'")}', '${langCode}')" title="Nghe phát âm">
            <i class="fa-solid fa-volume-high"></i>
          </button>
          <button type="button" class="btn-nb-icon delete" onclick="deleteFromNotebook('${item.id}')" title="Xóa khỏi sổ từ">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>
      </div>
      <div class="my-vocab-meaning">${escapeQuizHtml(item.meaning)}</div>
      ${item.example ? `<div class="my-vocab-example">${escapeQuizHtml(item.example)}</div>` : ''}
    `;
    container.appendChild(card);
  });
}
window.renderNotebookUI = renderNotebookUI;

function toggleNotebookMastered(id) {
  let notebook = getVocabNotebook();
  const target = notebook.find(n => n.id === id);
  if (!target) return;

  target.isMastered = !target.isMastered;
  const lowerWord = (target.word || '').toLowerCase().trim();
  if (target.isMastered) {
    localStorage.setItem('NAJIMEZ_USER_EXPLICIT_MASTERED_' + lowerWord, '1');
    playLangDing();
  } else {
    localStorage.removeItem('NAJIMEZ_USER_EXPLICIT_MASTERED_' + lowerWord);
  }

  const validMasteredIds = notebook.filter(n => n.isMastered).map(n => n.id);
  saveMasteredVocabIds(validMasteredIds);
  saveVocabNotebook(notebook);

  renderNotebookUI();
  renderFlashcardUI();
}
window.toggleNotebookMastered = toggleNotebookMastered;

function addSampleVocabToNotebook() {
  const langPack = NAJIMEZ_LANG_DATA[currentLangCode] || NAJIMEZ_LANG_DATA.en;
  const samples = (langPack.vocab || []).slice(0, 3);
  let notebook = getVocabNotebook();
  samples.forEach((s, idx) => {
    if (!notebook.some(n => n.word.toLowerCase() === s.word.toLowerCase() && n.lang === currentLangCode)) {
      notebook.unshift({
        id: generateUniqueVocabId(s.word, currentLangCode, idx),
        lang: currentLangCode,
        word: s.word,
        phonetic: s.phonetic || '',
        meaning: s.meaning,
        example: s.example || '',
        exampleTrans: s.exampleTrans || '',
        isMastered: false
      });
    }
  });
  saveVocabNotebook(notebook);
  renderNotebookUI();
  renderFlashcardUI();
  playLangDing();
}
window.addSampleVocabToNotebook = addSampleVocabToNotebook;

function saveNewCustomVocab() {
  const wordInput = document.getElementById('newVocabWord');
  const phoneticInput = document.getElementById('newVocabPhonetic');
  const meaningInput = document.getElementById('newVocabMeaning');
  const exampleInput = document.getElementById('newVocabExample');

  const word = wordInput?.value?.trim();
  const meaning = meaningInput?.value?.trim();
  if (!word || !meaning) {
    alert('Vui lòng nhập Từ vựng và Ý nghĩa tiếng Việt!');
    return;
  }

  const phonetic = phoneticInput?.value?.trim() || '';
  const example = exampleInput?.value?.trim() || '';

  let notebook = getVocabNotebook();
  const existingIdx = notebook.findIndex(n => n.word.toLowerCase() === word.toLowerCase() && n.lang === currentLangCode);
  if (existingIdx >= 0) {
    // Đã có trong sổ: Cập nhật lại thông tin mới nhất, không tạo bản ghi trùng lặp
    notebook[existingIdx] = {
      ...notebook[existingIdx],
      phonetic: phonetic || notebook[existingIdx].phonetic,
      meaning: meaning,
      example: example || notebook[existingIdx].example
    };
  } else {
    // Chưa có: Thêm từ mới vào đầu sổ từ với ID độc nhất
    notebook.unshift({
      id: generateUniqueVocabId(word, currentLangCode, 0),
      lang: currentLangCode,
      word: word,
      phonetic: phonetic,
      meaning: meaning,
      example: example,
      isMastered: false
    });
  }

  saveVocabNotebook(notebook);
  renderNotebookUI();
  renderFlashcardUI();
  playLangDing();

  if (wordInput) wordInput.value = '';
  if (phoneticInput) phoneticInput.value = '';
  if (meaningInput) meaningInput.value = '';
  if (exampleInput) exampleInput.value = '';
  const box = document.getElementById('myVocabFormBox');
  if (box) box.style.display = 'none';
}
window.saveNewCustomVocab = saveNewCustomVocab;

function deleteFromNotebook(id) {
  let notebook = getVocabNotebook();
  const target = notebook.find(n => n.id === id);
  if (target) {
    const lowerWord = (target.word || '').toLowerCase().trim();
    localStorage.removeItem('NAJIMEZ_USER_EXPLICIT_MASTERED_' + lowerWord);
  }
  notebook = notebook.filter(n => n.id !== id);
  saveVocabNotebook(notebook);

  const validMasteredIds = notebook.filter(n => n.isMastered).map(n => n.id);
  saveMasteredVocabIds(validMasteredIds);

  renderNotebookUI();
  renderFlashcardUI();
}

function splitCombinedVocabInNotebook() {
  let notebook = getVocabNotebook();
  if (!notebook || !Array.isArray(notebook) || notebook.length === 0) return 0;
  return sanitizeVocabNotebook(notebook).length;
}
window.splitCombinedVocabInNotebook = splitCombinedVocabInNotebook;

function addUnit12RemainingVocab() {
  const independentWords = [
    { word: 'Parking area', phonetic: '/ˈpɑː.kɪŋ ˈeə.ri.ə/', meaning: 'Khu vực đỗ xe', example: 'Vehicles are parked in the parking area.' },
    { word: 'Parking lot', phonetic: '/ˈpɑː.kɪŋ lɒt/', meaning: 'Bãi đỗ xe', example: 'The parking lot is full today.' },
    { word: 'Cap', phonetic: '/kæp/', meaning: 'Mũ lưỡi trai, mũ mềm', example: 'He is wearing a black cap.' },
    { word: 'Hat', phonetic: '/hæt/', meaning: 'Mũ, nón (vành rộng)', example: 'Put on your hat before going out in the sun.' },
    { word: 'Glass', phonetic: '/ɡlɑːs/', meaning: 'Kính, ly thủy tinh', example: 'The glass was placed on the table.' },
    { word: 'Couch', phonetic: '/kaʊtʃ/', meaning: 'Ghế sofa dài', example: 'A comfortable couch is placed in the living room.' },
    { word: 'Sofa', phonetic: '/ˈsəʊ.fə/', meaning: 'Ghế sofa, ghế bành', example: 'She was sitting comfortably on the sofa.' },
    { word: 'Vase', phonetic: '/vɑːz/', meaning: 'Bình hoa', example: 'A vase of fresh flowers is by the window.' },
    { word: 'Floor', phonetic: '/flɔːr/', meaning: 'Sàn nhà', example: 'The wooden floor looks spotless.' },
    { word: 'Be left', phonetic: '/biː left/', meaning: 'Bỏ lại, còn sót lại', example: 'Some keys were left on the counter.' },
    { word: 'Be spilled', phonetic: '/biː spɪld/', meaning: 'Bị đổ ra, tràn ra', example: 'Coffee was spilled on the rug.' },
    { word: 'Be repaired', phonetic: '/biː rɪˈpeəd/', meaning: 'Được sửa chữa', example: 'The broken elevator is being repaired.' },
    { word: 'Be fixed', phonetic: '/biː fɪkst/', meaning: 'Được sửa chữa, khắc phục', example: 'The leaking pipe has been fixed.' },
    { word: 'Hang', phonetic: '/hæŋ/', meaning: 'Treo, móc lên (Quá khứ: hung)', example: 'A painting is hanging on the wall.' },
    { word: 'Be packed', phonetic: '/biː pækt/', meaning: 'Được đóng gói', example: 'The parcels are packed carefully.' },
    { word: 'Be rolled up', phonetic: '/biː rəʊld ʌp/', meaning: 'Được cuộn tròn lại', example: 'The yoga mat is rolled up in the corner.' },
    { word: 'Be stacked', phonetic: '/biː stækt/', meaning: 'Được xếp chồng lên nhau', example: 'Chairs are stacked neatly against the wall.' },
    { word: 'Burn', phonetic: '/bɜːn/', meaning: 'Cháy, bốc hỏa', example: 'Wood is burning warmly in the fireplace.' },
    { word: 'Beside', phonetic: '/bɪˈsaɪd/', meaning: 'Bên cạnh, sát cạnh', example: 'The lamp is placed beside the sofa.' },
    { word: 'Take a ride', phonetic: '/teɪk ə raɪd/', meaning: 'Đi cưỡi (ngựa/xe...), dạo chơi', example: 'They decided to take a ride along the beach.' }
  ];

  let notebook = getVocabNotebook();
  let count = 0;
  independentWords.forEach((item, idx) => {
    if (!notebook.some(n => n.word.toLowerCase() === item.word.toLowerCase() && n.lang === 'en')) {
      notebook.unshift({
        id: generateUniqueVocabId(item.word, 'en', idx),
        lang: 'en',
        word: item.word,
        phonetic: item.phonetic,
        meaning: item.meaning,
        example: item.example,
        isMastered: false
      });
      count++;
    }
  });

  saveVocabNotebook(notebook);
  renderNotebookUI();
  renderFlashcardUI();
  playLangDing();
  return count;
}
window.addUnit12RemainingVocab = addUnit12RemainingVocab;

function practiceNotebookInFlashcard() {
  const notebook = getVocabNotebook().filter(v => v.lang === currentLangCode);
  if (notebook.length === 0) {
    alert(`Bạn chưa có từ vựng ${NAJIMEZ_LANG_DATA[currentLangCode]?.name || ''} nào trong Sổ từ! Hãy thêm từ từ Flashcard trước nhé.`);
    return;
  }
  isPracticingNotebookOnly = true;
  flashcardIndex = 0;
  switchLangMode('flashcard');
  renderFlashcardUI();
}

// ============================================================================
// 9. CHẾ ĐỘ 5: MẪU CÂU GIAO TIẾP HẰNG NGÀY (DAILY PHRASES)
// ============================================================================
function renderPhrasesUI() {
  const container = document.getElementById('phrasesListContainer');
  if (!container) return;

  const langPack = NAJIMEZ_LANG_DATA[currentLangCode];
  const phrases = langPack?.phrases || [];

  if (phrases.length === 0) {
    container.innerHTML = '<div class="notebook-empty-state"><span>Chưa có mẫu câu cho ngôn ngữ này.</span></div>';
    return;
  }

  container.innerHTML = '';
  phrases.forEach(phrase => {
    const card = document.createElement('div');
    card.className = 'phrase-card-item';
    card.title = 'Nhấp để nghe phát âm';
    card.onclick = () => playVocabSpeech(phrase.orig, currentLangCode);

    card.innerHTML = `
      <div class="phrase-content-col">
        <div class="phrase-orig-text">${phrase.orig}</div>
        <div class="phrase-trans-text">${phrase.trans}</div>
        <span class="phrase-context-tag">📌 ${phrase.topic}</span>
      </div>
      <button type="button" class="btn-speak-vocab" style="margin: 0; align-self: center;">
        <i class="fa-solid fa-volume-high"></i>
      </button>
    `;
    container.appendChild(card);
  });
}
window.renderNotebookUI = renderNotebookUI;

// ============================================================================
// 10. ĐIỀU HƯỚNG & KHỞI TẠO TIỆN ÍCH NGOẠI NGỮ
// ============================================================================
let currentLangMode = 'flashcard';

function getLangFlagBadgeHtml(langCode) {
  const flags = {
    en: '<span class="lang-flag-circle flag-en">EN</span>',
    ja: '<span class="lang-flag-circle flag-ja">JA</span>',
    ko: '<span class="lang-flag-circle flag-ko">KO</span>',
    zh: '<span class="lang-flag-circle flag-zh">ZH</span>',
    fr: '<span class="lang-flag-circle flag-fr">FR</span>',
    de: '<span class="lang-flag-circle flag-de">DE</span>'
  };
  return flags[langCode] || '<span class="lang-flag-circle">🌐</span>';
}
window.getLangFlagBadgeHtml = getLangFlagBadgeHtml;

function switchLanguage(langCode, e) {
  if (e) {
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
    if (typeof e.preventDefault === 'function') e.preventDefault();
  }
  if (!NAJIMEZ_LANG_DATA[langCode]) return;
  currentLangCode = langCode;
  flashcardIndex = 0;
  isPracticingNotebookOnly = false;

  const langPack = NAJIMEZ_LANG_DATA[langCode];

  // Cập nhật ô đại diện ngôn ngữ hiện tại phía bên phải
  const flagEl = document.getElementById('currLangFlag');
  const nameEl = document.getElementById('currLangName');
  if (flagEl && langPack) flagEl.innerHTML = getLangFlagBadgeHtml(langCode);
  if (nameEl && langPack) nameEl.textContent = langPack.name;

  // Cập nhật trạng thái các item trong menu dropdown
  document.querySelectorAll('.lang-opt-item').forEach(item => {
    item.classList.toggle('active', item.dataset.lang === langCode);
  });

  // Đóng dropdown menu sau khi chọn
  closeLangPickerMenu();

  // Cập nhật Topic dropdown trong Flashcard
  const topicSelect = document.getElementById('flashcardTopicSelect');
  if (topicSelect) {
    const topics = langPack.topics || [];
    topicSelect.innerHTML = topics.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    currentLangTopic = 'all';
  }

  renderFlashcardUI();
  initNewQuizRound();
  renderPhrasesUI();
  renderNotebookUI();
}
window.switchLanguage = switchLanguage;

function toggleLangPickerMenu(e) {
  if (e) {
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
    if (typeof e.preventDefault === 'function') e.preventDefault();
  }
  const menu = document.getElementById('langPickerMenu');
  const btn = document.getElementById('btnCurrLangPicker');
  if (!menu || !btn) return;
  const isOpen = menu.classList.contains('show');
  if (isOpen) {
    closeLangPickerMenu();
  } else {
    menu.classList.add('show');
    btn.classList.add('open');
  }
}
window.toggleLangPickerMenu = toggleLangPickerMenu;

function closeLangPickerMenu() {
  const menu = document.getElementById('langPickerMenu');
  const btn = document.getElementById('btnCurrLangPicker');
  if (menu) menu.classList.remove('show');
  if (btn) btn.classList.remove('open');
}
window.closeLangPickerMenu = closeLangPickerMenu;

function switchLangMode(modeId) {
  currentLangMode = modeId;

  // Cập nhật nút chuyển chế độ
  document.querySelectorAll('.btn-lang-mode').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === modeId);
  });

  // Cập nhật khung hiển thị chế độ
  document.querySelectorAll('.lang-mode-pane').forEach(pane => {
    pane.classList.remove('active');
  });

  const targetPane = document.getElementById(`langModePane-${modeId}`);
  if (targetPane) targetPane.classList.add('active');

  // Khởi chạy nội dung tương ứng
  if (modeId === 'flashcard') renderFlashcardUI();
  else if (modeId === 'quiz') initNewQuizRound();
  else if (modeId === 'phrases') renderPhrasesUI();
}

function renderLanguageTab() {
  renderFlashcardUI();
  renderNotebookUI();
  renderPhrasesUI();
}

function switchNavRailView(viewName, e) {
  if (e) {
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
    if (typeof e.preventDefault === 'function') e.preventDefault();
  }

  // 1. Cập nhật nút active
  document.querySelectorAll('.lang-nav-vbtn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  // 2. Chuyển đổi hiển thị pane bên phải
  document.querySelectorAll('.lang-view-pane').forEach(p => {
    p.classList.remove('active');
  });

  if (viewName === 'my-vocab') {
    const pane = document.getElementById('paneMyVocab');
    if (pane) pane.classList.add('active');
    renderNotebookUI();
  } else if (viewName === 'flashcard') {
    const pane = document.getElementById('paneFlashcard');
    if (pane) pane.classList.add('active');
    renderFlashcardUI();
  } else if (viewName === 'quiz') {
    const pane = document.getElementById('paneQuiz');
    if (pane) pane.classList.add('active');
    initNewQuizRound();
  }
}
window.switchNavRailView = switchNavRailView;

let isLanguageLearningInitialized = false;

function initLanguageLearning() {
  if (isLanguageLearningInitialized) return;
  isLanguageLearningInitialized = true;
  // 1. Lắng nghe mở / đóng dropdown chọn ngôn ngữ
  const btnCurrLang = document.getElementById('btnCurrLangPicker');
  if (btnCurrLang) {
    btnCurrLang.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleLangPickerMenu();
    });
  }

  // Click vào từng ngôn ngữ trong dropdown menu
  document.querySelectorAll('.lang-opt-item').forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const lang = opt.dataset.lang;
      if (lang) switchLanguage(lang);
    });
  });

  // Tự động đóng dropdown khi click ra ngoài màn hình
  document.addEventListener('click', (e) => {
    const wrapper = document.getElementById('langDropdownWrapper');
    if (wrapper && !wrapper.contains(e.target)) {
      closeLangPickerMenu();
    }
  });

  // Lắng nghe click chuyển đổi 3 nút điều hướng dọc
  document.querySelectorAll('.lang-nav-vbtn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const view = btn.dataset.view;
      if (view) switchNavRailView(view, e);
    });
  });

  // Đóng/mở form thêm từ mới Sổ từ vựng của tôi
  const btnToggleForm = document.getElementById('btnToggleAddVocabForm');
  const formBox = document.getElementById('myVocabFormBox');
  if (btnToggleForm && formBox) {
    btnToggleForm.addEventListener('click', () => {
      const isHidden = formBox.style.display === 'none';
      formBox.style.display = isHidden ? 'flex' : 'none';
      if (isHidden) {
        const inp = document.getElementById('newVocabWord');
        if (inp) inp.focus();
      }
    });
  }

  const btnCloseForm = document.getElementById('btnCloseAddVocabForm');
  if (btnCloseForm && formBox) {
    btnCloseForm.addEventListener('click', () => { formBox.style.display = 'none'; });
  }

  const btnCancelForm = document.getElementById('btnCancelAddVocab');
  if (btnCancelForm && formBox) {
    btnCancelForm.addEventListener('click', () => { formBox.style.display = 'none'; });
  }

  const btnSaveVocab = document.getElementById('btnSaveNewVocab');
  if (btnSaveVocab) {
    btnSaveVocab.addEventListener('click', saveNewCustomVocab);
  }

  // Tìm kiếm từ vựng
  const searchInput = document.getElementById('myVocabSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderNotebookUI();
    });
  }

  // 2. Chuyển chế độ học tập (Flashcard / Quiz / Phrases)
  document.querySelectorAll('.btn-lang-mode').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      if (mode) switchLangMode(mode);
    });
  });

  // 3. Topic filter Flashcard
  const topicSelect = document.getElementById('flashcardTopicSelect');
  if (topicSelect) {
    topicSelect.addEventListener('change', (e) => {
      currentLangTopic = e.target.value;
      flashcardIndex = 0;
      isPracticingNotebookOnly = false;
      renderFlashcardUI();
    });
  }

  // 4. Lật thẻ và nút điều hướng Flashcard
  const cardStage = document.getElementById('langFlashcardStage');
  if (cardStage) {
    cardStage.addEventListener('click', (e) => {
      // Bỏ qua nếu bấm vào nút con
      if (e.target.closest('button')) return;
      flipFlashcard();
    });
  }

  const btnPrev = document.getElementById('btnLangPrevCard');
  if (btnPrev) btnPrev.addEventListener('click', prevFlashcard);

  const btnNext = document.getElementById('btnLangNextCard');
  if (btnNext) btnNext.addEventListener('click', nextFlashcard);

  const btnShuffle = document.getElementById('btnLangShuffleCard');
  if (btnShuffle) btnShuffle.addEventListener('click', shuffleFlashcards);

  const btnPractice = document.getElementById('btnLangNeedPractice');
  if (btnPractice) btnPractice.addEventListener('click', () => markVocabLearned(false));

  const btnMastered = document.getElementById('btnLangMastered');
  if (btnMastered) btnMastered.addEventListener('click', () => markVocabLearned(true));

  const btnBookmark = document.getElementById('btnLangBookmarkCard');
  if (btnBookmark) btnBookmark.addEventListener('click', toggleBookmarkCurrentCard);

  // 5. Nút loa phát âm thẻ mặt trước
  const btnFrontSpeak = document.getElementById('btnFrontVocabSpeak');
  if (btnFrontSpeak) {
    btnFrontSpeak.addEventListener('click', (e) => {
      e.stopPropagation();
      const list = getFilteredVocabList();
      if (list[flashcardIndex]) playVocabSpeech(list[flashcardIndex].word, currentLangCode);
    });
  }

  // Nút loa phát âm câu ví dụ mặt sau
  const btnBackExampleSpeak = document.getElementById('btnBackExampleSpeak');
  if (btnBackExampleSpeak) {
    btnBackExampleSpeak.addEventListener('click', (e) => {
      e.stopPropagation();
      const list = getFilteredVocabList();
      if (list[flashcardIndex]?.example) playVocabSpeech(list[flashcardIndex].example, currentLangCode);
    });
  }

  // 6. Tra từ & Dịch
  const btnSearchDict = document.getElementById('btnSearchDict');
  if (btnSearchDict) btnSearchDict.addEventListener('click', performDictLookup);

  const dictInput = document.getElementById('dictSearchInput');
  if (dictInput) {
    dictInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') performDictLookup();
    });
  }

  // 7. Ôn tập sổ từ bằng flashcard
  const btnPracticeNb = document.getElementById('btnPracticeNotebookFlashcard');
  if (btnPracticeNb) btnPracticeNb.addEventListener('click', practiceNotebookInFlashcard);

  // 8. Lắng nghe phím tắt bàn phím tiện lợi cho Flashcard (Trái / Phải / Space)
  document.addEventListener('keydown', (e) => {
    const tabLang = document.getElementById('tab-language');
    const paneFc = document.getElementById('paneFlashcard');
    if (!tabLang || !tabLang.classList.contains('active')) return;
    if (!paneFc || !paneFc.classList.contains('active')) return;

    // Không bắt phím khi đang nhập form
    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (['input', 'textarea', 'select'].includes(activeTag)) return;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextFlashcard();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevFlashcard();
    } else if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      flipFlashcard();
    }
  });

  // Tự động phân tách các thẻ bị gộp dạng "A / B" thành từng từ riêng biệt để tránh học vẹt
  splitCombinedVocabInNotebook();

  // Nạp giao diện ban đầu
  switchLanguage('en');
  updateNotebookBadge();
  renderNotebookUI();
  renderFlashcardUI();
}
window.initLanguageLearning = initLanguageLearning;

// Tự động khởi chạy an toàn nếu chưa khởi tạo qua app.js
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initLanguageLearning();
} else {
  document.addEventListener('DOMContentLoaded', initLanguageLearning);
}

