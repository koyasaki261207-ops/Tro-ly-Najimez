/**
 * js/copilot.js - Trợ lý AI Copilot (Gemini API Streaming, Action Engine & Khung Chat)
 */

function getStoredApiKey() {
  const raw = localStorage.getItem(APP_CONFIG.storageKey) || '';
  return raw.trim().replace(/^["']|["']$/g, '').trim();
}

function setStoredApiKey(key) {
  if (key) {
    const cleanKey = key.trim().replace(/^["']|["']$/g, '').trim();
    localStorage.setItem(APP_CONFIG.storageKey, cleanKey);
  } else {
    localStorage.removeItem(APP_CONFIG.storageKey);
    localStorage.removeItem('najimez_gemini_active_model');
  }
  cachedModelInfo = null;
  updateApiKeyUI();
}

function updateApiKeyUI() {
  const key = getStoredApiKey();
  const btnKey = document.getElementById('btnOpenApiKeyModal');
  const statusBadge = document.getElementById('apiStatusBadge');
  const statusText = document.getElementById('apiStatusText');
  const input = document.getElementById('geminiApiKeyInput');
  const activeModel = getActiveModelInfo();

  if (input) input.value = key;

  if (key) {
    const modelTag = activeModel ? (activeModel.displayName || activeModel.modelName) : 'Gemini AI';
    if (btnKey) {
      btnKey.classList.add('connected');
      btnKey.title = `Đã kết nối: ${modelTag} (Nhấp để xem/đổi key)`;
    }
    if (statusBadge) statusBadge.className = 'api-status-badge active';
    if (statusText) statusText.textContent = `Đã kết nối: ${modelTag} (Real-time Streaming)`;
  } else {
    if (btnKey) {
      btnKey.classList.remove('connected');
      btnKey.title = 'Cài đặt Google Gemini API Key';
    }
    if (statusBadge) statusBadge.className = 'api-status-badge';
    if (statusText) statusText.textContent = `Đang sử dụng bộ não dự phòng nội bộ`;
  }
}

function initApiKeyModal() {
  const modal = document.getElementById('apiKeyModal');
  const btnOpen = document.getElementById('btnOpenApiKeyModal');
  const btnClose = document.getElementById('btnCloseApiKeyModal');
  const btnSave = document.getElementById('btnSaveApiKey');
  const btnRemove = document.getElementById('btnRemoveApiKey');
  const input = document.getElementById('geminiApiKeyInput');
  const btnTogglePw = document.getElementById('btnToggleApiKeyVisibility');

  if (!modal) return;

  function openModal() {
    updateApiKeyUI();
    modal.classList.add('active');
    if (input) input.focus();
  }

  function closeModal() {
    modal.classList.remove('active');
  }

  if (btnOpen) btnOpen.addEventListener('click', openModal);
  if (btnClose) btnClose.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  if (btnTogglePw && input) {
    btnTogglePw.addEventListener('click', () => {
      const isPw = input.type === 'password';
      input.type = isPw ? 'text' : 'password';
      btnTogglePw.innerHTML = isPw ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
    });
  }

  if (btnSave && input) {
    btnSave.addEventListener('click', async () => {
      const rawVal = input.value.trim();
      const val = rawVal.replace(/^["']|["']$/g, '').trim();
      if (!val) {
        alert('Vui lòng dán mã API Key của bạn từ Google AI Studio.');
        return;
      }

      const statusBadge = document.getElementById('apiStatusBadge');
      const statusText = document.getElementById('apiStatusText');
      const originalHtml = btnSave.innerHTML;

      btnSave.disabled = true;
      btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tự động dò mô hình Gemini khả dụng...';
      if (statusBadge) statusBadge.className = 'api-status-badge';
      if (statusText) statusText.textContent = 'Đang truy vấn ModelService từ Google AI Studio...';

      try {
        const detected = await autoDetectAndTestModel(val);
        setStoredApiKey(val);
        closeModal();
        notifyChat(`🎉 **Kết nối Google Gemini API thành công!**\n\nNajimez đã tự động nhận diện và kích hoạt mô hình: **${detected.displayName || detected.modelName}** (${detected.version}).\n\nToàn bộ khả năng tư duy đỉnh cao, giải bài tập, viết code và phản hồi Real-time Streaming của Gemini đã sẵn sàng! Hãy thử nhắn một câu bất kỳ nhé.`);
      } catch (err) {
        if (statusBadge) statusBadge.className = 'api-status-badge error';
        if (statusText) statusText.textContent = `❌ Lỗi: ${err.message}`;
        alert(`Google từ chối kết nối API Key:\n\n${err.message}\n\nHướng dẫn khắc phục:\n1. Truy cập https://aistudio.google.com/app/apikey để tạo hoặc sao chép mã Key mới.\n2. Đảm bảo mã key bắt đầu bằng AIzaSy... và không có khoảng trắng thừa.`);
      } finally {
        btnSave.disabled = false;
        btnSave.innerHTML = originalHtml;
      }
    });
  }

  if (btnRemove) {
    btnRemove.addEventListener('click', () => {
      if (confirm('Bạn có chắc muốn xóa API Key này không?')) {
        setStoredApiKey('');
        closeModal();
        notifyChat('Đã ngắt kết nối Gemini API. Najimez chuyển sang hoạt động qua bộ não nội bộ.');
      }
    });
  }

  updateApiKeyUI();
}

function getActiveModelInfo() {
  if (cachedModelInfo) return cachedModelInfo;
  try {
    const raw = localStorage.getItem('najimez_gemini_active_model');
    if (raw) {
      cachedModelInfo = JSON.parse(raw);
      return cachedModelInfo;
    }
  } catch (e) { }
  return null;
}

function setActiveModelInfo(info) {
  cachedModelInfo = info;
  try {
    if (info) localStorage.setItem('najimez_gemini_active_model', JSON.stringify(info));
    else localStorage.removeItem('najimez_gemini_active_model');
  } catch (e) { }
}

async function autoDetectAndTestModel(apiKey) {
  const cleanKey = (apiKey || '').trim().replace(/^["']|["']$/g, '').trim();
  if (!cleanKey) {
    throw new Error('Mã API Key trống. Vui lòng dán mã key từ Google AI Studio.');
  }

  // 1. Thử model đã được lưu từ phiên trước
  const saved = getActiveModelInfo();
  if (saved && saved.modelName && saved.version) {
    try {
      const url = `https://generativelanguage.googleapis.com/${saved.version}/models/${saved.modelName}:generateContent?key=${cleanKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }] })
      });
      if (res.ok) return saved;
    } catch (e) { }
  }

  // 2. Truy vấn danh sách ModelService.ListModels trực tiếp từ Google
  const listEndpoints = [
    { url: `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`, version: 'v1beta' },
    { url: `https://generativelanguage.googleapis.com/v1/models?key=${cleanKey}`, version: 'v1' }
  ];

  let detailedError = '';

  for (const ep of listEndpoints) {
    try {
      const res = await fetch(ep.url);
      if (res.ok) {
        const data = await res.json();
        if (data.models && Array.isArray(data.models)) {
          const supported = data.models.filter(m =>
            m.supportedGenerationMethods &&
            m.supportedGenerationMethods.includes('generateContent')
          );

          if (supported.length > 0) {
            const sorted = supported.slice().sort((a, b) => {
              function score(n) {
                const s = n.toLowerCase();
                if (s.includes('2.5-flash')) return 120;
                if (s.includes('2.0-flash') && !s.includes('lite')) return 110;
                if (s.includes('flash-latest')) return 100;
                if (s.includes('1.5-flash-002')) return 95;
                if (s.includes('1.5-flash-001')) return 90;
                if (s.includes('1.5-flash-8b')) return 85;
                if (s.includes('1.5-flash')) return 80;
                if (s.includes('flash')) return 70;
                if (s.includes('2.5-pro')) return 65;
                if (s.includes('1.5-pro')) return 60;
                if (s.includes('pro')) return 50;
                return 10;
              }
              return score(b.name) - score(a.name);
            });

            for (const cand of sorted) {
              const candModel = cand.name.replace(/^models\//, '');
              try {
                const testUrl = `https://generativelanguage.googleapis.com/${ep.version}/models/${candModel}:generateContent?key=${cleanKey}`;
                const testRes = await fetch(testUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }] })
                });

                if (testRes.ok) {
                  const result = {
                    modelName: candModel,
                    version: ep.version,
                    displayName: cand.displayName || candModel
                  };
                  setActiveModelInfo(result);
                  return result;
                } else {
                  const errJson = await testRes.json().catch(() => ({}));
                  if (errJson.error?.message) {
                    detailedError = errJson.error.message;
                  }
                }
              } catch (e) { }
            }
          }
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        if (errJson.error) {
          const code = errJson.error.code;
          const msg = errJson.error.message || '';
          const status = errJson.error.status || '';

          if (status === 'INVALID_ARGUMENT' || msg.includes('API key not valid') || code === 400) {
            throw new Error('Mã API Key không hợp lệ. Vui lòng kiểm tra lại mã đã sao chép từ Google AI Studio.');
          }
          if (status === 'RESOURCE_EXHAUSTED' || code === 429) {
            throw new Error('Tài khoản của bạn tạm thời hết hạn mức (Quota/Rate limit). Vui lòng thử lại sau vài phút hoặc dùng tài khoản Google khác.');
          }
          if (status === 'PERMISSION_DENIED' || code === 403) {
            throw new Error('Mã API Key bị từ chối quyền (Generative Language API chưa được kích hoạt trên Google Cloud).');
          }
          detailedError = msg || `HTTP ${res.status}`;
        }
      }
    } catch (e) {
      if (e.message && (e.message.includes('API Key không hợp lệ') || e.message.includes('hạn mức') || e.message.includes('quyền'))) {
        throw e;
      }
      detailedError = e.message;
    }
  }

  // 3. Dự phòng danh sách các model phổ biến nếu ListModels bị chặn
  const directCandidates = [
    { modelName: 'gemini-2.0-flash', version: 'v1beta', displayName: 'Gemini 2.0 Flash' },
    { modelName: 'gemini-2.5-flash', version: 'v1beta', displayName: 'Gemini 2.5 Flash' },
    { modelName: 'gemini-1.5-flash-latest', version: 'v1beta', displayName: 'Gemini 1.5 Flash Latest' },
    { modelName: 'gemini-1.5-flash-002', version: 'v1beta', displayName: 'Gemini 1.5 Flash 002' },
    { modelName: 'gemini-1.5-flash', version: 'v1', displayName: 'Gemini 1.5 Flash (v1)' },
    { modelName: 'gemini-1.5-flash-8b', version: 'v1beta', displayName: 'Gemini 1.5 Flash 8B' },
    { modelName: 'gemini-1.5-pro', version: 'v1beta', displayName: 'Gemini 1.5 Pro' },
    { modelName: 'gemini-pro', version: 'v1', displayName: 'Gemini Pro' }
  ];

  for (const cand of directCandidates) {
    try {
      const testUrl = `https://generativelanguage.googleapis.com/${cand.version}/models/${cand.modelName}:generateContent?key=${cleanKey}`;
      const testRes = await fetch(testUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }] })
      });
      if (testRes.ok) {
        const result = { modelName: cand.modelName, version: cand.version, displayName: cand.displayName };
        setActiveModelInfo(result);
        return result;
      } else {
        const errJson = await testRes.json().catch(() => ({}));
        if (errJson.error?.message) {
          detailedError = errJson.error.message;
        }
      }
    } catch (e) { }
  }

  throw new Error(detailedError || 'Không tìm thấy mô hình Gemini nào khả dụng cho API Key này. Vui lòng tạo key mới tại Google AI Studio.');
}

// Xây dựng System Prompt động cung cấp dữ liệu sổ cái thời gian thực & toàn quyền quản lý cho AI
function buildDynamicSystemPrompt() {
  const data = getLedgerData();
  const debts = Array.isArray(data.debts) ? data.debts : [];
  const txs = Array.isArray(data.transactions) ? data.transactions : [];
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  const calendarEvents = Array.isArray(data.calendarEvents) ? data.calendarEvents : [];

  // 0. Phân tích Thời Gian Hệ Thống Hiện Tại
  const now = new Date();
  const dayOfWeekNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const curDayOfWeek = dayOfWeekNames[now.getDay()];
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const todayKey = `${yyyy}-${mm}-${dd}`;
  const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomY = tomorrow.getFullYear();
  const tomM = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const tomD = String(tomorrow.getDate()).padStart(2, '0');
  const tomorrowKey = `${tomY}-${tomM}-${tomD}`;
  const tomorrowDayOfWeek = dayOfWeekNames[tomorrow.getDay()];

  // Phân tích sự kiện lịch & thời khóa biểu
  const checkOccur = typeof isEventOccurringOnDate === 'function'
    ? isEventOccurringOnDate
    : (e, k) => (e.date === k || (e.endDate && k >= e.date && k <= e.endDate));

  const todayEvents = calendarEvents.filter(e => checkOccur(e, todayKey));
  const tomorrowEvents = calendarEvents.filter(e => checkOccur(e, tomorrowKey));

  // Sự kiện trong vòng 7 ngày tới (đối chiếu lặp lại)
  const upcomingEventsSummary = [];
  for (let i = 0; i <= 7; i++) {
    const targetDt = new Date(now);
    targetDt.setDate(targetDt.getDate() + i);
    const tY = targetDt.getFullYear();
    const tM = String(targetDt.getMonth() + 1).padStart(2, '0');
    const tD = String(targetDt.getDate()).padStart(2, '0');
    const tKey = `${tY}-${tM}-${tD}`;
    const tDayName = dayOfWeekNames[targetDt.getDay()];
    const evsOnDay = calendarEvents.filter(e => checkOccur(e, tKey));
    if (evsOnDay.length > 0) {
      const label = i === 0 ? 'Hôm nay' : (i === 1 ? 'Ngày mai' : `${tDayName}`);
      upcomingEventsSummary.push(`  + ${label} (${tD}/${tM}/${tY} - ${tKey}): ` + evsOnDay.map(e => {
        let tStr = e.time ? ` [⏰ ${e.time}${e.endTime ? ' - ' + e.endTime : ''}]` : '';
        let cStr = e.category ? ` (${e.category})` : '';
        let nStr = e.note ? ` - Ghi chú: ${e.note}` : '';
        return `"${e.title}"${tStr}${cStr}${nStr}`;
      }).join('; '));
    }
  }

  // Toàn bộ danh sách sự kiện lịch trong hệ thống
  const allEventsList = calendarEvents.map(e => {
    let dateStr = e.date || 'Chưa định ngày';
    if (e.endDate && e.endDate !== e.date) dateStr += ` đến ${e.endDate}`;
    let timeStr = e.time ? `${e.time}${e.endTime ? ' - ' + e.endTime : ''}` : 'Cả ngày';
    let rLabel = (typeof getRepeatLabel === 'function' ? getRepeatLabel(e) : (e.repeat && e.repeat !== 'none' ? `Lặp ${e.repeat}` : '')) || 'Không lặp';
    let line = `  + [${e.category || 'Sự kiện'}] "${e.title}" | Ngày: ${dateStr} | Giờ: ${timeStr} | Lặp: ${rLabel}`;
    if (e.note) line += ` | Ghi chú: ${e.note}`;
    return line;
  });

  // Phân tích sổ nợ theo từng đối tượng
  const contactMap = {};
  debts.forEach(d => {
    const p = (d.person || 'Người quen').trim();
    if (!contactMap[p]) {
      contactMap[p] = { name: p, theyOweMe: 0, iOweThem: 0, items: [] };
    }
    const amt = Number(d.amount) || 0;
    contactMap[p].items.push(d);
    if (d.status !== 'paid') {
      if (d.direction === 'they_owe_me') contactMap[p].theyOweMe += amt;
      else contactMap[p].iOweThem += amt;
    }
  });

  const contactsList = Object.values(contactMap).map(c => {
    const net = c.theyOweMe - c.iOweThem;
    return {
      name: c.name,
      net,
      theyOweMe: c.theyOweMe,
      iOweThem: c.iOweThem,
      status: net > 0 ? 'they_owe_me' : (net < 0 ? 'i_owe_them' : 'paid'),
      hasUnpaid: c.theyOweMe > 0 || c.iOweThem > 0
    };
  });

  const whoOwesMe = contactsList.filter(c => c.net > 0).sort((a, b) => b.net - a.net);
  const whoIOwe = contactsList.filter(c => c.net < 0).sort((a, b) => a.net - b.net);
  const paidContacts = contactsList.filter(c => !c.hasUnpaid);

  let totalTheyOweMe = 0;
  let totalIOweThem = 0;
  whoOwesMe.forEach(c => totalTheyOweMe += c.net);
  whoIOwe.forEach(c => totalIOweThem += Math.abs(c.net));

  // Phân tích thu chi
  let totalInc = 0;
  let totalExp = 0;
  txs.forEach(t => {
    const amt = Number(t.amount) || 0;
    if (t.type === 'income') totalInc += amt;
    else totalExp += amt;
  });
  const balance = totalInc - totalExp;

  // Phân tích công việc
  const pendingTasks = tasks.filter(t => !t.done);

  return `${APP_CONFIG.systemPrompt}

============================================================
CƠ SỞ DỮ LIỆU THỜI GIAN THỰC CỦA HỆ THỐNG (TRA CỨU TRONG HẬU TRƯỜNG):
============================================================
Dưới đây là dữ liệu thời gian thực hiện có của người dùng. Bạn nắm thông tin này để sẵn sàng giải đáp CHÍNH XAC KHI ĐƯỢC HỎI HOẶC YÊU CẦU THAO TÁC.
LƯU Ý ĐẶC BIỆT QUAN TRỌNG:
- Khi người dùng nói chuyện bình thường, chào hỏi, tâm sự, hỏi bài tập, lập trình, v.v., BẠN TUYỆT ĐỐI KHÔNG TỰ TIỆN LÔI SỔ NỢ HAY NHẮC TÊN AI ĐANG NỢ RA BÁO CÁO!
- Tính năng ghi nợ chỉ là công cụ phụ trợ. Việc nhắc nợ khi không được hỏi sẽ gây phiền toái và phản cảm. Chỉ nhắc đến nợ khi người dùng HỎI ĐÍCH DANH về nợ nần hoặc yêu cầu ghi nợ, trả nợ.

[0. THỜI GIAN HỆ THỐNG HIỆN TẠI (BẮT BUỘC ĐỐI CHIẾU KHI NGƯỜI DÙNG HỎI NGÀY/THỜI GIAN/LỊCH TRÌNH)]
- Thời gian hiện tại: ${currentTimeStr}, ${curDayOfWeek}, ngày ${dd}/${mm}/${yyyy} (Mã ngày YYYY-MM-DD: ${todayKey}).
- Ngày mai là: ${tomorrowDayOfWeek}, ngày ${tomD}/${tomM}/${tomY} (Mã ngày YYYY-MM-DD: ${tomorrowKey}).

[1. SỔ NỢ & ĐỐI TƯỢNG - CHỈ TRẢ LỜI KHI NGƯỜI DÙNG HỎI VỀ NỢ]
- Tổng số tiền người khác đang nợ bạn: ${formatCurrency(totalTheyOweMe)}
- Tổng số tiền bạn đang nợ người khác: ${formatCurrency(totalIOweThem)}
- Danh sách những người đang NỢ BẠN (Họ nợ tôi):
${whoOwesMe.length > 0 ? whoOwesMe.map(c => `  + ${c.name}: nợ ${formatCurrency(c.net)}`).join('\n') : '  (Hiện không có ai nợ bạn)'}
${whoOwesMe.length > 0 ? `=> NGƯỜI ĐANG NỢ BẠN NHIỀU NHẤT LÀ: ${whoOwesMe[0].name} (số tiền nợ: ${formatCurrency(whoOwesMe[0].net)})` : ''}

- Danh sách những người BẠN ĐANG NỢ (Tôi nợ họ):
${whoIOwe.length > 0 ? whoIOwe.map(c => `  + ${c.name}: bạn nợ ${formatCurrency(Math.abs(c.net))}`).join('\n') : '  (Hiện bạn không nợ ai)'}
${whoIOwe.length > 0 ? `=> NGƯỜI BẠN ĐANG NỢ NHIỀU NHẤT LÀ: ${whoIOwe[0].name} (bạn nợ: ${formatCurrency(Math.abs(whoIOwe[0].net))})` : ''}

- Danh sách những người đã trả hết nợ: ${paidContacts.length > 0 ? paidContacts.map(c => c.name).join(', ') : 'Chưa có'}

[2. SỔ THU CHI CÁ NHÂN]
- Tổng thu: ${formatCurrency(totalInc)}
- Tổng chi: ${formatCurrency(totalExp)}
- Số dư hiện tại trong ví: ${formatCurrency(balance)}
- 5 giao dịch gần nhất:
${txs.slice(0, 5).map(t => `  + [${t.type === 'income' ? 'THU' : 'CHI'}] ${t.note || t.category}: ${formatCurrency(t.amount)}`).join('\n') || '  (Chưa có giao dịch)'}

[3. VIỆC CẦN LÀM (TO-DO)]
- Công việc chưa hoàn thành (${pendingTasks.length} việc):
${pendingTasks.map(t => `  + [Chưa xong] ${t.title} (${t.time || 'Hôm nay'})`).join('\n') || '  (Không có việc tồn đọng)'}

[4. TIỆN ÍCH LỊCH & SỰ KIỆN / THỜI KHÓA BIỂU HỌC TẬP & CÔNG VIỆC]
- Sự kiện & Lịch học HÔM NAY (${curDayOfWeek} - ${dd}/${mm}/${yyyy} [${todayKey}]):
${todayEvents.length > 0 ? todayEvents.map(e => `  + "${e.title}" (⏰ ${e.time || 'Cả ngày'}${e.endTime ? ' - ' + e.endTime : ''})${e.category ? ' [' + e.category + ']' : ''}${e.note ? ' - Ghi chú: ' + e.note : ''}`).join('\n') : '  (Hôm nay không có sự kiện/lịch học nào)'}

- Sự kiện & Lịch học NGÀY MAI (${tomorrowDayOfWeek} - ${tomD}/${tomM}/${tomY} [${tomorrowKey}]):
${tomorrowEvents.length > 0 ? tomorrowEvents.map(e => `  + "${e.title}" (⏰ ${e.time || 'Cả ngày'}${e.endTime ? ' - ' + e.endTime : ''})${e.category ? ' [' + e.category + ']' : ''}${e.note ? ' - Ghi chú: ' + e.note : ''}`).join('\n') : '  (Ngày mai không có sự kiện/lịch học nào)'}

- Lịch trình các ngày sắp tới trong tuần (đã đối chiếu lặp lại):
${upcomingEventsSummary.length > 0 ? upcomingEventsSummary.join('\n') : '  (Không có lịch trình sắp tới trong 7 ngày tới)'}

- Toàn bộ danh sách sự kiện & thời khóa biểu đã lưu trong Tiện ích Lịch:
${allEventsList.length > 0 ? allEventsList.join('\n') : '  (Chưa có sự kiện nào)'}

============================================================
QUYỀN HẠN ĐIỀU KHIỂN & HÀNH ĐỘNG NÂNG CAO (ACTION PROTOCOL):
============================================================
Khi người dùng yêu cầu hành động, hãy giải thích chu đáo và đính kèm thẻ lệnh tương ứng:
1. XÓA SỔ NỢ & CÁC KHOẢN NỢ (QUAN TRỌNG: TUYỆT ĐỐI KHÔNG XÓA SỔ THU CHI):
   a) XÓA TOÀN BỘ SỔ NỢ / XÓA SẠCH LỊCH SỬ GIAO DỊCH SỔ NỢ:
      Khi người dùng yêu cầu "xóa tất cả lịch sử giao dịch trong sổ nợ", "xóa hết sổ nợ", "xóa sạch sổ nợ", "xóa toàn bộ nợ", hoặc khi người dùng xác nhận "xoá luôn", "đồng ý xóa", "xóa hết đi", "chắc chắn xóa" sau khi bạn hỏi xác nhận:
      BẮT BUỘC XUẤT THẺ:
      <!--NAJIMEZ_ACTION:{"type":"clear_all_debts"}-->
      (Hệ thống sẽ dọn sạch sổ nợ và bảo toàn nguyên vẹn mọi khoản trong Sổ Thu Chi Cá Nhân).
   b) XÓA NỢ CỦA MỘT NGƯỜI (ví dụ: "Xóa nợ của Tuấn", "Xóa Tuấn khỏi sổ nợ"):
      <!--NAJIMEZ_ACTION:{"type":"delete_debt","person":"Tuấn"}-->
   c) XÓA MỘT GIAO DỊCH NỢ CỤ THỂ TRONG LỊCH SỬ (ví dụ: "Xóa khoản bún đậu của Khang", "Xóa giao dịch net"):
      <!--NAJIMEZ_ACTION:{"type":"delete_debt_transaction","person":"Khang","note":"bún đậu"}-->
2. TẤT TOÁN NỢ / ĐÃ THU NỢ / ĐÃ TRẢ NỢ:
   a) Người khác trả nợ cho tôi / Thu hồi nợ (ví dụ: "Tuấn đã trả nợ", "Khang trả nợ", "thu 50k từ An"):
      <!--NAJIMEZ_ACTION:{"type":"settle_debt","person":"Tuấn","direction":"they_owe_me","amount":0}-->
   b) Tôi trả nợ cho người khác / Thanh toán nợ (ví dụ: "Tôi đã trả nợ cho Khang", "Tôi trả tiền cho An", "đã trả 30k cho Khang"):
      <!--NAJIMEZ_ACTION:{"type":"settle_debt","person":"Lê Thanh Khang","direction":"i_owe_them","amount":30000}-->
      (CỰC KỲ QUAN TRỌNG: KHI NGƯỜI DÙNG BẢO "TÔI ĐÃ TRẢ NỢ CHO...", BẮT BUỘC DÙNG THẺ settle_debt VỚI "direction":"i_owe_them" ĐỂ HỆ THỐNG GẠCH NỢ TRONG SỔ NỢ ĐỒNG THỜI GHI KHOẢN CHI TIÊU VÀO SỔ THU CHI!)
3. TẠO MÃ VIETQR NHẬN TIỀN (ví dụ: "Tạo QR cho Tuấn trả nợ"):
   <!--NAJIMEZ_ACTION:{"type":"open_qr","person":"Tuấn"}-->
4. XÓA GIAO DỊCH THU CHI (Sổ Thu Chi Cá Nhân):
   - Xóa một giao dịch: <!--NAJIMEZ_ACTION:{"type":"delete_transaction","note":"Ăn bún đậu"}-->
   - Xóa toàn bộ sổ thu chi: <!--NAJIMEZ_ACTION:{"type":"clear_all_transactions"}-->
5. VIỆC CẦN LÀM (TO-DO):
   - Đánh dấu hoàn thành: <!--NAJIMEZ_ACTION:{"type":"toggle_task","title":"nộp báo cáo"}-->
   - Xóa một việc: <!--NAJIMEZ_ACTION:{"type":"delete_task","title":"nộp báo cáo"}-->
   - Xóa toàn bộ việc cần làm: <!--NAJIMEZ_ACTION:{"type":"clear_all_tasks"}-->
6. GHI CHI TIÊU MỚI: <!--NAJIMEZ_ACTION:{"type":"expense","amount":50000,"category":"Ăn uống","note":"Cà phê"}-->
7. GHI THU NHẬP MỚI: <!--NAJIMEZ_ACTION:{"type":"income","amount":200000,"category":"Thu nhập","note":"Thưởng"}-->
8. GHI NỢ MỚI: <!--NAJIMEZ_ACTION:{"type":"debt","direction":"they_owe_me","person":"Huy","amount":100000,"note":"Vay tiền"}-->
9. THÊM VIỆC CẦN LÀM MỚI: <!--NAJIMEZ_ACTION:{"type":"task","title":"Họp nhóm","time":"14:00"}-->
10. THÊM SỰ KIỆN / LỊCH HỌC VÀO TIỆN ÍCH LỊCH & THỜI KHÓA BIỂU:
    a) Sự kiện 1 ngày đơn lẻ:
       <!--NAJIMEZ_ACTION:{"type":"calendar_event","title":"Học Tiếng Anh","date":"${todayKey}","time":"07:30","endTime":"09:15","category":"Học tập"}-->
    b) Sự kiện lặp lại hằng tuần (ví dụ Thứ 2 hằng tuần):
       <!--NAJIMEZ_ACTION:{"type":"calendar_event","title":"Học Tiếng Anh","date":"${todayKey}","time":"07:30","endTime":"09:15","category":"Học tập","repeat":"custom","repeatUnit":"week","repeatInterval":1}-->
    c) CỰC KỲ QUAN TRỌNG: TẠO LỊCH CHO NHIỀU NGÀY / NHIỀU THỨ TRONG TUẦN (Ví dụ: "Thứ 2, 4, 6", "Thứ 3 và Thứ 5", "Các ngày trong tuần"):
       XUẤT ĐÚNG 1 THẺ DUY NHẤT với "daysOfWeek": [1, 3, 5] (1: Thứ 2, 2: Thứ 3, 3: Thứ 4, 4: Thứ 5, 5: Thứ 6, 6: Thứ 7, 0: CN):
       <!--NAJIMEZ_ACTION:{"type":"calendar_event","title":"Học tiếng Anh","date":"${todayKey}","time":"07:30","endTime":"10:00","category":"Học tập","repeat":"custom","repeatUnit":"week","repeatInterval":1,"daysOfWeek":[1,3,5]}-->
       (Chỉ cần 1 thẻ duy nhất này, hệ thống sẽ tự động hiển thị vào tất cả các thứ tương ứng trong tuần trên Lịch và Thời Khóa Biểu. Tuyệt đối KHÔNG xuất nhiều thẻ trùng lặp!)
    d) KHI SỰ KIỆN LẶP LẠI CÓ HẠN KẾT THÚC (Ví dụ: "lặp lại mỗi tuần đến ngày 21/12 là hết", "đến hết tháng 12", "kết thúc vào ngày 21/12"):
       BẮT BUỘC TRUYỀN THÊM "repeatUntil": "YYYY-MM-DD" vào thẻ để hệ thống dừng lặp đúng hạn và KHÔNG tạo sự kiện vô hạn:
       <!--NAJIMEZ_ACTION:{"type":"calendar_event","title":"Học lập trình hướng đối tượng","date":"${todayKey}","time":"08:15","endTime":"11:15","category":"Học tập","repeat":"custom","repeatUnit":"week","repeatInterval":1,"daysOfWeek":[1,4],"repeatUntil":"2026-12-21"}-->
11. XÓA SỰ KIỆN KHỎI TIỆN ÍCH LỊCH & SỰ KIỆN:
    - Xóa một sự kiện: <!--NAJIMEZ_ACTION:{"type":"delete_calendar_event","title":"Học Tiếng Anh","date":"${todayKey}"}-->
    - Xóa toàn bộ sự kiện: <!--NAJIMEZ_ACTION:{"type":"clear_all_calendar_events"}-->
12. DỜI LỊCH / CHUYỂN NGÀY / SỬA THỜI GIAN LỊCH (Ví dụ: "thật ra là tháng 11", "chuyển sang ngày 25/11", "dời lịch sang ngày mai", "đổi giờ thi sang 14h"):
    BẠN BẮT BUỘC PHẢI DỜI LỊCH HOẶC XÓA LỊCH CŨ TRÁNH BỊ TỒN TẠI 2 LỊCH SONG SONG GÂY TRÙNG LẶP:
    - Cách 1 (Khuyên dùng): Dùng thẻ update_calendar_event để hệ thống tự chuyển từ ngày cũ sang ngày mới:
      <!--NAJIMEZ_ACTION:{"type":"update_calendar_event","title":"Thi Python","oldDate":"2026-10-25","date":"2026-11-25","time":"13:00","endTime":"15:00"}-->
    - Cách 2: Dùng thẻ calendar_event có kèm "oldDate":
      <!--NAJIMEZ_ACTION:{"type":"calendar_event","title":"Thi Python","oldDate":"2026-10-25","date":"2026-11-25","time":"13:00","endTime":"15:00","category":"Học tập"}-->
    - Cách 3: Xuất đồng thời cả 2 thẻ delete_calendar_event cho ngày cũ và calendar_event cho ngày mới.
    TUYỆT ĐỐI KHÔNG CHỈ TẠO LỊCH MỚI MÀ QUÊN XÓA NGÀY CŨ!

============================================================
QUY TẮC BẢO VỆ TÍNH TOÀN VẸN & ĐỐI CHIẾU XUNG ĐỘT LOGIC SỔ NỢ (CRITICAL LOGIC VALIDATION):
============================================================
Trước khi thực hiện hoặc phản hồi bất kỳ hành động nào liên quan đến SỔ NỢ, BẠN BẮT BUỘC PHẢI ĐỐI CHIẾU VỚI CƠ SỞ DỮ LIỆU ĐANG CÓ Ở MỤC [1. SỔ NỢ & ĐỐI TƯỢNG]:
1. NẾU người dùng bảo "X đã trả nợ", "X trả tiền", "thu nợ từ X", "X đã trả nợ cho tôi" (ví dụ: "khang đã trả nợ", "an trả nợ rồi"):
   - BẠN BẮT BUỘC PHẢI KIỂM TRA NGAY: X nằm trong danh sách nào?
   - NẾU X KHÔNG HỀ NỢ BẠN, mà ngược lại BẠN ĐANG NỢ X (X nằm trong danh sách [Tôi nợ họ] / "Bạn nợ họ"):
     => ĐÂY LÀ LỖI XUNG ĐỘT LOGIC NGHỊCH LÝ!
     => TUYỆT ĐỐI KHÔNG ĐƯỢC NÓI "DẠ NAJIMEZ ĐÃ GHI NHẬN" VÀ TUYỆT ĐỐI KHÔNG XUẤT THẺ <!--NAJIMEZ_ACTION-->!
     => NAJIMEZ BẮT BUỘC PHẢI LẬP TỨC LÊN TIẾNG NHẮC NHỞ & CẢNH BÁO CHO NGƯỜI DÙNG:
     "⚠️ Khoan đã bạn ơi! Najimez kiểm tra sổ nợ thấy một điểm bất hợp lý nè: Trong sổ nợ hiện tại, bạn đang nợ [Tên X] [Số tiền] chứ [Tên X] không hề nợ tiền bạn. Có phải ý bạn là bạn vừa 'Trả nợ cho [Tên X]' không? Hãy xác nhận lại để Najimez cập nhật chính xác nhé! ❤️"
2. NẾU người dùng bảo "Tôi đã trả nợ cho Y", "trả tiền cho Y":
   - BẠN PHẢI KIỂM TRA xem bạn có đang nợ Y không. Nếu bạn không nợ Y, mà ngược lại Y ĐANG NỢ BẠN (Y nằm trong [Họ nợ tôi]):
     => ĐÂY CŨNG LÀ LỖI XUNG ĐỘT LOGIC! TUYỆT ĐỐI KHÔNG TỰ ĐỘNG TẤT TOÁN SAI CHIỀU!
     => NAJIMEZ BẮT BUỘC PHẢI LẬP TỨC NHẮC NHỞ CẢNH BÁO:
     "⚠️ Khoan đã bạn ơi! Trong sổ nợ hiện tại, [Tên Y] đang nợ bạn [Số tiền] chứ bạn không hề nợ [Tên Y]. Có phải ý bạn là [Tên Y] đã trả nợ cho bạn không? Hãy xác nhận lại giúp Najimez nha! ❤️"

QUY TẮC CỐT LÕI:
- BẮT BUỘC THỰC THI THẺ ACTION KHI NGƯỜI DÙNG XÁC NHẬN (CONFIRMATION TRIGGER):
  Nếu ở câu trả lời trước, bạn đã hỏi xác nhận ("Bạn có chắc muốn xóa... không?"), và ở câu trả lời này người dùng đáp lại: "xoá luôn", "đồng ý", "xác nhận", "xóa đi", "ok", "ừ", "chắc chắn":
  BẠN BẮT BUỘC PHẢI THỰC HIỆN VÀ ĐÍNH KÈM THẺ HÀNH ĐỘNG TƯƠNG ỨNG NGAY LẬP TỨC!
  TUYỆT ĐỐI KHÔNG ĐƯỢC CHỈ CHAT LÀ "ĐÃ XÓA XONG" MÀ QUÊN KÈM THẺ HÀNH ĐỘNG <!--NAJIMEZ_ACTION:...-->!
- KHI NGƯỜI DÙNG HỎI VỀ LỊCH TRÌNH, NGÀY THÁNG, LỊCH HỌC HAY SỰ KIỆN (ví dụ "thế còn ngày 26 thì sao", "ngày 26 có lịch học mà", "hôm nay có gì", "ngày mai thế nào"):
  + BẠN BẮT BUỘC ĐỐI CHIẾU VỚI [0. THỜI GIAN HỆ THỐNG HIỆN TẠI] VÀ [4. TIỆN ÍCH LỊCH & SỰ KIỆN].
  + Nếu ngày đó có sự kiện hay lịch học, HÃY TRẢ LỜI ĐẦY ĐỦ, CHÍNH XÁC: Tên buổi học/sự kiện, thời gian, danh mục và ghi chú. Tuyệt đối không được nói ngày đó trống trải!
- KHI NGƯỜI DÙNG HỎI TRỰC TIẾP về dữ liệu sổ sách (như "ai nợ tôi nhiều nhất?", "tôi nợ ai?", "còn bao nhiêu tiền?", "hôm nay tiêu gì?"), bạn hãy trả lời ngay với tên và con số cụ thể trên.
- KHI NGƯỜI DÙNG NÓI CHUYỆN BÌNH THƯỜNG / CHÀO HỎI / TÂM SỰ / HỎI HỌC TẬP & CODE: Hãy đáp lại ngọt ngào, ấm áp, đúng chủ đề của người dùng; TUYỆT ĐỐI KHÔNG TỰ TIỆN LÔI SỔ NỢ, DANH SÁCH CON NỢ HAY SỐ DƯ TÀI CHÍNH RA BÁO CÁO!`;
}

async function callGeminiAPIStream(userPrompt, onChunk) {
  const apiKey = getStoredApiKey();
  if (!apiKey) return null;

  const modelInfo = await autoDetectAndTestModel(apiKey);
  const streamUrl = `https://generativelanguage.googleapis.com/${modelInfo.version}/models/${modelInfo.modelName}:streamGenerateContent?key=${apiKey}&alt=sse`;

  const payload = {
    contents: conversationHistory.concat([
      { role: 'user', parts: [{ text: userPrompt }] }
    ]),
    generationConfig: {
      temperature: 0.75,
      topP: 0.95,
      maxOutputTokens: 2048
    }
  };

  const dynamicSystemPrompt = buildDynamicSystemPrompt();

  if (modelInfo.version === 'v1beta') {
    payload.system_instruction = {
      parts: [{ text: dynamicSystemPrompt }]
    };
  } else {
    if (payload.contents.length > 0 && payload.contents[0].parts) {
      payload.contents[0].parts[0].text = `[CHỈ DẪN VAI DIỄN GEMINI: ${dynamicSystemPrompt}]\n\n` + payload.contents[0].parts[0].text;
    }
  }

  let fullText = '';
  let streamSucceeded = false;

  try {
    const res = await fetch(streamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok && res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6);
            if (jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const chunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (chunk) {
                fullText += chunk;
                onChunk(fullText);
              }
            } catch (e) { }
          }
        }
      }

      if (fullText.trim()) {
        streamSucceeded = true;
      }
    }
  } catch (streamErr) {
    console.warn('Lỗi streaming SSE, chuyển sang gọi non-streaming:', streamErr);
  }

  if (streamSucceeded && fullText.trim()) {
    conversationHistory.push({ role: 'user', parts: [{ text: userPrompt }] });
    conversationHistory.push({ role: 'model', parts: [{ text: fullText }] });
    if (conversationHistory.length > 10) conversationHistory = conversationHistory.slice(-10);
    return fullText;
  }

  return await callGeminiAPIFallback(userPrompt, modelInfo);
}

