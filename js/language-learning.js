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

// Trạng thái Mini Quiz
let quizState = {
  score: 0,
  streak: 0,
  currentVocab: null,
  options: [],
  isAnswered: false
};

// ============================================================================
// 3. QUẢN LÝ LƯU TRỮ SỔ TỪ VỰNG & TIẾN ĐỘ HỌC
// ============================================================================
const STORAGE_KEY_NOTEBOOK = 'NAJIMEZ_VOCAB_NOTEBOOK_V1';
const STORAGE_KEY_MASTERED = 'NAJIMEZ_VOCAB_MASTERED_V1';

function getVocabNotebook() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTEBOOK);
    return raw ? JSON.parse(raw) : [];
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

// ============================================================================
// 5. CHẾ ĐỘ 1: FLASHCARD 3D THÔNG MINH (LẤY TỪ SỔ TỪ VỰNG CỦA TÔI)
// ============================================================================
let flashcardScope = 'current'; // 'current' (ngôn ngữ đang chọn) | 'all' (toàn bộ sổ từ)

function changeFlashcardScope(scope) {
  flashcardScope = scope || 'current';
  flashcardIndex = 0;
  renderFlashcardUI();
}
window.changeFlashcardScope = changeFlashcardScope;

function getFilteredVocabList() {
  const notebook = getVocabNotebook();
  if (!notebook || !Array.isArray(notebook) || notebook.length === 0) {
    return [];
  }

  if (flashcardScope === 'all') {
    return notebook;
  }

  // Mặc định: Lọc theo ngôn ngữ đang chọn (hoặc từ chưa gán lang)
  const filtered = notebook.filter(item => {
    if (!item.lang) return true;
    return item.lang === currentLangCode;
  });

  return filtered;
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

  // 1. Trường hợp không có từ vựng nào để hỏi
  if (vocabList.length === 0) {
    if (activeContent) activeContent.style.display = 'none';
    if (emptyBox) {
      emptyBox.style.display = 'flex';
      const currLangName = NAJIMEZ_LANG_DATA[currentLangCode]?.name || 'Ngoại ngữ';
      const emptyTitle = emptyBox.querySelector('.fc-empty-title');
      const emptyDesc = emptyBox.querySelector('.fc-empty-desc');

      if (notebook.length > 0 && flashcardScope === 'current') {
        if (emptyTitle) emptyTitle.textContent = `Chưa có từ vựng ${currLangName} trong Sổ từ!`;
        if (emptyDesc) emptyDesc.innerHTML = `Sổ từ hiện có <strong>${notebook.length} từ</strong> thuộc ngôn ngữ khác. Bạn có thể chọn phạm vi <em>"Toàn bộ sổ từ"</em> ở góc phải hoặc bấm nút bên dưới để nạp từ mẫu ${currLangName} nhé.`;
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
  const masteredIds = getMasteredVocabIds();
  const isMastered = masteredIds.includes(currentItem.id);

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

function markVocabLearned(isMastered) {
  const list = getFilteredVocabList();
  if (list.length === 0) return;
  const currentItem = list[flashcardIndex];
  let masteredIds = getMasteredVocabIds();

  if (isMastered) {
    if (!masteredIds.includes(currentItem.id)) masteredIds.push(currentItem.id);
    playLangDing();
  } else {
    masteredIds = masteredIds.filter(id => id !== currentItem.id);
  }
  saveMasteredVocabIds(masteredIds);
  renderFlashcardUI();

  // Tự động chuyển từ tiếp theo sau 250ms
  setTimeout(() => {
    nextFlashcard();
  }, 250);
}
window.markVocabLearned = markVocabLearned;

function toggleBookmarkCurrentCard() {
  const list = getFilteredVocabList();
  if (list.length === 0) return;
  const item = list[flashcardIndex];
  let masteredIds = getMasteredVocabIds();

  const isMastered = masteredIds.includes(item.id);
  markVocabLearned(!isMastered);
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
// 6. CHẾ ĐỘ 2: MINI QUIZ TRẮC NGHIỆM PHẢN XẠ NHANH
// ============================================================================
function initNewQuizRound() {
  const targetWordEl = document.getElementById('quizTargetWord');
  const grid = document.getElementById('quizOptionsGrid');
  if (!targetWordEl || !grid) return;

  const langPack = NAJIMEZ_LANG_DATA[currentLangCode];
  if (!langPack || !langPack.vocab || langPack.vocab.length < 2) return;

  const vocabList = langPack.vocab;
  quizState.isAnswered = false;

  // Chọn ngẫu nhiên 1 từ làm câu hỏi
  const target = vocabList[Math.floor(Math.random() * vocabList.length)];
  quizState.currentVocab = target;

  // Lấy các đáp án sai từ các từ còn lại
  const wrongOptions = vocabList.filter(v => v.id !== target.id)
    .sort(() => 0.5 - Math.random())
    .slice(0, 3)
    .map(v => v.meaning);

  // Gộp đáp án đúng và xáo trộn
  const allOptions = [target.meaning, ...wrongOptions].sort(() => 0.5 - Math.random());
  quizState.options = allOptions;

  // Render câu hỏi
  document.getElementById('quizTargetWord').innerHTML = `
    <span>${target.word}</span>
    <button type="button" class="btn-speak-vocab" onclick="playVocabSpeech('${target.word.replace(/'/g, "\\'")}', '${currentLangCode}')" title="Nghe phát âm">
      <i class="fa-solid fa-volume-high"></i>
    </button>
  `;
  document.getElementById('quizPhoneticHint').textContent = target.phonetic || '';

  // Render 4 đáp án
  grid.innerHTML = '';
  const letters = ['A', 'B', 'C', 'D'];

  allOptions.forEach((optText, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-quiz-option';
    btn.innerHTML = `
      <span class="quiz-opt-letter">${letters[idx]}</span>
      <span class="quiz-opt-text">${optText}</span>
    `;
    btn.onclick = () => handleQuizAnswer(optText, btn);
    grid.appendChild(btn);
  });

  // Cập nhật điểm & Streak
  document.getElementById('quizScoreText').textContent = quizState.score;
  document.getElementById('quizStreakText').textContent = quizState.streak;
}

function handleQuizAnswer(selectedText, clickedBtn) {
  if (quizState.isAnswered) return;
  quizState.isAnswered = true;

  const isCorrect = selectedText === quizState.currentVocab.meaning;
  const allBtns = document.querySelectorAll('.btn-quiz-option');

  allBtns.forEach(btn => {
    btn.disabled = true;
    const textSpan = btn.querySelector('.quiz-opt-text');
    if (textSpan && textSpan.textContent === quizState.currentVocab.meaning) {
      btn.classList.add('correct');
    }
  });

  if (isCorrect) {
    clickedBtn.classList.add('correct');
    quizState.score += 10;
    quizState.streak += 1;
    playLangDing();
  } else {
    clickedBtn.classList.add('wrong');
    quizState.streak = 0;
  }

  document.getElementById('quizScoreText').textContent = quizState.score;
  document.getElementById('quizStreakText').textContent = quizState.streak;

  // Tự động chuyển câu sau 1.3s
  setTimeout(() => {
    initNewQuizRound();
  }, 1300);
}

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

    card.innerHTML = `
      <div class="my-vocab-card-top">
        <div class="my-vocab-word-group">
          ${flagHtml}
          <span class="my-vocab-word">${item.word}</span>
          ${item.phonetic ? `<span class="my-vocab-ipa">${item.phonetic}</span>` : ''}
        </div>
        <div class="my-vocab-card-actions">
          <button type="button" class="btn-nb-icon" onclick="playVocabSpeech('${item.word.replace(/'/g, "\\'")}', '${langCode}')" title="Nghe phát âm">
            <i class="fa-solid fa-volume-high"></i>
          </button>
          <button type="button" class="btn-nb-icon delete" onclick="deleteFromNotebook('${item.id}')" title="Xóa khỏi sổ từ">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>
      </div>
      <div class="my-vocab-meaning">${item.meaning}</div>
      ${item.example ? `<div class="my-vocab-example">${item.example}</div>` : ''}
    `;
    container.appendChild(card);
  });
}
window.renderNotebookUI = renderNotebookUI;

function addSampleVocabToNotebook() {
  const langPack = NAJIMEZ_LANG_DATA[currentLangCode] || NAJIMEZ_LANG_DATA.en;
  const samples = (langPack.vocab || []).slice(0, 3);
  let notebook = getVocabNotebook();
  samples.forEach(s => {
    if (!notebook.some(n => n.word.toLowerCase() === s.word.toLowerCase() && n.lang === currentLangCode)) {
      notebook.unshift({
        id: 'sample-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        lang: currentLangCode,
        word: s.word,
        phonetic: s.phonetic || '',
        meaning: s.meaning,
        example: s.example || '',
        exampleTrans: s.exampleTrans || ''
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
  notebook.unshift({
    id: 'user-' + Date.now(),
    lang: currentLangCode,
    word: word,
    phonetic: phonetic,
    meaning: meaning,
    example: example
  });

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
  notebook = notebook.filter(n => n.id !== id);
  saveVocabNotebook(notebook);
  renderNotebookUI();
  renderFlashcardUI();
}

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

function initLanguageLearning() {
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

  // Nạp giao diện ban đầu
  switchLanguage('en');
  updateNotebookBadge();
  renderNotebookUI();
  renderFlashcardUI();
}

// Tự động khởi chạy khi sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLanguageLearning);
} else {
  initLanguageLearning();
}