async function callGeminiAPIFallback(userPrompt, modelInfo = null) {
  const apiKey = getStoredApiKey();
  if (!apiKey) return null;

  const info = modelInfo || await autoDetectAndTestModel(apiKey);
  const url = `https://generativelanguage.googleapis.com/${info.version}/models/${info.modelName}:generateContent?key=${apiKey}`;

  const payload = {
    contents: conversationHistory.concat([
      { role: 'user', parts: [{ text: userPrompt }] }
    ]),
    generationConfig: {
      temperature: 0.75,
      maxOutputTokens: 2048
    }
  };

  const dynamicSystemPrompt = buildDynamicSystemPrompt();

  if (info.version === 'v1beta') {
    payload.system_instruction = { parts: [{ text: dynamicSystemPrompt }] };
  } else {
    if (payload.contents.length > 0 && payload.contents[0].parts) {
      payload.contents[0].parts[0].text = `[CHỈ DẪN VAI DIỄN GEMINI: ${dynamicSystemPrompt}]\n\n` + payload.contents[0].parts[0].text;
    }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      conversationHistory.push({ role: 'user', parts: [{ text: userPrompt }] });
      conversationHistory.push({ role: 'model', parts: [{ text: text }] });
      if (conversationHistory.length > 10) conversationHistory = conversationHistory.slice(-10);
      return text;
    }
  }

  const errJson = await res.json().catch(() => ({}));
  const errMsg = errJson.error?.message || `HTTP ${res.status}`;
  throw new Error(errMsg);
}

function renderMarkdown(text) {
  if (!text) return '';
  if (window.marked && typeof window.marked.parse === 'function') {
    return window.marked.parse(text);
  }
  let html = escapeHTML(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
  return `<p>${html}</p>`;
}

function attachCodeBlockEnhancements(container) {
  container.querySelectorAll('pre code').forEach((codeBlock) => {
    const pre = codeBlock.parentElement;
    if (pre.parentElement && pre.parentElement.classList.contains('code-block-wrapper')) {
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';

    let lang = 'CODE';
    const classes = codeBlock.className.split(' ');
    classes.forEach(c => {
      if (c.startsWith('language-')) lang = c.replace('language-', '').toUpperCase();
    });

    const header = document.createElement('div');
    header.className = 'code-block-header';
    header.innerHTML = `
      <span class="code-lang">${lang}</span>
      <button type="button" class="btn-copy-code">
        <i class="fa-regular fa-copy"></i> Sao chép mã
      </button>
    `;

    header.querySelector('.btn-copy-code').addEventListener('click', (e) => {
      const btn = e.currentTarget;
      navigator.clipboard.writeText(codeBlock.textContent).then(() => {
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Đã sao chép!';
        setTimeout(() => {
          btn.innerHTML = '<i class="fa-regular fa-copy"></i> Sao chép mã';
        }, 2000);
      });
    });

    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(header);
    wrapper.appendChild(pre);
  });
}

function updateTTSButtonState(btn, state) {
  if (!btn) return;
  btn.dataset.state = state;
  if (state === 'loading') {
    btn.classList.remove('speaking');
    btn.classList.add('loading');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Đang nạp...</span>';
    btn.title = 'Đang tải âm thanh, nhấn để hủy';
  } else if (state === 'speaking') {
    btn.classList.remove('loading');
    btn.classList.add('speaking');
    btn.innerHTML = '<span class="tts-wave-bar"><span></span><span></span><span></span></span> <i class="fa-solid fa-stop"></i> <span>Dừng</span>';
    btn.title = 'Đang đọc (Bấm vào đây hoặc nhấn Esc để dừng ngay)';
  } else {
    btn.classList.remove('speaking', 'loading');
    btn.innerHTML = '<i class="fa-solid fa-volume-high"></i> <span>Đọc</span>';
    btn.title = 'Đọc bằng giọng nói';
  }
}

function createMessageToolbar(textToCopy, onRegenerate) {
  const toolbar = document.createElement('div');
  toolbar.className = 'msg-toolbar';
  toolbar.innerHTML = `
    <button type="button" class="btn-msg-tool btn-copy" title="Sao chép nội dung">
      <i class="fa-regular fa-copy"></i>
      <span>Sao chép</span>
    </button>
    <button type="button" class="btn-msg-tool btn-tts" title="Đọc bằng giọng nói">
      <i class="fa-solid fa-volume-high"></i>
      <span>Đọc</span>
    </button>
    <button type="button" class="btn-msg-tool btn-regen" title="Tạo lại câu trả lời">
      <i class="fa-solid fa-rotate-right"></i>
      <span>Tạo lại</span>
    </button>
  `;

  const copyBtn = toolbar.querySelector('.btn-copy');
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> <span>Đã sao chép</span>';
      setTimeout(() => {
        copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> <span>Sao chép</span>';
      }, 2000);
    });
  });

  const ttsBtn = toolbar.querySelector('.btn-tts');
  let lastStopClickTime = 0;

  ttsBtn.addEventListener('click', (e) => {
    e.stopPropagation();

    // 1. Kiểm tra trạng thái đang bận: nếu hệ thống đang phát/đang nạp hoặc nút đang active
    const isBusy = (typeof isSpeakingAssistant === 'function' && isSpeakingAssistant()) 
      || ttsBtn.classList.contains('speaking') 
      || ttsBtn.classList.contains('loading')
      || ttsBtn.dataset.state === 'speaking'
      || ttsBtn.dataset.state === 'loading';

    // Nếu đang phát hoặc đang tải, bấm vào là DỪNG NGAY LẬP TỨC
    if (isBusy) {
      lastStopClickTime = Date.now();
      if (typeof stopSpeakingAssistant === 'function') stopSpeakingAssistant();
      updateTTSButtonState(ttsBtn, 'idle');
      return;
    }

    // Nếu vừa mới bấm dừng cách đây chưa tới 500ms, bỏ qua để chống double-click nhầm
    if (Date.now() - lastStopClickTime < 500) {
      return;
    }

    if (typeof speakAssistantText !== 'function') {
      if (typeof showAppToast === 'function') {
        showAppToast('Tính năng giọng đọc chưa sẵn sàng.', 'warning');
      }
      return;
    }

    // Tắt các nút đang phát khác (nếu có)
    if (typeof stopSpeakingAssistant === 'function') stopSpeakingAssistant();
    document.querySelectorAll('.btn-tts').forEach(btn => updateTTSButtonState(btn, 'idle'));

    updateTTSButtonState(ttsBtn, 'loading');

    speakAssistantText(
      textToCopy,
      () => {
        updateTTSButtonState(ttsBtn, 'speaking');
      },
      () => {
        updateTTSButtonState(ttsBtn, 'idle');
      },
      (err) => {
        updateTTSButtonState(ttsBtn, 'idle');
        if (typeof err === 'string' && err) {
          if (typeof showAppToast === 'function') showAppToast(err, 'warning');
        }
      }
    );
  });

  const regenBtn = toolbar.querySelector('.btn-regen');
  regenBtn.addEventListener('click', () => {
    if (typeof onRegenerate === 'function') onRegenerate();
  });

  return toolbar;
}

function parseAndExecuteActions(text) {
  const actionRegex = /<!--NAJIMEZ_ACTION:(\{[\s\S]*?\})-->/g;
  const cards = [];
  let match;
  const data = getLedgerData();

  while ((match = actionRegex.exec(text)) !== null) {
    try {
      const action = JSON.parse(match[1]);
      const cardEl = executeAction(action, data);
      if (cardEl) cards.push(cardEl);
    } catch (err) {
      console.warn('Lỗi parse NAJIMEZ_ACTION:', err);
    }
  }

  // Safety Net cho giải quyết / xung đột chiều sổ nợ nếu AI quên xuất thẻ action:
  if (cards.length === 0) {
    const userPromptClean = typeof lastUserPrompt === 'string' ? lastUserPrompt.toLowerCase().trim() : '';
    if (userPromptClean && /(?:đã\s+trả\s+nợ|trả\s+nợ|thanh\s+toán\s+nợ|tất\s+toán|thu\s+nợ)/i.test(userPromptClean)) {
      const mentionedDebt = (data.debts || []).find(d => d.person && matchPersonName(d.person, userPromptClean));
      if (mentionedDebt) {
        const pName = mentionedDebt.person;
        const theyOweMe = (data.debts || []).filter(d => d.status !== 'paid' && matchPersonName(d.person, pName) && d.direction === 'they_owe_me');
        const iOweThem = (data.debts || []).filter(d => d.status !== 'paid' && matchPersonName(d.person, pName) && d.direction === 'i_owe_them');
        const isIPaidThem = /(?:tôi|mình|em)\s+(?:đã\s+)?trả\s+nợ/i.test(userPromptClean);

        if (!isIPaidThem && theyOweMe.length === 0 && iOweThem.length > 0) {
          const cardEl = executeAction({ type: 'settle_debt', person: pName, direction: 'they_owe_me' }, data);
          if (cardEl) cards.push(cardEl);
        } else if (isIPaidThem && iOweThem.length === 0 && theyOweMe.length > 0) {
          const cardEl = executeAction({ type: 'settle_debt', person: pName, direction: 'i_owe_them' }, data);
          if (cardEl) cards.push(cardEl);
        }
      }
    }
  }

  saveLedgerData(data);
  let cleanText = text.replace(actionRegex, '').trim();

  // Kiểm tra xem có thẻ xung đột (conflict) hoặc thẻ cảnh báo (warning) không
  const conflictCard = cards.find(c => c && c.dataset && c.dataset.isConflict === 'true');
  const warningCard = cards.find(c => c && c.dataset && c.dataset.hasWarning === 'true');

  if (conflictCard && conflictCard.dataset.conflictMessage) {
    // KHI CÓ XUNG ĐỘT LOGIC: Najimez TRỰC TIẾP LÊN TIẾNG NHẮC NHỞ & CẢNH BÁO THAY VÌ NÓI CÂU CHÚC MỪNG HOẶC GHI NHẬN SAI LỆCH!
    cleanText = conflictCard.dataset.conflictMessage;
  } else if (warningCard && warningCard.dataset.warningMessage) {
    // KHI CÓ CẢNH BÁO NHẸ (như trùng giờ lịch, thâm hụt ví): Najimez NỐI THÊM LỜI NHẮC NHỞ ẤM ÁP
    cleanText += `\n\n${warningCard.dataset.warningMessage}`;
  }

  return { cleanText, cards };
}

function executeDebtSettlementDirectly(targetPerson, amt, direction, cardEl) {
  const data = getLedgerData();
  const isExpense = direction === 'i_owe_them';
  const matches = (data.debts || []).filter(d => d.status !== 'paid' && matchPersonName(d.person, targetPerson) && d.direction === direction);
  let settledTotal = 0;

  if (matches.length > 0) {
    if (amt > 0) {
      let remaining = amt;
      for (const d of matches) {
        if (remaining <= 0) break;
        const dAmt = Number(d.amount) || 0;
        if (dAmt <= remaining) {
          d.status = 'paid';
          d.settledAt = Date.now();
          settledTotal += dAmt;
          remaining -= dAmt;
        } else {
          d.amount = dAmt - remaining;
          settledTotal += remaining;
          data.debts.push({
            id: 'db-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8) + '-paid',
            direction: d.direction,
            person: d.person,
            amount: remaining,
            note: `${d.note || 'Khoản nợ'} (Đã trả một phần)`,
            status: 'paid',
            timestamp: d.timestamp,
            settledAt: Date.now()
          });
          remaining = 0;
        }
      }
      if (settledTotal === 0) settledTotal = amt;
    } else {
      matches.forEach(d => {
        d.status = 'paid';
        d.settledAt = Date.now();
        settledTotal += Number(d.amount) || 0;
      });
    }
  } else {
    settledTotal = amt || 50000;
    data.debts.unshift({
      id: 'db-' + Date.now(),
      direction: direction,
      person: targetPerson,
      amount: settledTotal,
      note: isExpense ? 'Trả nợ' : 'Thu nợ',
      status: 'paid',
      timestamp: Date.now(),
      settledAt: Date.now()
    });
  }

  if (settledTotal > 0) {
    data.transactions.unshift({
      id: 'tx-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      type: isExpense ? 'expense' : 'income',
      amount: settledTotal,
      category: isExpense ? 'Trả nợ' : 'Thu nợ',
      note: isExpense ? `Trả nợ cho ${targetPerson}` : `${targetPerson} trả nợ`,
      timestamp: Date.now()
    });
  }

  saveLedgerData(data);
  if (typeof renderDebtsUI === 'function') renderDebtsUI();
  if (typeof renderFinanceTab === 'function') renderFinanceTab();

  if (cardEl) {
    cardEl.style.border = '1px solid rgba(16, 185, 129, 0.4)';
    cardEl.style.background = 'rgba(16, 185, 129, 0.12)';
    cardEl.innerHTML = `
      <div class="action-card-left">
        <div class="action-card-icon" style="background: rgba(16, 185, 129, 0.2); color: #10b981;">
          <i class="fa-solid fa-circle-check"></i>
        </div>
        <div class="action-card-info">
          <div class="action-card-title" style="color: #10b981; font-weight: 600;">Đã xử lý thành công: ${escapeHTML(targetPerson)}</div>
          <div class="action-card-sub" style="color: #cbd5e1;">${isExpense ? 'Đã hoàn thành nghĩa vụ trả nợ &amp; ghi nhận vào chi tiêu' : 'Đã thu hồi nợ thành công &amp; cộng vào thu nhập'}</div>
        </div>
      </div>
      <div class="action-card-right">
        <span class="card-amount" style="color: #10b981;">${formatCurrency(settledTotal)}</span>
      </div>
    `;
  }

  const voiceFeedback = isExpense 
    ? `Dạ, Najimez đã cập nhật sổ nợ rồi nha! Ghi nhận bạn đã hoàn thành trả nợ ${formatCurrency(settledTotal)} cho ${targetPerson}.`
    : `Dạ, Najimez đã cập nhật thành công! Ghi nhận đã thu hồi ${formatCurrency(settledTotal)} từ ${targetPerson} vào sổ thu chi cho bạn rồi nhé! ❤️`;

  if (typeof speakAssistantText === 'function') {
    speakAssistantText(voiceFeedback);
  }
}

function executeAction(action, data) {
  const id = 'act-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

  // 1. Giao dịch thu / chi
  if (action.type === 'expense' || action.type === 'income') {
    const tx = {
      id,
      type: action.type,
      amount: Math.abs(Number(action.amount) || 0),
      category: action.category || (action.type === 'expense' ? 'Chi tiêu' : 'Thu nhập'),
      note: action.note || (action.type === 'expense' ? 'Khoản chi' : 'Khoản thu'),
      timestamp: Date.now()
    };
    data.transactions.unshift(tx);

    // Tự động đồng bộ gạch nợ trong Sổ Nợ nếu đây là giao dịch trả nợ hoặc thu nợ
    const isPayDebt = tx.type === 'expense' && (/(?:trả\s+nợ|thanh\s+toán\s+nợ)/i.test(tx.category || '') || /(?:trả\s+nợ|thanh\s+toán\s+nợ|trả\s+tiền\s+cho)/i.test(tx.note || ''));
    if (isPayDebt) {
      const matchDebts = (data.debts || []).filter(d => d.status !== 'paid' && d.direction === 'i_owe_them' && matchPersonName(tx.note, d.person));
      matchDebts.forEach(d => {
        d.status = 'paid';
        d.settledAt = Date.now();
      });
      if (typeof renderDebtsUI === 'function') renderDebtsUI();
    }
    const isRecDebt = tx.type === 'income' && (/(?:thu\s+nợ|thu\s+hồi\s+nợ)/i.test(tx.category || '') || /(?:trả\s+nợ|thu\s+nợ|thanh\s+toán)/i.test(tx.note || ''));
    if (isRecDebt) {
      const matchDebts = (data.debts || []).filter(d => d.status !== 'paid' && d.direction === 'they_owe_me' && matchPersonName(tx.note, d.person));
      matchDebts.forEach(d => {
        d.status = 'paid';
        d.settledAt = Date.now();
      });
      if (typeof renderDebtsUI === 'function') renderDebtsUI();
    }

    const card = document.createElement('div');
    const isExpense = tx.type === 'expense';
    card.className = `action-card ${isExpense ? 'finance-expense' : 'finance-income'}`;
    card.dataset.id = id;

    // CẢNH BÁO THÂM HỤT VÍ / SỐ DƯ ÂM
    const curBal = (data.transactions || []).reduce((acc, t) => acc + (t.type === 'income' ? (Number(t.amount) || 0) : -(Number(t.amount) || 0)), 0);
    if (isExpense && curBal < 0) {
      card.dataset.hasWarning = 'true';
      card.dataset.warningMessage = `⚠️ Nhắc nhở ví tiền: Sau khoản chi này, tổng số dư ví của bạn đang bị âm (${formatCurrency(curBal)}) rồi nè! Bạn nhớ cân đối lại chi tiêu nha! ❤️`;
    }

    card.innerHTML = `
      <div class="action-card-left">
        <div class="action-card-icon">
          <i class="fa-solid ${isExpense ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
        </div>
        <div class="action-card-info">
          <div class="action-card-title">
            <span>${escapeHTML(tx.note)}</span>
            <span class="card-category-badge">${escapeHTML(tx.category)}</span>
          </div>
          <div class="action-card-sub">${isExpense ? 'Đã ghi sổ chi tiêu' : 'Đã cộng vào thu nhập'}</div>
        </div>
      </div>
      <div class="action-card-right">
        <span class="card-amount">${isExpense ? '-' : '+'}${formatCurrency(tx.amount)}</span>
        <button type="button" class="btn-card-action undo" title="Hủy bỏ giao dịch này">
          <i class="fa-solid fa-rotate-left"></i>
        </button>
      </div>
    `;

    card.querySelector('.undo').addEventListener('click', () => {
      removeTransaction(id, card);
    });
    return card;
  }

  // 2. Thanh toán / Tất toán nợ (settle_debt)
  const isDebtSettlement = action.type === 'settle_debt' ||
    (action.type === 'debt' && /(?:đã\s+trả|trả\s+nợ|thanh\s+toán|tất\s+toán)/i.test(action.note || ''));

  if (isDebtSettlement) {
    const targetPerson = (action.person || 'Người quen').trim();
    const actionAmount = Math.abs(Number(action.amount) || 0);
    const actionDir = action.direction; // 'they_owe_me' (họ trả mình) hoặc 'i_owe_them' (mình trả họ)

    // Phân loại công nợ của người này theo chiều
    const theyOweMeDebts = data.debts.filter(d => d.status !== 'paid' && matchPersonName(d.person, targetPerson) && d.direction === 'they_owe_me');
    const iOweThemDebts = data.debts.filter(d => d.status !== 'paid' && matchPersonName(d.person, targetPerson) && d.direction === 'i_owe_them');

    // BẢO VỆ XUNG ĐỘT LOGIC 1: Người dùng bảo "X đã trả nợ cho tôi" (they_owe_me), nhưng thực tế mình đang nợ X (i_owe_them)
    if (actionDir === 'they_owe_me' && theyOweMeDebts.length === 0 && iOweThemDebts.length > 0) {
      const amt = iOweThemDebts.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
      const card = document.createElement('div');
      card.className = 'action-card conflict-card';
      card.dataset.isConflict = 'true';
      const warnMsg = `⚠️ Khoan đã bạn ơi! Najimez kiểm tra sổ nợ thấy một điểm bất hợp lý nè:\nTrong sổ nợ hiện tại, bạn đang nợ ${targetPerson} ${formatCurrency(amt)}, chứ ${targetPerson} không hề nợ bạn.\nCó phải ý bạn là: "Tôi đã trả nợ cho ${targetPerson}" không ạ? Najimez đã tạm chặn thao tác gạch nợ sai chiều này để bảo vệ dữ liệu cho bạn nhé! Bạn có thể bấm nút xác nhận bên dưới nếu thực sự đã trả nợ nha. ❤️`;
      card.dataset.conflictMessage = warnMsg;
      card.style.border = '1px solid rgba(245, 158, 11, 0.5)';
      card.style.background = 'rgba(245, 158, 11, 0.12)';
      card.innerHTML = `
        <div class="action-card-left">
          <div class="action-card-icon" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b;">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div class="action-card-info">
            <div class="action-card-title" style="color: #f59e0b; font-weight: 600;">⚠️ Xung đột logic: Bạn đang nợ ${escapeHTML(targetPerson)}!</div>
            <div class="action-card-sub" style="color: #cbd5e1; margin-top: 4px;">Trong sổ nợ bạn đang nợ ${escapeHTML(targetPerson)} ${formatCurrency(amt)}, chứ ${escapeHTML(targetPerson)} không hề nợ bạn. Hệ thống đã chặn gạch nợ sai chiều để bảo vệ số dư của bạn.</div>
            <div style="margin-top: 8px;">
              <button type="button" class="btn-quick-resolve-debt" style="background: rgba(245, 158, 11, 0.25); border: 1px solid #f59e0b; color: #fbbf24; border-radius: 6px; padding: 5px 12px; font-size: 12px; cursor: pointer; transition: all 0.2s; font-weight: 500;">
                <i class="fa-solid fa-check" style="margin-right: 5px;"></i>Xác nhận: Tôi đã trả ${formatCurrency(amt)} cho ${escapeHTML(targetPerson)}
              </button>
            </div>
          </div>
        </div>
      `;
      const btnResolve = card.querySelector('.btn-quick-resolve-debt');
      if (btnResolve) {
        btnResolve.addEventListener('click', () => {
          btnResolve.disabled = true;
          btnResolve.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang cập nhật...';
          executeDebtSettlementDirectly(targetPerson, amt, 'i_owe_them', card);
        });
      }
      return card;
    }

    // BẢO VỆ XUNG ĐỘT LOGIC 2: Người dùng bảo "Tôi đã trả nợ cho Y" (i_owe_them), nhưng thực tế Y đang nợ mình (they_owe_me)
    if (actionDir === 'i_owe_them' && iOweThemDebts.length === 0 && theyOweMeDebts.length > 0) {
      const amt = theyOweMeDebts.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
      const card = document.createElement('div');
      card.className = 'action-card conflict-card';
      card.dataset.isConflict = 'true';
      const warnMsg = `⚠️ Khoan đã bạn ơi! Najimez kiểm tra sổ nợ thấy một điểm bất hợp lý nè:\nTrong sổ nợ hiện tại, ${targetPerson} đang nợ bạn ${formatCurrency(amt)}, chứ bạn không hề nợ ${targetPerson}.\nCó phải ý bạn là: "${targetPerson} đã trả nợ cho tôi" không ạ? Najimez đã tạm chặn thao tác gạch nợ sai chiều này để bảo vệ dữ liệu cho bạn nhé! Bạn có thể bấm nút xác nhận bên dưới nếu đối phương đã trả tiền nha. ❤️`;
      card.dataset.conflictMessage = warnMsg;
      card.style.border = '1px solid rgba(245, 158, 11, 0.5)';
      card.style.background = 'rgba(245, 158, 11, 0.12)';
      card.innerHTML = `
        <div class="action-card-left">
          <div class="action-card-icon" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b;">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div class="action-card-info">
            <div class="action-card-title" style="color: #f59e0b; font-weight: 600;">⚠️ Xung đột logic: ${escapeHTML(targetPerson)} đang nợ bạn!</div>
            <div class="action-card-sub" style="color: #cbd5e1; margin-top: 4px;">Trong sổ nợ ${escapeHTML(targetPerson)} đang nợ bạn ${formatCurrency(amt)}, chứ bạn không nợ ${escapeHTML(targetPerson)}. Hệ thống đã chặn gạch nợ sai chiều để bảo vệ số dư của bạn.</div>
            <div style="margin-top: 8px;">
              <button type="button" class="btn-quick-resolve-debt" style="background: rgba(245, 158, 11, 0.25); border: 1px solid #f59e0b; color: #fbbf24; border-radius: 6px; padding: 5px 12px; font-size: 12px; cursor: pointer; transition: all 0.2s; font-weight: 500;">
                <i class="fa-solid fa-check" style="margin-right: 5px;"></i>Xác nhận: ${escapeHTML(targetPerson)} đã trả ${formatCurrency(amt)} cho tôi
              </button>
            </div>
          </div>
        </div>
      `;
      const btnResolve = card.querySelector('.btn-quick-resolve-debt');
      if (btnResolve) {
        btnResolve.addEventListener('click', () => {
          btnResolve.disabled = true;
          btnResolve.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang cập nhật...';
          executeDebtSettlementDirectly(targetPerson, amt, 'they_owe_me', card);
        });
      }
      return card;
    }

    let matches = actionDir ? (actionDir === 'they_owe_me' ? theyOweMeDebts : iOweThemDebts) : (theyOweMeDebts.concat(iOweThemDebts));
    let settledTotal = 0;
    let settleDir = actionDir || (matches[0] ? matches[0].direction : 'i_owe_them');

    if (matches.length > 0) {
      if (actionAmount > 0) {
        let remaining = actionAmount;
        for (const d of matches) {
          if (remaining <= 0) break;
          const dAmt = Number(d.amount) || 0;
          if (dAmt <= remaining) {
            d.status = 'paid';
            d.settledAt = Date.now();
            settledTotal += dAmt;
            remaining -= dAmt;
          } else {
            d.amount = dAmt - remaining;
            settledTotal += remaining;
            data.debts.push({
              id: 'db-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8) + '-paid',
              direction: d.direction,
              person: d.person,
              amount: remaining,
              note: `${d.note || 'Khoản nợ'} (Đã trả một phần)`,
              status: 'paid',
              timestamp: d.timestamp,
              settledAt: Date.now()
            });
            remaining = 0;
          }
        }
        if (settledTotal === 0) settledTotal = actionAmount;
      } else {
        matches.forEach(d => {
          d.status = 'paid';
          d.settledAt = Date.now();
          settledTotal += Number(d.amount) || 0;
        });
      }
    } else {
      settledTotal = actionAmount || 50000;
      data.debts.unshift({
        id: 'db-' + Date.now(),
        direction: actionDir || 'i_owe_them',
        person: targetPerson,
        amount: settledTotal,
        note: action.note || 'Thanh toán nợ',
        status: 'paid',
        timestamp: Date.now(),
        settledAt: Date.now()
      });
    }

    if (settledTotal > 0) {
      const isExpense = settleDir === 'i_owe_them';
      data.transactions.unshift({
        id: 'tx-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        type: isExpense ? 'expense' : 'income',
        amount: settledTotal,
        category: isExpense ? 'Trả nợ' : 'Thu nợ',
        note: isExpense ? `Trả nợ cho ${targetPerson}` : `${targetPerson} trả nợ`,
        timestamp: Date.now()
      });
    }

    const card = document.createElement('div');
    card.className = 'action-card settle-card';
    card.dataset.id = id;
    const isExpense = settleDir === 'i_owe_them';
    card.innerHTML = `
      <div class="action-card-left">
        <div class="action-card-icon">
          <i class="fa-solid fa-circle-check"></i>
        </div>
        <div class="action-card-info">
          <div class="action-card-title">
            <span>${escapeHTML(targetPerson)}</span>
            <span class="card-category-badge settle-badge">Đã tất toán</span>
          </div>
          <div class="action-card-sub">${isExpense ? 'Đã hoàn thành nghĩa vụ trả nợ &amp; trừ vào sổ thu chi' : 'Đã thu hồi nợ thành công &amp; cộng vào thu nhập'}</div>
        </div>
      </div>
      <div class="action-card-right">
        <span class="card-amount">${formatCurrency(settledTotal)}</span>
      </div>
    `;
    return card;
  }

  // 3. Sổ nợ mới
  if (action.type === 'debt') {
    const debt = {
      id,
      direction: action.direction || 'they_owe_me',
      person: action.person || 'Người quen',
      amount: Math.abs(Number(action.amount) || 0),
      note: action.note || 'Khoản nợ',
      status: 'pending',
      timestamp: Date.now()
    };
    data.debts.unshift(debt);

    // Tự động ghi nhận vào Sổ Thu Chi Cá Nhân
    const isTheyOwe = debt.direction === 'they_owe_me';
    data.transactions.unshift({
      id: 'tx-debt-' + debt.id,
      debtId: debt.id,
      type: isTheyOwe ? 'expense' : 'income',
      amount: debt.amount,
      category: isTheyOwe ? 'Cho mượn' : 'Vay mượn',
      note: isTheyOwe ? `Cho ${debt.person} mượn tiền: ${debt.note || 'Khoản vay'}` : `Vay tiền từ ${debt.person}: ${debt.note || 'Khoản vay'}`,
      timestamp: debt.timestamp
    });
    const card = document.createElement('div');
    card.className = 'action-card debt-card';
    card.dataset.id = id;
    card.innerHTML = `
      <div class="action-card-left">
        <div class="action-card-icon">
          <i class="fa-solid fa-hand-holding-dollar"></i>
        </div>
        <div class="action-card-info">
          <div class="action-card-title">
            <span>${escapeHTML(debt.person)}</span>
            <span class="card-category-badge">${isTheyOwe ? 'Nợ bạn' : 'Bạn nợ'}</span>
          </div>
          <div class="action-card-sub">${escapeHTML(debt.note)}</div>
        </div>
      </div>
      <div class="action-card-right">
        <span class="card-amount">${formatCurrency(debt.amount)}</span>
        ${isTheyOwe ? `
          <button type="button" class="btn-card-action qr" title="Tạo mã VietQR nhận tiền chuyển khoản">
            <i class="fa-solid fa-qrcode"></i> VietQR
          </button>
        ` : ''}
      </div>
    `;

    const qrBtn = card.querySelector('.qr');
    if (qrBtn) {
      qrBtn.addEventListener('click', () => {
        if (typeof openVietQrModal === 'function') openVietQrModal(debt);
      });
    }
    return card;
  }

  // 4. Việc cần làm (To-Do / Task)
  if (action.type === 'task') {
    const task = {
      id,
      title: action.title || 'Công việc mới',
      time: action.time || 'Hôm nay',
      done: false,
      timestamp: Date.now()
    };
    data.tasks.unshift(task);

    const card = document.createElement('div');
    card.className = 'action-card task-card';
    card.dataset.id = id;
    card.innerHTML = `
      <div class="action-card-left">
        <button type="button" class="btn-task-check" title="Đánh dấu hoàn thành">
          <i class="fa-solid fa-check"></i>
        </button>
        <div class="action-card-info">
          <div class="action-card-title">${escapeHTML(task.title)}</div>
          <div class="action-card-sub"><i class="fa-regular fa-clock"></i> ${escapeHTML(task.time)}</div>
        </div>
      </div>
      <div class="action-card-right">
        <span class="card-category-badge">Việc cần làm</span>
      </div>
    `;

    const checkBtn = card.querySelector('.btn-task-check');
    checkBtn.addEventListener('click', () => {
      toggleTask(id, card);
    });
    return card;
  }

  // 5a. Xóa toàn bộ sổ nợ / Xóa sạch lịch sử giao dịch sổ nợ (Bắt buộc xác nhận qua showAppConfirm)
  if (action.type === 'clear_all_debts' || action.type === 'clear_debt_history' || action.type === 'delete_all_debts' || (action.type === 'delete_debt' && (!action.person || action.person.toLowerCase() === 'all'))) {
    const totalCount = Array.isArray(data.debts) ? data.debts.length : 0;
    const card = document.createElement('div');
    card.className = 'action-card settle-card';
    card.dataset.id = id;
    card.innerHTML = `
      <div class="action-card-left">
        <div class="action-card-icon" style="background: rgba(244, 63, 94, 0.16); color: #fb7185;">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
        <div class="action-card-info">
          <div class="action-card-title">
            <span>Xóa sạch toàn bộ sổ nợ</span>
            <span class="card-category-badge" style="background: rgba(244, 63, 94, 0.2); color: #fb7185;">Cần xác nhận</span>
          </div>
          <div class="action-card-sub">Hiện có ${totalCount} bản ghi nợ. Bấm nút để mở xác nhận xóa.</div>
        </div>
      </div>
      <button type="button" class="btn-sub-apply btn-confirm-clear-debts" style="background: #e11d48; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">Xác nhận xóa</button>
    `;

    const btnConfirm = card.querySelector('.btn-confirm-clear-debts');
    if (btnConfirm) {
      btnConfirm.addEventListener('click', async (e) => {
        e.stopPropagation();
        const confirmed = typeof showAppConfirm === 'function'
          ? await showAppConfirm(`Bạn có chắc chắn muốn xóa TOÀN BỘ dữ liệu sổ nợ (${totalCount} bản ghi)? Toàn bộ giao dịch trong Sổ Thu Chi Cá Nhân vẫn sẽ được bảo toàn nguyên vẹn.`, {
              title: 'Xóa toàn bộ sổ nợ',
              btnText: 'Xác nhận xóa sạch',
              btnIcon: 'fa-solid fa-trash-can'
            })
          : confirm(`Bạn có chắc chắn muốn xóa TOÀN BỘ dữ liệu sổ nợ không?`);

        if (confirmed) {
          const curData = getLedgerData();
          curData.debts = [];
          curData.contacts = {};
          saveLedgerData(curData);
          if (typeof renderDebtsUI === 'function') renderDebtsUI();
          btnConfirm.remove();
          const badge = card.querySelector('.card-category-badge');
          if (badge) {
            badge.textContent = 'Đã xóa sạch';
            badge.style.background = 'rgba(16, 185, 129, 0.2)';
            badge.style.color = '#34d399';
          }
          const sub = card.querySelector('.action-card-sub');
          if (sub) sub.textContent = `Đã xóa sạch ${totalCount} giao dịch sổ nợ.`;
          if (typeof showCustomToast === 'function') {
            showCustomToast('🗑️ Đã xóa sạch toàn bộ sổ nợ thành công!');
          }
        }
      });
    }
    return card;
  }

  // 5b. Xóa từng giao dịch nợ cụ thể trong lịch sử nợ (delete_debt_transaction / delete_debt_item)
  if (action.type === 'delete_debt_transaction' || action.type === 'delete_debt_item') {
    const targetPerson = (action.person || '').toLowerCase().trim();
    const note = (action.note || '').toLowerCase().trim();
    const idToDel = action.id;
    let deletedItem = null;

    data.debts = (data.debts || []).filter(d => {
      if (idToDel && d.id === idToDel) {
        deletedItem = d;
        return false;
      }
      const matchPerson = !targetPerson || matchPersonName(d.person, targetPerson);
      const matchNote = !note || (d.note || '').toLowerCase().includes(note);
      if (note && targetPerson) {
        if (matchPerson && matchNote) {
          deletedItem = d;
          return false;
        }
        return true;
      }
      if (note) {
        if (matchNote) {
          deletedItem = d;
          return false;
        }
        return true;
      }
      return true;
    });

    if (typeof renderDebtsUI === 'function') renderDebtsUI();

    const card = document.createElement('div');
    card.className = 'action-card settle-card';
    card.dataset.id = id;
    const itemLabel = deletedItem ? `${deletedItem.person} (${deletedItem.note || 'Khoản nợ'})` : (action.note || action.person || 'Giao dịch nợ');
    card.innerHTML = `
      <div class="action-card-left">
        <div class="action-card-icon" style="background: rgba(244, 63, 94, 0.16); color: #fb7185;">
          <i class="fa-solid fa-trash-can"></i>
        </div>
        <div class="action-card-info">
          <div class="action-card-title">
            <span>${escapeHTML(itemLabel)}</span>
            <span class="card-category-badge" style="background: rgba(244, 63, 94, 0.2); color: #fb7185;">Đã xóa giao dịch</span>
          </div>
          <div class="action-card-sub">Đã xóa khỏi sổ nợ (vẫn bảo toàn giao dịch Sổ Thu Chi)</div>
        </div>
      </div>
    `;
    return card;
  }

  // 5c. Xóa nợ của một người (delete_debt)
  if (action.type === 'delete_debt') {
    const targetPerson = (action.person || '').trim();
    if (targetPerson) {
      data.debts = (data.debts || []).filter(d => !matchPersonName(d.person, targetPerson));
      if (data.contacts) {
        delete data.contacts[targetPerson.toLowerCase().trim()];
      }
      if (typeof renderDebtsUI === 'function') renderDebtsUI();

      const card = document.createElement('div');
      card.className = 'action-card settle-card';
      card.dataset.id = id;
      card.innerHTML = `
        <div class="action-card-left">
          <div class="action-card-icon" style="background: rgba(244, 63, 94, 0.16); color: #fb7185;">
            <i class="fa-solid fa-trash-can"></i>
          </div>
          <div class="action-card-info">
            <div class="action-card-title">
              <span>${escapeHTML(targetPerson)}</span>
              <span class="card-category-badge" style="background: rgba(244, 63, 94, 0.2); color: #fb7185;">Đã xóa sổ nợ</span>
            </div>
            <div class="action-card-sub">Đã xóa khỏi sổ nợ (vẫn lưu giữ các khoản trong Sổ Thu Chi)</div>
          </div>
        </div>
      `;
      return card;
    }
  }

  // 6. Tạo mã VietQR cho một người (open_qr)
  if (action.type === 'open_qr') {
    const targetPerson = (action.person || '').trim();
    const contactDebt = data.debts.find(d => matchPersonName(d.person, targetPerson) && d.direction === 'they_owe_me' && d.status !== 'paid') ||
      data.debts.find(d => matchPersonName(d.person, targetPerson));

    const qrDebtObj = {
      person: targetPerson,
      amount: contactDebt ? (Number(contactDebt.amount) || 50000) : 50000,
      direction: 'they_owe_me',
      note: `${targetPerson} tra no`
    };

    setTimeout(() => {
      if (typeof openVietQrModal === 'function') openVietQrModal(qrDebtObj);
    }, 400);

    const card = document.createElement('div');
    card.className = 'action-card debt-card';
    card.dataset.id = id;
    card.innerHTML = `
      <div class="action-card-left">
        <div class="action-card-icon" style="background: rgba(56, 189, 248, 0.16); color: #38bdf8;">
          <i class="fa-solid fa-qrcode"></i>
        </div>
        <div class="action-card-info">
          <div class="action-card-title">
            <span>Mã VietQR - ${escapeHTML(targetPerson)}</span>
            <span class="card-category-badge" style="background: rgba(56, 189, 248, 0.2); color: #38bdf8;">Đã mở VietQR</span>
          </div>
          <div class="action-card-sub">Số tiền: ${formatCurrency(qrDebtObj.amount)}</div>
        </div>
      </div>
      <div class="action-card-right">
        <button type="button" class="btn-card-action qr" title="Mở lại VietQR">
          <i class="fa-solid fa-qrcode"></i> Xem QR
        </button>
      </div>
    `;
    const btn = card.querySelector('.qr');
    if (btn) {
      btn.addEventListener('click', () => {
        if (typeof openVietQrModal === 'function') openVietQrModal(qrDebtObj);
      });
    }
    return card;
  }

  // 7a. Xóa toàn bộ lịch sử sổ thu chi (clear_all_transactions)
  if (action.type === 'clear_all_transactions' || action.type === 'delete_all_transactions') {
    const totalDeleted = Array.isArray(data.transactions) ? data.transactions.length : 0;
    data.transactions = [];
    if (typeof renderTransactionsUI === 'function') renderTransactionsUI();
    if (typeof updateBalanceUI === 'function') updateBalanceUI();
    const card = document.createElement('div');
    card.className = 'action-card';
    card.innerHTML = `
      <div class="action-card-left">
        <div class="action-card-icon" style="color: #fb7185;"><i class="fa-solid fa-trash-can"></i></div>
        <div class="action-card-info">
          <div class="action-card-title">Đã xóa toàn bộ lịch sử thu chi</div>
          <div class="action-card-sub">Đã dọn sạch ${totalDeleted} giao dịch thu chi</div>
        </div>
      </div>
    `;
    return card;
  }

  // 7b. Xóa một giao dịch thu chi (delete_transaction)
  if (action.type === 'delete_transaction') {
    const note = (action.note || '').toLowerCase().trim();
    const idToDel = action.id;
    const initialLen = data.transactions.length;
    data.transactions = data.transactions.filter(t => {
      if (idToDel && t.id === idToDel) return false;
      if (note && (t.note || '').toLowerCase().includes(note)) return false;
      return true;
    });

    if (data.transactions.length < initialLen) {
      if (typeof renderTransactionsUI === 'function') renderTransactionsUI();
      if (typeof updateBalanceUI === 'function') updateBalanceUI();
      const card = document.createElement('div');
      card.className = 'action-card';
      card.innerHTML = `
        <div class="action-card-left">
          <div class="action-card-icon" style="color: #fb7185;"><i class="fa-solid fa-trash-can"></i></div>
          <div class="action-card-info">
            <div class="action-card-title">Đã xóa giao dịch: ${escapeHTML(action.note || 'Chi tiêu')}</div>
            <div class="action-card-sub">Đã cập nhật lại số dư sổ thu chi</div>
          </div>
        </div>
      `;
      return card;
    }
  }

  // 8a. Xóa toàn bộ việc cần làm (clear_all_tasks)
  if (action.type === 'clear_all_tasks' || action.type === 'delete_all_tasks') {
    const totalDeleted = Array.isArray(data.tasks) ? data.tasks.length : 0;
    data.tasks = [];
    if (typeof renderTasksUI === 'function') renderTasksUI();
    const card = document.createElement('div');
    card.className = 'action-card task-card';
    card.innerHTML = `
      <div class="action-card-left">
        <div class="action-card-icon" style="color: #fb7185;"><i class="fa-solid fa-trash-can"></i></div>
        <div class="action-card-info">
          <div class="action-card-title">Đã xóa toàn bộ việc cần làm</div>
          <div class="action-card-sub">Đã dọn sạch ${totalDeleted} công việc trong danh sách</div>
        </div>
      </div>
    `;
    return card;
  }

  // 8b. Xóa một việc cần làm (delete_task)
  if (action.type === 'delete_task') {
    const title = (action.title || '').toLowerCase().trim();
    const idToDel = action.id;
    const initialLen = Array.isArray(data.tasks) ? data.tasks.length : 0;
    data.tasks = (data.tasks || []).filter(t => {
      if (idToDel && t.id === idToDel) return false;
      if (title && (t.title || '').toLowerCase().includes(title)) return false;
      return true;
    });
    if (data.tasks.length < initialLen) {
      if (typeof renderTasksUI === 'function') renderTasksUI();
      const card = document.createElement('div');
      card.className = 'action-card task-card';
      card.innerHTML = `
        <div class="action-card-left">
          <div class="action-card-icon" style="color: #fb7185;"><i class="fa-solid fa-trash-can"></i></div>
          <div class="action-card-info">
            <div class="action-card-title">Đã xóa việc: ${escapeHTML(action.title || 'Công việc')}</div>
            <div class="action-card-sub">Đã cập nhật danh sách việc cần làm</div>
          </div>
        </div>
      `;
      return card;
    }
  }

  // 8c. Hoàn thành công việc to-do (toggle_task / complete_task)
  if (action.type === 'toggle_task' || action.type === 'complete_task') {
    const title = (action.title || '').toLowerCase().trim();
    const t = data.tasks.find(x => (x.title || '').toLowerCase().includes(title));
    if (t) {
      t.done = true;
      if (typeof renderTasksUI === 'function') renderTasksUI();
      const card = document.createElement('div');
      card.className = 'action-card task-card';
      card.innerHTML = `
        <div class="action-card-left">
          <div class="action-card-icon" style="color: #34d399;"><i class="fa-solid fa-check-double"></i></div>
          <div class="action-card-info">
            <div class="action-card-title">${escapeHTML(t.title)}</div>
            <div class="action-card-sub">Đã đánh dấu hoàn thành công việc!</div>
          </div>
        </div>
      `;
      return card;
    }
  }

  // 9. Thêm sự kiện / Lịch học vào Tiện ích Lịch & Sự Kiện (calendar_event / event)
  if (action.type === 'calendar_event' || action.type === 'event') {
    if (!Array.isArray(data.calendarEvents)) data.calendarEvents = [];
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const baseDateStr = action.date || todayStr;

    // Chuẩn hóa danh sách thứ trong tuần daysOfWeek nếu có
    let normDaysOfWeek = null;
    const rawDays = action.daysOfWeek || action.repeatDays;
    if (Array.isArray(rawDays) && rawDays.length > 0) {
      normDaysOfWeek = rawDays.map(d => {
        if (typeof d === 'number') return d;
        const s = String(d).toLowerCase().trim();
        if (s.includes('cn') || s.includes('chủ nhật') || s === '0') return 0;
        if (s.includes('t2') || s.includes('thứ 2') || s.includes('thứ hai') || s === '1') return 1;
        if (s.includes('t3') || s.includes('thứ 3') || s.includes('thứ ba') || s === '2') return 2;
        if (s.includes('t4') || s.includes('thứ 4') || s.includes('thứ tư') || s === '3') return 3;
        if (s.includes('t5') || s.includes('thứ 5') || s.includes('thứ năm') || s === '4') return 4;
        if (s.includes('t6') || s.includes('thứ 6') || s.includes('thứ sáu') || s === '5') return 5;
        if (s.includes('t7') || s.includes('thứ 7') || s.includes('thứ bảy') || s === '6') return 6;
        return null;
      }).filter(x => x !== null);
    }

    // Danh sách các ngày cần tạo
    const targetDates = [];
    if (normDaysOfWeek && normDaysOfWeek.length > 0) {
      // Khi có danh sách thứ trong tuần (ví dụ Thứ 2, 4, 6), ĐÂY LÀ 1 SỰ KIỆN LẶP LẠI DUY NHẤT.
      // Chỉ tạo ĐÚNG 1 SỰ KIỆN DUY NHẤT với daysOfWeek: normDaysOfWeek.
      // isEventOccurringOnDate sẽ tự động hiển thị sự kiện này vào tất cả các thứ tương ứng!
      const [bY, bM, bD] = baseDateStr.split('-').map(Number);
      const refDate = new Date(bY, bM - 1, bD);
      const day = refDate.getDay();
      const diff = refDate.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(refDate.setDate(diff));
      monday.setHours(0, 0, 0, 0);

      const dayOffsetMap = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 };
      const sortedOffsets = normDaysOfWeek
        .map(dNum => dayOffsetMap[dNum])
        .filter(x => x !== undefined)
        .sort((a, b) => a - b);

      const firstOffset = sortedOffsets.length > 0 ? sortedOffsets[0] : 0;
      const startDt = new Date(monday);
      startDt.setDate(monday.getDate() + firstOffset);
      const startDateStr = `${startDt.getFullYear()}-${String(startDt.getMonth() + 1).padStart(2, '0')}-${String(startDt.getDate()).padStart(2, '0')}`;

      const finalStart = baseDateStr < startDateStr ? baseDateStr : startDateStr;
      targetDates.push(finalStart);
    } else if (Array.isArray(action.dates) && action.dates.length > 0) {
      action.dates.forEach(d => {
        if (d && !targetDates.includes(d)) targetDates.push(d);
      });
    }

    if (targetDates.length === 0) {
      targetDates.push(baseDateStr);
    }

    const isRecurring = Boolean(action.repeat && action.repeat !== 'none') || Boolean(normDaysOfWeek);
    const repUnit = action.repeatUnit || (normDaysOfWeek ? 'week' : (action.repeat === 'weekly' ? 'week' : ''));
    const repMode = action.repeat || (isRecurring ? 'custom' : 'none');
    const repInterval = Math.max(1, parseInt(action.repeatInterval, 10) || 1);

    // Xác định hạn lặp lại repeatUntil (nếu có)
    let effectiveRepeatUntil = action.repeatUntil || action.repeatEnd || action.until || '';
    if (!effectiveRepeatUntil && action.endDate && action.endDate > baseDateStr && isRecurring) {
      effectiveRepeatUntil = action.endDate;
    }
    if (!effectiveRepeatUntil && isRecurring && typeof lastUserPrompt === 'string') {
      const untilMatch = lastUserPrompt.match(/(?:đến|hết|kết\s+thúc\s+vào)\s+(?:ngày\s+)?(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{4}))?/i);
      if (untilMatch) {
        const uD = String(untilMatch[1]).padStart(2, '0');
        const uM = String(untilMatch[2]).padStart(2, '0');
        const defaultYear = baseDateStr.split('-')[0] || String(new Date().getFullYear());
        const uY = untilMatch[3] || defaultYear;
        effectiveRepeatUntil = `${uY}-${uM}-${uD}`;
      }
    }

    const eventColor = action.color || ((typeof suggestColorForEvent === 'function') 
      ? suggestColorForEvent(action.title, action.category) 
      : '#6366f1');

    const createdIds = [];
    const normActionTitle = (action.title || 'Sự kiện mới').trim().toLowerCase();
    const normActionTime = (action.time || '').trim();
    const normActionEndTime = (action.endTime || '').trim();
    const normActionDays = normDaysOfWeek ? [...normDaysOfWeek].map(Number).sort((a, b) => a - b).join(',') : '';

    // Tự động nhận diện dời lịch / sửa ngày: nếu có action.oldDate hoặc ngữ cảnh dời ngày (thật ra là tháng..., dời sang...)
    const isReschedule = Boolean(action.oldDate) || (typeof lastUserPrompt === 'string' &&
      /(?:thật\s+ra|chuyển\s+sang|dời\s+(?:lịch\s+)?sang|đổi\s+sang|sửa\s+lại\s+thành)/i.test(lastUserPrompt));

    if (isReschedule && !normDaysOfWeek) {
      const oldTargetDate = action.oldDate || '';
      data.calendarEvents = data.calendarEvents.filter(e => {
        const matchTitle = (e.title || '').trim().toLowerCase() === normActionTitle;
        const isOldDateMatch = oldTargetDate ? (e.date === oldTargetDate) : (e.date !== baseDateStr);
        const isNotRepeating = !e.repeat || e.repeat === 'none';
        return !(matchTitle && isOldDateMatch && isNotRepeating);
      });
    }

    targetDates.forEach(evDate => {
      // Chống tạo trùng lặp nếu sự kiện tương đương đã tồn tại
      const existingEv = data.calendarEvents.find(ex => {
        if (!ex) return false;
        const exTitle = (ex.title || '').trim().toLowerCase();
        const exTime = (ex.time || ex.startTime || '').trim();
        const exEndTime = (ex.endTime || '').trim();
        if (normDaysOfWeek && normDaysOfWeek.length > 0) {
          const rawExDays = ex.daysOfWeek || ex.repeatDays;
          const exDays = Array.isArray(rawExDays) ? [...rawExDays].map(Number).sort((a, b) => a - b).join(',') : '';
          return exTitle === normActionTitle && exTime === normActionTime && exEndTime === normActionEndTime && exDays === normActionDays;
        } else {
          return exTitle === normActionTitle && ex.date === evDate && exTime === normActionTime;
        }
      });

      if (existingEv) {
        if (effectiveRepeatUntil && !existingEv.repeatUntil) {
          existingEv.repeatUntil = effectiveRepeatUntil;
        }
        createdIds.push(existingEv.id);
        return;
      }

      const newEv = {
        id: 'cal-' + Date.now() + '-' + Math.floor(Math.random() * 100000),
        title: action.title || 'Sự kiện mới',
        date: evDate,
        time: action.time || '',
        endDate: action.endDate || evDate,
        endTime: action.endTime || '',
        category: action.category || 'Học tập',
        color: eventColor,
        repeat: repMode,
        repeatInterval: repInterval,
        repeatUnit: repUnit,
        repeatUntil: effectiveRepeatUntil,
        daysOfWeek: normDaysOfWeek,
        note: action.note || '',
        timestamp: Date.now()
      };
      data.calendarEvents.push(newEv);
      createdIds.push(newEv.id);
    });

    if (typeof renderCalendarTab === 'function') renderCalendarTab();
    if (typeof renderTimetableTab === 'function') renderTimetableTab();

    const isMulti = createdIds.length > 1;
    const card = document.createElement('div');
    card.className = 'action-card calendar-card';
    card.dataset.id = createdIds[0] || ('cal-existing-' + Date.now());

    const dayNameMap = { 0: 'Chủ Nhật', 1: 'Thứ 2', 2: 'Thứ 3', 3: 'Thứ 4', 4: 'Thứ 5', 5: 'Thứ 6', 6: 'Thứ 7' };
    let scheduleSub = '';
    const repeatUntilSuffix = effectiveRepeatUntil ? ` • Đến ngày ${effectiveRepeatUntil.split('-').reverse().join('/')}` : '';
    if (normDaysOfWeek && normDaysOfWeek.length > 0) {
      const daysStr = normDaysOfWeek.map(d => dayNameMap[d] || d).join(', ');
      scheduleSub = `Các ngày ${daysStr} hàng tuần • ${action.time || '07:30'}${action.endTime ? ' - ' + action.endTime : ''}${repeatUntilSuffix}`;
    } else if (isMulti) {
      scheduleSub = `${targetDates.length} ngày (${targetDates.join(', ')}) • ${action.time || ''}${action.endTime ? ' - ' + action.endTime : ''}${repeatUntilSuffix}`;
    } else {
      scheduleSub = `Ngày ${targetDates[0]}${action.time ? ' • ' + action.time : ''}${action.endTime ? ' - ' + action.endTime : ''}${isRecurring ? ' (Lặp lại' + repeatUntilSuffix + ')' : ''}`;
    }

    // Kiểm tra xung đột lịch trình (trùng giờ với sự kiện khác cùng ngày hoặc cùng thứ)
    let overlappingEvents = [];
    if (action.time) {
      const actTimeClean = String(action.time).trim();
      overlappingEvents = data.calendarEvents.filter(ev => {
        if (!ev || createdIds.includes(ev.id)) return false;
        const isSameDate = targetDates.includes(ev.date);
        const hasSameDayOfWeek = normDaysOfWeek && ev.daysOfWeek && ev.daysOfWeek.some(d => normDaysOfWeek.includes(d));
        if (isSameDate || hasSameDayOfWeek) {
          const evTime = String(ev.time || ev.startTime || '').trim();
          if (evTime && evTime === actTimeClean) {
            return true;
          }
        }
        return false;
      });
    }

    if (overlappingEvents.length > 0) {
      card.dataset.hasWarning = 'true';
      const evNames = overlappingEvents.map(e => `"${e.title}"`).join(', ');
      card.dataset.warningMessage = `⚠️ Chú ý: Najimez nhận thấy lịch trình "${action.title || 'mới'}" bị trùng giờ (${action.time}) với ${evNames} đó nha! Bạn nhớ sắp xếp thời gian hợp lý nhé. ❤️`;
    }

    card.innerHTML = `
      <div class="action-card-left">
        <div class="action-card-icon" style="background: rgba(99, 102, 241, 0.18); color: #818cf8;">
          <i class="fa-solid fa-calendar-check"></i>
        </div>
        <div class="action-card-info">
          <div class="action-card-title">
            <span>${escapeHTML(action.title || 'Sự kiện mới')}</span>
            <span class="card-category-badge" style="background: rgba(99, 102, 241, 0.22); color: #c7d2fe;">${escapeHTML(action.category || 'Học tập')}</span>
            ${normDaysOfWeek ? `<span class="card-category-badge" style="background: rgba(56, 189, 248, 0.2); color: #38bdf8;">${normDaysOfWeek.map(d => dayNameMap[d] || d).join(', ')}</span>` : ''}
            ${overlappingEvents.length > 0 ? '<span class="card-category-badge" style="background: rgba(245, 158, 11, 0.25); color: #f59e0b;"><i class="fa-solid fa-triangle-exclamation"></i> Trùng giờ</span>' : ''}
          </div>
          <div class="action-card-sub"><i class="fa-regular fa-clock"></i> ${escapeHTML(scheduleSub)}</div>
        </div>
      </div>
      <div class="action-card-right">
        <button type="button" class="btn-card-action undo" title="Hủy bỏ ${isMulti ? 'tất cả lịch này' : 'lịch này'}">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `;

    card.querySelector('.undo').addEventListener('click', () => {
      const cur = getLedgerData();
      if (Array.isArray(cur.calendarEvents)) {
        cur.calendarEvents = cur.calendarEvents.filter(x => !createdIds.includes(x.id));
        saveLedgerData(cur);
      }
      card.remove();
      if (typeof renderCalendarTab === 'function') renderCalendarTab();
      if (typeof renderTimetableTab === 'function') renderTimetableTab();
    });
    return card;
  }

  // 10a. Xóa toàn bộ sự kiện lịch & thời khóa biểu (clear_all_calendar_events)
  if (action.type === 'clear_all_calendar_events' || action.type === 'delete_all_calendar_events') {
    const totalDeleted = Array.isArray(data.calendarEvents) ? data.calendarEvents.length : 0;
    data.calendarEvents = [];
    if (typeof renderCalendarTab === 'function') renderCalendarTab();
    if (typeof renderTimetableTab === 'function') renderTimetableTab();
    const card = document.createElement('div');
    card.className = 'action-card';
    card.innerHTML = `
      <div class="action-card-left">
        <div class="action-card-icon" style="color: #fb7185;"><i class="fa-solid fa-calendar-xmark"></i></div>
        <div class="action-card-info">
          <div class="action-card-title">Đã xóa toàn bộ lịch & sự kiện</div>
          <div class="action-card-sub">Đã dọn sạch ${totalDeleted} sự kiện trên lịch trình</div>
        </div>
      </div>
    `;
    return card;
  }

  // 10b. Xóa sự kiện khỏi Tiện ích Lịch & Sự Kiện (delete_calendar_event)
  if (action.type === 'delete_calendar_event') {
    if (!Array.isArray(data.calendarEvents)) data.calendarEvents = [];
    const title = (action.title || '').toLowerCase().trim();
    const date = action.date || '';
    const initialLen = data.calendarEvents.length;
    data.calendarEvents = data.calendarEvents.filter(e => {
      const matchTitle = !title || (e.title || '').toLowerCase().includes(title);
      const matchDate = !date || e.date === date;
      return !(matchTitle && matchDate);
    });

    if (data.calendarEvents.length < initialLen) {
      if (typeof renderCalendarTab === 'function') renderCalendarTab();
      if (typeof renderTimetableTab === 'function') renderTimetableTab();
      const card = document.createElement('div');
      card.className = 'action-card';
      card.innerHTML = `
        <div class="action-card-left">
          <div class="action-card-icon" style="color: #fb7185;"><i class="fa-solid fa-calendar-xmark"></i></div>
          <div class="action-card-info">
            <div class="action-card-title">Đã xóa sự kiện: ${escapeHTML(action.title || 'Lịch trình')}</div>
            <div class="action-card-sub">Đã cập nhật Tiện ích Lịch & Sự Kiện</div>
          </div>
        </div>
      `;
      return card;
    }
  }

  // 11. Cập nhật / Dời lịch sự kiện trong Tiện ích Lịch (update_calendar_event hoặc move_calendar_event)
  if (action.type === 'update_calendar_event' || action.type === 'move_calendar_event') {
    if (!Array.isArray(data.calendarEvents)) data.calendarEvents = [];
    const title = (action.title || '').toLowerCase().trim();
    const oldDate = action.oldDate || action.fromDate || '';
    const newDate = action.newDate || action.date || action.toDate || '';
    const newTime = action.time || action.startTime || '';
    const newEndTime = action.endTime || '';

    let targetIdx = -1;
    if (oldDate) {
      targetIdx = data.calendarEvents.findIndex(e => {
        const matchTitle = !title || (e.title || '').toLowerCase().includes(title);
        return matchTitle && e.date === oldDate;
      });
    }
    if (targetIdx === -1 && title) {
      targetIdx = data.calendarEvents.findIndex(e => (e.title || '').toLowerCase().includes(title));
    }

    if (targetIdx !== -1) {
      const ev = data.calendarEvents[targetIdx];
      const prevDate = ev.date;
      if (newDate) {
        ev.date = newDate;
        ev.endDate = action.endDate || newDate;
      }
      if (newTime) ev.time = newTime;
      if (newEndTime) ev.endTime = newEndTime;
      if (action.newTitle) ev.title = action.newTitle;
      if (action.category) ev.category = action.category;
      if (action.repeatUntil || action.repeatEnd || action.until) {
        ev.repeatUntil = action.repeatUntil || action.repeatEnd || action.until;
      }
      ev.updatedAt = Date.now();

      if (typeof renderCalendarTab === 'function') renderCalendarTab();
      if (typeof renderTimetableTab === 'function') renderTimetableTab();

      const theme = (typeof getSmartEventTheme === 'function') ? getSmartEventTheme(ev) : { color: '#0284c7' };
      const evColor = theme.color || '#0284c7';
      const card = document.createElement('div');
      card.className = 'action-card calendar-card';
      card.dataset.id = ev.id;
      card.innerHTML = `
        <div class="action-card-left">
          <div class="action-card-icon" style="background: ${evColor}28; color: ${evColor};">
            <i class="fa-solid fa-calendar-check"></i>
          </div>
          <div class="action-card-info">
            <div class="action-card-title">
              <span>Đã dời lịch: ${escapeHTML(ev.title)}</span>
              <span class="card-category-badge" style="background: ${evColor}25; color: ${evColor};">${escapeHTML(ev.category || 'Học tập')}</span>
            </div>
            <div class="action-card-sub"><i class="fa-regular fa-clock"></i> Đã chuyển từ ngày ${prevDate} sang ngày ${ev.date}${ev.time ? ` (${ev.time}${ev.endTime ? ' - ' + ev.endTime : ''})` : ''}</div>
          </div>
        </div>
        <div class="action-card-right">
          <button type="button" class="btn-card-action undo" title="Hủy bỏ lịch này">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      `;
      card.querySelector('.undo').addEventListener('click', () => {
        const cur = getLedgerData();
        if (Array.isArray(cur.calendarEvents)) {
          cur.calendarEvents = cur.calendarEvents.filter(x => x.id !== ev.id);
          saveLedgerData(cur);
        }
        card.remove();
        if (typeof renderCalendarTab === 'function') renderCalendarTab();
        if (typeof renderTimetableTab === 'function') renderTimetableTab();
      });
      return card;
    }
  }

  return null;
}

function getNaturalAIResponse(userText) {
  const raw = userText.trim();
  const lower = raw.toLowerCase().trim();

  // Tra cứu: Ai đang nợ tôi / Ai nợ nhiều nhất
  if (/(?:ai\s+(?:đang\s+)?nợ\s+tôi|ai\s+nợ\s+(?:tôi\s+)?nhiều\s+nhất|danh\s+sách\s+(?:người\s+)?nợ)/i.test(lower)) {
    const curData = getLedgerData();
    const debts = curData.debts || [];
    const whoMap = {};
    debts.forEach(d => {
      if (d.status !== 'paid') {
        const p = d.person.trim();
        if (!whoMap[p]) whoMap[p] = { name: p, theyOweMe: 0, iOweThem: 0 };
        const amt = Number(d.amount) || 0;
        if (d.direction === 'they_owe_me') whoMap[p].theyOweMe += amt;
        else whoMap[p].iOweThem += amt;
      }
    });
    const list = Object.values(whoMap).map(c => ({ name: c.name, net: c.theyOweMe - c.iOweThem })).filter(c => c.net > 0).sort((a, b) => b.net - a.net);
    if (list.length === 0) {
      return { text: 'Hiện tại trong hệ thống **không có ai đang nợ tiền bạn** cả! Bạn đang có một dòng tiền thu hồi rất sạch sẽ.' };
    }
    const topPerson = list[0];
    const details = list.map((c, idx) => `${idx + 1}. **${c.name}**: ${formatCurrency(c.net)}`).join('\n');
    return {
      text: `Dựa trên dữ liệu sổ nợ thời gian thực của bạn:\n\n🏆 Người đang nợ bạn nhiều nhất là **${topPerson.name}** với số tiền **${formatCurrency(topPerson.net)}**.\n\nDanh sách chi tiết những người đang nợ bạn:\n${details}\n\nBạn có muốn tôi tạo mã VietQR gửi cho ${topPerson.name} để nhắc thanh toán không?`
    };
  }

  // Tra cứu: Tôi đang nợ ai / Ai tôi nợ nhiều nhất
  if (/(?:tôi\s+(?:đang\s+)?nợ\s+ai|tôi\s+nợ\s+ai\s+nhiều\s+nhất)/i.test(lower)) {
    const curData = getLedgerData();
    const debts = curData.debts || [];
    const whoMap = {};
    debts.forEach(d => {
      if (d.status !== 'paid') {
        const p = d.person.trim();
        if (!whoMap[p]) whoMap[p] = { name: p, theyOweMe: 0, iOweThem: 0 };
        const amt = Number(d.amount) || 0;
        if (d.direction === 'they_owe_me') whoMap[p].theyOweMe += amt;
        else whoMap[p].iOweThem += amt;
      }
    });
    const list = Object.values(whoMap).map(c => ({ name: c.name, net: c.iOweThem - c.theyOweMe })).filter(c => c.net > 0).sort((a, b) => b.net - a.net);
    if (list.length === 0) {
      return { text: 'Tin vui! Hiện tại **bạn không nợ ai bất kỳ khoản tiền nào** cả.' };
    }
    const topPerson = list[0];
    const details = list.map((c, idx) => `${idx + 1}. **${c.name}**: bạn nợ ${formatCurrency(c.net)}`).join('\n');
    return {
      text: `Dựa trên dữ liệu sổ nợ thời gian thực của bạn:\n\n⚠️ Người bạn đang nợ nhiều nhất là **${topPerson.name}** với số tiền **${formatCurrency(topPerson.net)}**.\n\nDanh sách chi tiết những người bạn đang nợ:\n${details}`
    };
  }

  // Tra cứu: Số dư ví / Còn bao nhiêu tiền / Tổng thu chi
  if (/(?:còn\s+bao\s+nhiêu\s+tiền|số\s+dư|tổng\s+tiền|tài\s+chính\s+của\s+tôi)/i.test(lower)) {
    const curData = getLedgerData();
    const txs = curData.transactions || [];
    let inc = 0, exp = 0;
    txs.forEach(t => {
      const a = Number(t.amount) || 0;
      if (t.type === 'income') inc += a;
      else exp += a;
    });
    const bal = inc - exp;
    return {
      text: `Báo cáo tài chính cá nhân thời gian thực của bạn:\n\n* **Tổng thu:** ${formatCurrency(inc)}\n* **Tổng chi:** ${formatCurrency(exp)}\n* **Số dư còn lại trong ví:** **${formatCurrency(bal)}** ${bal < 0 ? '(⚠️ Đang thâm hụt ngân sách)' : '(✅ Số dư khả dụng)'}\n\nTôi luôn theo dõi sát sao từng biến động số dư cho bạn!`
    };
  }

  // Xóa toàn bộ lịch sử sổ nợ hoặc xác nhận xóa luôn
  if (/(?:xóa|xoá)\s+(?:tất\s+cả|toàn\s+bộ|hết|sạch)\s+(?:lịch\s+sử\s+)?(?:giao\s+dịch\s+)?(?:trong\s+)?sổ\s+nợ|(?:xoá|xóa)\s+luôn/i.test(lower)) {
    return {
      text: `Để đảm bảo an toàn cho dữ liệu tài chính của bạn, việc xóa toàn bộ sổ nợ cần sự xác nhận cụ thể. Bạn vui lòng bấm nút xác nhận bên dưới nhé:\n\n<!--NAJIMEZ_ACTION:{"type":"clear_all_debts"}-->`
    };
  }

  // Xóa nợ qua chat
  if (/(?:xóa\s+nợ|xóa\s+sổ\s+nợ)\s+(?:của\s+)?(.+)/i.test(lower)) {
    const m = lower.match(/(?:xóa\s+nợ|xóa\s+sổ\s+nợ)\s+(?:của\s+)?([^\d]+)/i);
    if (m) {
      const person = m[1].replace(/(?:đi|nhé|giùm|hộ)/g, '').trim();
      return {
        text: `Đã thực hiện quyền quản trị: Tôi đã xóa toàn bộ dữ liệu nợ của **${person}** khỏi hệ thống.\n\n<!--NAJIMEZ_ACTION:{"type":"delete_debt","person":"${person}"}-->`
      };
    }
  }

  // Chi tiêu
  const expenseMatch = lower.match(/(?:chi|tiêu|mua|ăn|uống|hết)\s+(.+?)\s+(\d+(?:[\.,]\d+)?\s*(?:k|nghìn|ngàn|triệu|tr|đ|vnd)?)/i) ||
    lower.match(/(?:chi|tiêu|mua)\s+(\d+(?:[\.,]\d+)?\s*(?:k|nghìn|ngàn|triệu|tr|đ|vnd)?)\s*(?:tiền|cho)?\s*(.*)/i);
  if (expenseMatch) {
    let amountStr = expenseMatch[2] || expenseMatch[1];
    let note = (expenseMatch[1] === amountStr ? expenseMatch[2] : expenseMatch[1]) || 'Khoản chi tiêu';
    let amount = parseAmount(amountStr);
    return {
      text: `Tôi đã ghi nhận khoản chi tiêu cho **${note}** với số tiền **${formatCurrency(amount)}** vào sổ tài chính của bạn.\n\n<!--NAJIMEZ_ACTION:{"type":"expense","amount":${amount},"category":"Chi tiêu","note":"${note}"}-->`
    };
  }

  // Thu nhập
  const incomeMatch = lower.match(/(?:thu|lương|thưởng|nhận)\s+(.+?)\s+(\d+(?:[\.,]\d+)?\s*(?:k|nghìn|ngàn|triệu|tr|đ|vnd)?)/i) ||
    lower.match(/(?:thu|lương|thưởng|nhận)\s+(\d+(?:[\.,]\d+)?\s*(?:k|nghìn|ngàn|triệu|tr|đ|vnd)?)\s*(?:tiền)?\s*(.*)/i);
  if (incomeMatch) {
    let amountStr = incomeMatch[2] || incomeMatch[1];
    let note = (incomeMatch[1] === amountStr ? incomeMatch[2] : incomeMatch[1]) || 'Khoản thu';
    let amount = parseAmount(amountStr);
    return {
      text: `Tuyệt vời! Tôi đã cộng khoản thu **${formatCurrency(amount)}** (${note}) vào ngân sách của bạn.\n\n<!--NAJIMEZ_ACTION:{"type":"income","amount":${amount},"category":"Thu nhập","note":"${note}"}-->`
    };
  }

  // 1. Thanh toán / Trả nợ
  if (/(?:đã\s+trả|trả\s+nợ|thanh\s+toán\s+nợ|trả\s+xong|trả\s+tiền|thu\s+hồi\s+nợ)/i.test(lower)) {
    let person = '';
    let amount = 0;
    let direction = 'i_owe_them';

    if (/(?:tôi|mình)\s+(?:đã\s+)?trả\s+(?:nợ\s+)?(?:cho\s+)?(.+)/i.test(lower)) {
      const m = lower.match(/(?:tôi|mình)\s+(?:đã\s+)?trả\s+(?:nợ\s+)?(?:cho\s+)?([^\d]+)(?:\s+(\d+.*))?/i);
      if (m) {
        person = m[1].replace(/(?:xong|hết|rồi)/g, '').trim();
        if (m[2]) amount = parseAmount(m[2]);
      }
      direction = 'i_owe_them';
    } else if (/(.+?)\s+(?:đã\s+)?trả\s+(?:nợ\s+)?(?:cho\s+)?(?:tôi|mình)/i.test(lower)) {
      const m = lower.match(/(.+?)\s+(?:đã\s+)?trả\s+(?:nợ\s+)?(?:cho\s+)?(?:tôi|mình)(?:\s+(\d+.*))?/i);
      if (m) {
        person = m[1].replace(/^(thằng|bạn|anh|chị|em)\s+/i, '').trim();
        if (m[2]) amount = parseAmount(m[2]);
      }
      direction = 'they_owe_me';
    } else {
      const m = lower.match(/(?:trả\s+nợ|thanh\s+toán\s+nợ)\s+(?:cho\s+)?([^\d]+)(?:\s+(\d+.*))?/i);
      if (m) {
        person = m[1].replace(/(?:xong|hết|rồi)/g, '').trim();
        if (m[2]) amount = parseAmount(m[2]);
      }
    }

    if (person) {
      const curData = getLedgerData();
      const debts = curData.debts || [];
      const theyOweDebts = debts.filter(d => d.status !== 'paid' && matchPersonName(d.person, person) && d.direction === 'they_owe_me');
      const iOweDebts = debts.filter(d => d.status !== 'paid' && matchPersonName(d.person, person) && d.direction === 'i_owe_them');

      // Kiểm tra xung đột logic: người dùng bảo "An đã trả nợ cho tôi" nhưng mình đang nợ An!
      if (direction === 'they_owe_me' && theyOweDebts.length === 0 && iOweDebts.length > 0) {
        const totalOwed = iOweDebts.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
        return {
          text: `⚠️ **Cảnh báo xung đột logic:**\n\nTrong sổ nợ hiện tại, **bạn đang nợ ${person} ${formatCurrency(totalOwed)}** chứ ${person} không hề nợ tiền bạn!\n\nCó phải ý bạn muốn nói là: **"Tôi đã trả nợ cho ${person}"** không? Vui lòng xác nhận lại để tôi cập nhật chính xác nhé!`
        };
      }

      // Kiểm tra xung đột logic: người dùng bảo "Tôi đã trả nợ cho X" nhưng X đang nợ mình!
      if (direction === 'i_owe_them' && iOweDebts.length === 0 && theyOweDebts.length > 0) {
        const totalOwed = theyOweDebts.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
        return {
          text: `⚠️ **Cảnh báo xung đột logic:**\n\nTrong sổ nợ hiện tại, **${person} đang nợ bạn ${formatCurrency(totalOwed)}** chứ bạn không hề nợ ${person}!\n\nCó phải ý bạn muốn nói là: **"${person} đã trả nợ cho tôi"** không? Vui lòng xác nhận lại nhé!`
        };
      }

      return {
        text: `Tuyệt vời! Tôi đã ghi nhận việc hoàn thành thanh toán khoản nợ với **${person}** và cập nhật lại Sổ Nợ cũng như Sổ Thu Chi của bạn ngay đây.\n\n<!--NAJIMEZ_ACTION:{"type":"settle_debt","person":"${person}","direction":"${direction}","amount":${amount},"note":"Đã thanh toán nợ"}-->`
      };
    }
  }

  // 2. Vay mượn / Sổ nợ mới
  if (lower.includes('mượn') || lower.includes('nợ') || lower.includes('vay')) {
    const iBorrowMatch = lower.match(/(?:tôi|mình)\s+(?:mượn|vay)\s+(?:của\s+)?(.+?)\s+(\d+(?:[\.,]\d+)?\s*(?:k|nghìn|ngàn|triệu|tr|đ|vnd)?)(?:\s*(?:tiền)?\s*(.*))?/i);
    if (iBorrowMatch) {
      const person = iBorrowMatch[1].replace(/^(thằng|bạn|anh|chị|em)\s+/i, '').trim();
      const amount = parseAmount(iBorrowMatch[2]);
      const note = iBorrowMatch[3] || 'Tiền mượn';
      return {
        text: `Đã ghi nhận: Bạn vay mượn từ **${person}** số tiền **${formatCurrency(amount)}** (${note}). Khoản này đã được thêm vào mục **"Tôi nợ họ"** trong sổ nợ.\n\n<!--NAJIMEZ_ACTION:{"type":"debt","direction":"i_owe_them","person":"${person}","amount":${amount},"note":"${note}"}-->`
      };
    }

    const theyBorrowMatch = lower.match(/(.+?)\s+(?:mượn|vay|nợ)\s+(?:tôi|mình)?\s*(\d+(?:[\.,]\d+)?\s*(?:k|nghìn|ngàn|triệu|tr|đ|vnd)?)(?:\s*(?:tiền)?\s*(.*))?/i);
    if (theyBorrowMatch) {
      const person = theyBorrowMatch[1].replace(/^(thằng|bạn|anh|chị|em)\s+/i, '').trim();
      const amount = parseAmount(theyBorrowMatch[2]);
      const note = theyBorrowMatch[3] || 'Cho mượn tiền';
      return {
        text: `Đã lưu vào sổ nợ: **${person}** nợ bạn **${formatCurrency(amount)}** (${note}). Bạn có thể mở mã VietQR bên dưới để gửi yêu cầu thanh toán nhanh chóng.\n\n<!--NAJIMEZ_ACTION:{"type":"debt","direction":"they_owe_me","person":"${person}","amount":${amount},"note":"${note}"}-->`
      };
    }
  }

  // Lên lịch học / Tạo thời khóa biểu nhiều ngày (ví dụ thứ 2, 4, 6)
  if (
    /(?:thứ\s+[2-7]|t[2-7]|chủ\s+nhật|mỗi\s+tuần).*(?:học|tiếng anh|toán|gym|lịch|thời khóa biểu)/i.test(lower) ||
    /(?:tạo|lên|đặt|thêm)\s+(?:lịch|thời khóa biểu).*(?:thứ|mỗi\s+tuần|\d+h)/i.test(lower) ||
    /(?:không\s+tạo\s+nhiều\s+lịch|tạo\s+nhiều\s+lịch|tạo\s+ngày\s+thứ|thứ\s+2\s*4\s*6|thứ\s+2,\s*4,\s*6)/i.test(lower)
  ) {
    const days = [];
    if (/(?:thứ\s+2|t2|thứ\s+hai)/i.test(lower) || /(?:2\s*,\s*4\s*,\s*6|2\s+4\s+6)/i.test(lower)) days.push(1);
    if (/(?:thứ\s+3|t3|thứ\s+ba)/i.test(lower) || /(?:3\s*,\s*5\s*,\s*7|3\s+5\s+7|3\s+và\s+5)/i.test(lower)) days.push(2);
    if (/(?:thứ\s+4|t4|thứ\s+tư)/i.test(lower) || /(?:2\s*,\s*4\s*,\s*6|2\s+4\s+6)/i.test(lower)) days.push(3);
    if (/(?:thứ\s+5|t5|thứ\s+năm)/i.test(lower) || /(?:3\s*,\s*5\s*,\s*7|3\s+5\s+7|3\s+và\s+5)/i.test(lower)) days.push(4);
    if (/(?:thứ\s+6|t6|thứ\s+sáu)/i.test(lower) || /(?:2\s*,\s*4\s*,\s*6|2\s+4\s+6)/i.test(lower)) days.push(5);
    if (/(?:thứ\s+7|t7|thứ\s+bảy)/i.test(lower) || /(?:3\s*,\s*5\s*,\s*7|3\s+5\s+7)/i.test(lower)) days.push(6);
    if (/(?:chủ\s+nhật|cn)/i.test(lower)) days.push(0);

    const uniqueDays = [...new Set(days)].sort((a, b) => a - b);
    const useDays = uniqueDays.length > 0 ? uniqueDays : [1, 3, 5];

    let startTime = '07:30';
    let endTime = '10:00';
    const timeRangeMatch = lower.match(/(\d{1,2}(?:h|:\d{2}))\s*[-–đến]\s*(\d{1,2}(?:h|:\d{2}))/i);
    if (timeRangeMatch) {
      const formatH = s => {
        if (s.includes(':')) return s.padStart(5, '0');
        const h = s.replace('h', '');
        return `${String(h).padStart(2, '0')}:00`;
      };
      startTime = formatH(timeRangeMatch[1]);
      endTime = formatH(timeRangeMatch[2]);
    }

    let title = 'Học tiếng Anh';
    if (lower.includes('tiếng anh')) title = 'Học tiếng Anh';
    else if (lower.includes('toán')) title = 'Học Toán';
    else if (lower.includes('gym')) title = 'Tập Gym';
    else if (lower.includes('khoa học')) title = 'Học Khoa học';

    const dayNameMap = { 0: 'Chủ Nhật', 1: 'Thứ Hai', 2: 'Thứ Ba', 3: 'Thứ Tư', 4: 'Thứ Năm', 5: 'Thứ Sáu', 6: 'Thứ Bảy' };
    const dayNamesStr = useDays.map(d => dayNameMap[d]).join(', ');

    return {
      text: `Dạ có chứ, Najimez tạo được nhiều lịch cùng lúc cho bạn ngay đây ạ! 🥰\n\nNajimez đã thêm đầy đủ lịch **${title}** vào cả **${dayNamesStr}** (từ **${startTime}** đến **${endTime}**) và tự động thiết lập **lặp lại hằng tuần** trên Tiện ích Lịch & Thời Khóa Biểu cho bạn rồi nhé!\n\n<!--NAJIMEZ_ACTION:{"type":"calendar_event","title":"${title}","date":"2026-10-26","time":"${startTime}","endTime":"${endTime}","category":"Học tập","repeat":"custom","repeatUnit":"week","repeatInterval":1,"daysOfWeek":[${useDays.join(',')}]}-->`
    };
  }

  // Xóa / Hủy sự kiện lịch (offline fallback)
  if (/(?:xóa\s+lịch|hủy\s+lịch|bỏ\s+lịch|xóa\s+sự\s+kiện)/i.test(lower)) {
    const titleMatch = lower.replace(/(?:xóa\s+lịch|hủy\s+lịch|bỏ\s+lịch|xóa\s+sự\s+kiện)\s*/i, '').trim();
    return {
      text: `Dạ được chứ, Najimez đã hủy và xóa sự kiện **${titleMatch || 'lịch trình'}** khỏi Tiện ích Lịch & Thời Khóa Biểu cho bạn rồi nhé!\n\n<!--NAJIMEZ_ACTION:{"type":"delete_calendar_event","title":"${titleMatch}"}-->`
    };
  }

  // Dời lịch / Chuyển lịch sang ngày khác (offline fallback)
  if (/(?:dời\s+lịch|chuyển\s+lịch|đổi\s+lịch|thật\s+ra\s+là\s+tháng)/i.test(lower)) {
    const curData = getLedgerData();
    const evs = curData.calendarEvents || [];
    const lastEv = evs[evs.length - 1];
    let title = lastEv ? lastEv.title : 'Sự kiện';
    let newDate = '2026-11-25';
    let oldDate = lastEv ? lastEv.date : '2026-10-25';

    const monthMatch = lower.match(/tháng\s*(\d{1,2})/i);
    const dayMatch = lower.match(/ngày\s*(\d{1,2})/i);
    if (monthMatch) {
      const mNum = String(monthMatch[1]).padStart(2, '0');
      const dNum = dayMatch ? String(dayMatch[1]).padStart(2, '0') : (lastEv ? lastEv.date.split('-')[2] : '25');
      newDate = `2026-${mNum}-${dNum}`;
    }

    return {
      text: `Dạ Najimez đã dời lịch **${title}** từ ngày **${oldDate}** sang ngày **${newDate}** và tự động xóa ngày cũ trên Lịch cho bạn rồi nhé! 🥰\n\n<!--NAJIMEZ_ACTION:{"type":"update_calendar_event","title":"${title}","oldDate":"${oldDate}","date":"${newDate}"}-->`
    };
  }

  // Nhắc việc / Lịch trình
  if (lower.startsWith('nhắc ') || lower.includes('lịch trình') || lower.includes('họp')) {
    const title = raw.replace(/^nhắc\s+/i, '').trim();
    return {
      text: `Đã lên lịch trình công việc: **${title}**. Tôi sẽ luôn hiển thị trong danh sách việc cần làm để bạn không bỏ lỡ.\n\n<!--NAJIMEZ_ACTION:{"type":"task","title":"${title}","time":"Hôm nay"}-->`
    };
  }

  // Chức năng menu
  if (lower.includes('chức năng') || lower.includes('tính năng') || lower.includes('làm được gì') || lower.includes('menu')) {
    return {
      html: `
        <p class="copilot-title">Hệ thống trợ lý thông minh <strong>Najimez</strong> (Powered by Gemini) hỗ trợ các nghiệp vụ:</p>
        <div class="quick-action-chips">
          <button type="button" class="action-chip chip-blue" data-action="finance">💰 Quản lý chi tiêu</button>
          <button type="button" class="action-chip chip-green" data-action="debts">💛 Sổ nợ &amp; VietQR</button>
          <button type="button" class="action-chip chip-pink" data-action="schedule">📅 Lên lịch trình To-Do</button>
          <button type="button" class="action-chip chip-orange" data-action="study">💡 Giải đáp thắc mắc &amp; Code</button>
          <button type="button" class="action-chip chip-cyan" data-action="chat">💬 Đàm thoại cùng Gemini</button>
        </div>
        <p class="copilot-footer">Gõ trực tiếp các khoản thu chi, sổ nợ hoặc câu hỏi để tương tác ngay nhé!</p>
      `
    };
  }

  // Sức khỏe, ốm đau
  if (
    lower.includes('đau bụng') || lower.includes('đau đầu') || lower.includes('nhức đầu') ||
    lower.includes('sốt') || lower.includes('cảm cúm') || lower.includes('mệt') ||
    lower.includes('chóng mặt') || lower.includes('buồn nôn') || lower.includes('khó chịu')
  ) {
    if (lower.includes('đau bụng')) {
      return {
        text: `Bạn đang bị đau bụng ở vị trí nào thế (vùng thượng vị, quanh rốn hay bụng dưới)? Cơn đau âm ỉ hay quặn từng cơn?\n\n**Một số việc bạn nên làm ngay lúc này:**\n1. **Uống nước ấm:** Nhấp từng ngụm nước ấm hoặc trà gừng ấm để xoa dịu dạ dày và đường ruột.\n2. **Nghỉ ngơi:** Nằm ở tư thế thoải mái, có thể co nhẹ hai đầu gối lên để giảm áp lực co thắt cơ bụng.\n3. **Tránh ăn:** Đồ cay nóng, dầu mỡ, đồ chua hoặc nước có ga lúc này.\n\n⚠️ *Lưu ý quan trọng:* Nếu cơn đau dữ dội, kéo dài không giảm, hoặc kèm theo sốt, nôn mửa, bạn nhớ nhờ người thân đưa đến cơ sở y tế gần nhất khám ngay nhé!`
      };
    }
    return {
      text: `Nghe bạn nói vậy tôi lo cho bạn quá! Khi cơ thể không khỏe, điều quan trọng nhất lúc này là bạn hãy tạm gác bớt công việc, uống một ly nước ấm và nằm nghỉ ngơi một chút nhé.\n\nNếu thấy các triệu chứng kéo dài hoặc nặng hơn, bạn nhớ đi khám bác sĩ hoặc uống thuốc theo chỉ định nha!`
    };
  }

  // Cảm xúc & Tâm trạng
  if (
    lower.includes('buồn') || lower.includes('chán') || lower.includes('stress') ||
    lower.includes('áp lực') || lower.includes('tụt mood') || lower.includes('cô đơn')
  ) {
    return {
      text: `Tôi luôn ở đây lắng nghe bạn nè! Có chuyện gì làm bạn thấy nặng lòng hay mệt mỏi thế, kể tôi nghe với được không? Đôi khi nói ra được sẽ thấy lòng nhẹ nhõm hơn nhiều đấy.`
    };
  }

  // Lời cảm ơn
  if (lower.includes('cảm ơn') || lower.includes('thanks') || lower.includes('giỏi quá')) {
    return {
      text: `Rất vui vì đã hỗ trợ được cho bạn! Được đồng hành cùng bạn là niềm vinh hạnh của tôi. Bất cứ khi nào cần trợ giúp, bạn cứ nhắn cho tôi nhé ✨`
    };
  }

  // Tiện ích Vòng quay may mắn / Quyết định ngẫu nhiên (Ăn gì, uống gì, làm gì, ai bao)
  if (
    lower.includes('vòng quay') || lower.includes('quay số') || lower.includes('quay thưởng') ||
    lower.includes('ăn gì') || lower.includes('uống gì') || lower.includes('chọn hộ') || lower.includes('chọn giúp')
  ) {
    setTimeout(() => {
      if (typeof openLuckyWheel === 'function') {
        if (lower.includes('uống')) openLuckyWheel('uong_gi');
        else if (lower.includes('việc') || lower.includes('làm gì')) openLuckyWheel('todos');
        else if (lower.includes('ai bao') || lower.includes('ai trả')) openLuckyWheel('contacts');
        else openLuckyWheel('an_gi');
      }
    }, 350);
    return {
      text: `🎯 Najimez đã mở ngay **Vòng Quay May Mắn** cho bạn rồi đây! Hãy nhấn **QUAY** để giải cứu sự đắn đo nhé!`
    };
  }

  // -------------------------------------------------------------
  // Tra cứu Lịch, Sự kiện, Lịch học, Thời khóa biểu & Lịch trình thông minh
  // -------------------------------------------------------------
  const isCalendarQuery = 
    lower.includes('lịch') || lower.includes('sự kiện') || lower.includes('thời khóa biểu') ||
    lower.includes('tkb') || lower.includes('lịch học') || lower.includes('buổi học') ||
    lower.includes('lịch hẹn') || lower.includes('lịch trình') || lower.includes('lịch thi') ||
    lower.includes('ngày mai có gì') || lower.includes('hôm nay có gì') ||
    /(?:thế\s+còn\s+)?ngày\s+\d+/i.test(lower) ||
    /ngày\s+\d+\s+(?:thì\s+sao|thế\s+nào|có\s+gì)/i.test(lower) ||
    /(?:thứ\s+[2-7]|thứ\s+(?:hai|ba|tư|năm|sáu|bảy)|chủ\s+nhật)\s+(?:có\s+gì|thì\s+sao|thế\s+nào|lịch)/i.test(lower);

  if (isCalendarQuery) {
    const data = typeof getLedgerData === 'function' ? getLedgerData() : {};
    const events = Array.isArray(data.calendarEvents) ? data.calendarEvents : [];
    const tasks = Array.isArray(data.tasks) ? data.tasks : [];

    const now = new Date();
    let targetDate = new Date(now);
    let targetLabel = 'Hôm nay';
    let isSpecificDateParsed = false;

    // Phân tích: "ngày 26", "ngày 26/10", "26/10", "thế còn ngày 26"...
    const hasWordNgayWithNum = /ngày\s+(\d{1,2})/i.exec(lower);

    if (hasWordNgayWithNum) {
      const dNum = parseInt(hasWordNgayWithNum[1], 10);
      let mNum = now.getMonth() + 1;
      let yNum = now.getFullYear();

      const monthMatch = lower.match(/(?:ngày\s+\d{1,2}\s*(?:[\/\-]|tháng)\s*)(\d{1,2})/i);
      if (monthMatch) {
        mNum = parseInt(monthMatch[1], 10);
      }
      const yearMatch = lower.match(/(?:ngày\s+\d{1,2}[\/\-\s]+(?:\d{1,2}|tháng\s*\d{1,2})[\/\-\s]+(?:năm\s*)?)(\d{4})/i);
      if (yearMatch) {
        yNum = parseInt(yearMatch[1], 10);
      }

      if (dNum >= 1 && dNum <= 31 && mNum >= 1 && mNum <= 12) {
        targetDate = new Date(yNum, mNum - 1, dNum);
        targetLabel = `Ngày ${dNum}/${mNum}/${yNum}`;
        isSpecificDateParsed = true;
      }
    } else if (lower.includes('ngày mốt') || lower.includes('ngày kia')) {
      targetDate.setDate(now.getDate() + 2);
      targetLabel = 'Ngày kia';
      isSpecificDateParsed = true;
    } else if (lower.includes('ngày mai') || lower.includes('mai')) {
      targetDate.setDate(now.getDate() + 1);
      targetLabel = 'Ngày mai';
      isSpecificDateParsed = true;
    } else if (lower.includes('hôm qua')) {
      targetDate.setDate(now.getDate() - 1);
      targetLabel = 'Hôm qua';
      isSpecificDateParsed = true;
    } else if (lower.includes('hôm nay')) {
      targetLabel = 'Hôm nay';
      isSpecificDateParsed = true;
    } else {
      // Phân tích thứ trong tuần: "thứ hai", "thứ ba"...
      const dayMap = {
        'chủ nhật': 0, 'cn': 0,
        'thứ hai': 1, 'thứ 2': 1, 't2': 1,
        'thứ ba': 2, 'thứ 3': 2, 't3': 2,
        'thứ tư': 3, 'thứ 4': 3, 't4': 3,
        'thứ năm': 4, 'thứ 5': 4, 't5': 4,
        'thứ sáu': 5, 'thứ 6': 5, 't6': 5,
        'thứ bảy': 6, 'thứ 7': 6, 't7': 6
      };
      for (const [kw, dayIdx] of Object.entries(dayMap)) {
        if (lower.includes(kw)) {
          const currentDay = now.getDay();
          let diff = dayIdx - currentDay;
          if (diff < 0) diff += 7;
          if (diff === 0 && (lower.includes('tuần sau') || lower.includes('tới'))) diff = 7;
          targetDate.setDate(now.getDate() + diff);
          const dayOfWeekNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
          targetLabel = `${dayOfWeekNames[dayIdx]}`;
          isSpecificDateParsed = true;
          break;
        }
      }
    }

    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    const targetKey = `${yyyy}-${mm}-${dd}`;
    const dayOfWeekNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const targetDayOfWeek = dayOfWeekNames[targetDate.getDay()];

    const nowY = now.getFullYear();
    const nowM = String(now.getMonth() + 1).padStart(2, '0');
    const nowD = String(now.getDate()).padStart(2, '0');
    const todayKey = `${nowY}-${nowM}-${nowD}`;

    const checkOccur = typeof isEventOccurringOnDate === 'function'
      ? isEventOccurringOnDate
      : (e, k) => (e.date === k || (e.endDate && k >= e.date && k <= e.endDate));

    const dayEvents = events.filter(e => checkOccur(e, targetKey));
    const dayTasks = tasks.filter(t => t.dueDate === targetKey || (targetKey === todayKey && (t.time === 'Hôm nay' || !t.time)));
    const holiday = typeof getHolidayInfo === 'function' ? getHolidayInfo(Number(dd), Number(mm), Number(yyyy)) : null;

    if (dayEvents.length === 0 && dayTasks.length === 0 && !holiday) {
      return {
        text: `📅 **Lịch & Sự kiện (${targetDayOfWeek} - ${dd}/${mm}/${yyyy}):**\n\nNajimez đã kiểm tra trong Tiện ích Lịch & Sự Kiện, hiện tại bạn chưa có lịch học hay sự kiện nào được lên lịch cho ngày này cả. Ngày hôm đó của bạn đang hoàn toàn trống trải nha! Bạn có thể chuyển sang tab **"Lịch & Sự Kiện"** hoặc bảo Najimez ghi chú để mình thêm giúp bạn nhé ✨`
      };
    }

    let summary = `📅 **Lịch trình của bạn (${targetDayOfWeek} - ${dd}/${mm}/${yyyy}):**\n\n`;
    if (holiday) {
      summary += `🎉 **${holiday.icon || '✨'} ${escapeHTML(holiday.name)}**\n*${escapeHTML(holiday.desc || 'Ngày lễ đặc biệt trong năm')}*\n\n`;
    }
    if (dayEvents.length > 0) {
      summary += `**📌 Sự kiện & Lịch học:**\n` + dayEvents.map((e, idx) => {
        let line = `${idx + 1}. **${escapeHTML(e.title)}**`;
        if (e.endDate && e.endDate !== e.date) {
          line += ` (📅 ${escapeHTML(e.date)}${e.time ? ' ' + escapeHTML(e.time) : ''} ➔ ${escapeHTML(e.endDate)}${e.endTime ? ' ' + escapeHTML(e.endTime) : ''})`;
        } else if (e.time && e.endTime) {
          line += ` (⏰ ${escapeHTML(e.time)} - ${escapeHTML(e.endTime)})`;
        } else if (e.time) {
          line += ` (⏰ ${escapeHTML(e.time)})`;
        }
        if (e.category) line += ` • [${escapeHTML(e.category)}]`;
        if (e.note) line += `\n   *Ghi chú: ${escapeHTML(e.note)}*`;
        return line;
      }).join('\n') + '\n\n';
    }

    if (dayTasks.length > 0) {
      summary += `**📋 Công việc To-Do:**\n` + dayTasks.map((t, idx) => {
        return `- [${t.done ? 'x' : ' '}] **${escapeHTML(t.title)}** ${t.done ? '*(Đã xong)*' : '*(Chưa xong)*'}`;
      }).join('\n');
    }

    return { text: summary };
  }

  // Chào hỏi
  if (lower === 'xin chào' || lower === 'chào' || lower === 'hello' || lower === 'hi') {
    return {
      text: `Xin chào bạn! Tôi là Gemini – bộ não trí tuệ nhân tạo của Najimez. Tôi có thể hỗ trợ bạn giải đáp thắc mắc, phân tích dữ liệu, viết mã lập trình và quản lý tài chính, sổ nợ thông minh. Hôm nay tôi có thể đồng hành cùng bạn điều gì?`
    };
  }

  return {
    text: `Tôi đã ghi nhận chia sẻ của bạn về *" ${escapeHTML(raw)} "*. Bạn có thể chia sẻ cụ thể hơn hoặc cho tôi biết bạn đang muốn hỗ trợ điều gì (học tập, tính toán hay lên kế hoạch) để tôi giúp bạn chu đáo nhất nhé!`
  };
}

function initChatEngine() {
  const form = document.getElementById('copilotForm');
  const input = document.getElementById('copilotInput');
  const feed = document.getElementById('copilotFeed');
  const btnReset = document.getElementById('btnResetAllData');
  const btnMic = document.getElementById('btnVoiceMic');

  if (feed) {
    const greetingEl = feed.querySelector('.greeting-text');
    if (greetingEl) greetingEl.textContent = getDynamicGreeting();
  }

  function scrollToBottom() {
    feed.scrollTop = feed.scrollHeight;
  }

  function addUserMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'chat-msg user';
    msg.innerHTML = `
      <div class="msg-avt"><i class="fa-solid fa-user"></i></div>
      <div class="msg-text-bubble"><p>${escapeHTML(text)}</p></div>
    `;
    feed.appendChild(msg);
    scrollToBottom();
  }

  function createAIMessageBubble() {
    const msg = document.createElement('div');
    msg.className = 'chat-msg ai';
    msg.innerHTML = `
      <div class="msg-avt"><img src="assets/najimez.jpg" alt="Najimez" class="ai-avatar-img" /></div>
      <div class="msg-text-bubble">
        <div class="bubble-content"><span class="streaming-cursor"></span></div>
        <div class="action-cards-container" style="display:none;"></div>
      </div>
    `;
    feed.appendChild(msg);
    scrollToBottom();

    return {
      msgElement: msg,
      contentEl: msg.querySelector('.bubble-content'),
      cardsContainer: msg.querySelector('.action-cards-container'),
      updateStream(currentRawText) {
        const cleanVisible = currentRawText.replace(/<!--NAJIMEZ_ACTION:[\s\S]*?-->/g, '');
        this.contentEl.innerHTML = renderMarkdown(cleanVisible) + '<span class="streaming-cursor"></span>';
        scrollToBottom();
      },
      finalize(fullRawText) {
        const { cleanText, cards } = parseAndExecuteActions(fullRawText);
        this.contentEl.innerHTML = renderMarkdown(cleanText);

        if (cards && cards.length > 0) {
          this.cardsContainer.style.display = 'flex';
          this.cardsContainer.innerHTML = '';
          cards.forEach(card => this.cardsContainer.appendChild(card));
        }

        attachCodeBlockEnhancements(this.contentEl);

        const toolbar = createMessageToolbar(cleanText, () => {
          if (lastUserPrompt) handleUserTurn(lastUserPrompt);
        });
        this.msgElement.querySelector('.msg-text-bubble').appendChild(toolbar);

        bindActionChips(this.msgElement);
        scrollToBottom();

        if (typeof playAssistantSound === 'function') {
          playAssistantSound('reply');
        }

        const voiceCfg = (typeof loadVoiceSettings === 'function')
          ? loadVoiceSettings()
          : ((typeof currentVoiceSettings !== 'undefined') ? currentVoiceSettings : null);

        if (voiceCfg && voiceCfg.autoRead) {
          const ttsBtn = toolbar.querySelector('.btn-tts');
          if (ttsBtn) {
            updateTTSButtonState(ttsBtn, 'loading');
            speakAssistantText(
              cleanText,
              () => {
                updateTTSButtonState(ttsBtn, 'speaking');
              },
              () => {
                updateTTSButtonState(ttsBtn, 'idle');
              },
              () => {
                updateTTSButtonState(ttsBtn, 'idle');
              }
            );
          } else {
            speakAssistantText(cleanText);
          }
        }
      }
    };
  }

  function bindActionChips(container) {
    container.querySelectorAll('.action-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const label = btn.textContent.trim();
        handleUserTurn(label, action);
      });
    });
  }

  async function handleUserTurn(text, specificAction = null) {
    if (!text || !text.trim()) return;
    const cleanText = text.trim();
    lastUserPrompt = cleanText;

    // Tự động dừng âm thanh cũ ngay khi gửi tin nhắn mới
    if (typeof stopSpeakingAssistant === 'function') {
      stopSpeakingAssistant();
    }

    addUserMessage(cleanText);
    input.value = '';

    if (typeof playAssistantSound === 'function') {
      playAssistantSound('send');
    }

    if (specificAction) {
      const bubble = createAIMessageBubble();
      setTimeout(() => {
        let reply = '';
        switch (specificAction) {
          case 'finance':
            reply = `**💰 Quản lý chi tiêu:**\n\nBạn có thể nhắn cho Gemini các khoản thu chi thực tế, ví dụ:\n- *"Chi 45k cà phê sáng"*\n- *"Mua sách lập trình 180k"*\n- *"Nhận lương 15 triệu"*`;
            break;
          case 'debts':
            reply = `**💛 Quản lý sổ nợ & VietQR:**\n\nNajimez giúp theo dõi ai nợ bạn và bạn nợ ai, kèm mã VietQR chuyển khoản ngay lập tức:\n- *"Tuấn mượn tôi 200k tiền lẩu"*\n- *"Tôi nợ Nam 50k tiền trà sữa"*`;
            break;
          case 'schedule':
            reply = `**📅 Lên lịch trình & To-Do:**\n\nLên kế hoạch và nhắc nhở công việc cá nhân:\n- *"Nhắc 15h đi họp đối tác"*\n- *"Thêm việc chuẩn bị tài liệu báo cáo ngày mai"*`;
            break;
          case 'study':
            reply = `**💡 Giải đáp thắc mắc & Lập trình:**\n\nBạn có thể hỏi mọi thắc mắc học thuật, giải bài tập hoặc nhờ tôi viết và gỡ lỗi code: HTML, CSS, JavaScript, Python, C++, v.v.`;
            break;
          case 'chat':
            reply = `**💬 Đàm thoại cùng Gemini:**\n\nTôi luôn ở đây để lắng nghe, trao đổi tri thức và chia sẻ cùng bạn mọi ý tưởng trong công việc và cuộc sống.`;
            break;
          default:
            reply = `Tôi đã ghi nhận yêu cầu của bạn!`;
        }
        bubble.finalize(reply);
      }, 250);
      return;
    }

    const apiKey = getStoredApiKey();
    const bubble = createAIMessageBubble();

    if (apiKey) {
      try {
        const fullResult = await callGeminiAPIStream(cleanText, (streamedText) => {
          bubble.updateStream(streamedText);
        });
        if (fullResult) {
          bubble.finalize(fullResult);
          return;
        }
      } catch (err) {
        console.error('Lỗi gọi Gemini Streaming API:', err);
        bubble.finalize(`⚠️ **Không thể kết nối với Google Gemini API**\n\n> **Nguyên nhân:** ${err.message || 'Mã API Key không hợp lệ hoặc đã hết hạn mức.'}\n\n💡 *Cách khắc phục:* Bạn hãy nhấp vào nút chìa khóa 🔑 ở góc trên để kiểm tra hoặc dán lại mã API Key chính xác từ [Google AI Studio](https://aistudio.google.com/app/apikey).`);
        return;
      }
    }

    setTimeout(() => {
      const resp = getNaturalAIResponse(cleanText);
      if (resp.html) {
        bubble.contentEl.innerHTML = resp.html;
        bindActionChips(bubble.msgElement);
        scrollToBottom();
      } else {
        bubble.finalize(resp.text);
      }
    }, 350);
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleUserTurn(input.value);
    });
  }

  if (btnMic) {
    btnMic.addEventListener('click', () => {
      const prompts = [
        'Hôm nay tôi ăn phở 45k và uống cà phê 30k',
        'Tuấn mượn tôi 200k tiền ăn lẩu',
        'Nhắc tôi 15h chiều mai đi họp đối tác',
        'Giải thích nguyên lý hoạt động của trí tuệ nhân tạo',
        'Bạn có thể hỗ trợ những tính năng gì?'
      ];
      const pick = prompts[Math.floor(Math.random() * prompts.length)];
      input.value = pick;
      input.focus();
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', async () => {
      const confirmed = typeof showAppConfirm === 'function'
        ? await showAppConfirm('Làm mới lại toàn bộ cuộc trò chuyện với Najimez?', {
            title: 'Làm mới cuộc trò chuyện',
            btnText: 'Làm mới ngay',
            btnIcon: 'fa-solid fa-rotate-right'
          })
        : confirm('Làm mới lại toàn bộ cuộc trò chuyện với Najimez?');

      if (confirmed) {
        conversationHistory = [];
        if (typeof updateHeaderGreeting === 'function') updateHeaderGreeting();
        feed.innerHTML = `
          <div class="chat-msg ai">
            <div class="msg-avt"><img src="assets/najimez.jpg" alt="Najimez" class="ai-avatar-img" /></div>
            <div class="msg-text-bubble">
              <p class="greeting-text">${getDynamicGreeting()}</p>
            </div>
          </div>
        `;
      }
    });
  }
}
