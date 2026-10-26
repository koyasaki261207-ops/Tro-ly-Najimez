/**
 * js/todos.js - Quản lý công việc, lịch trình và danh sách To-Do
 */

function renderTodosTab() {
  const container = document.getElementById('todosWorkspaceList');
  const countBadge = document.getElementById('todosCountBadge');
  const data = getLedgerData();
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];

  const pending = tasks.filter(t => !t.done).length;
  if (countBadge) countBadge.textContent = `${pending} việc chưa hoàn thành`;

  if (!container) return;

  if (tasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box">
        <i class="fa-solid fa-calendar-check"></i>
        <p>Danh sách việc cần làm đang trống.<br/>
        <small>Thêm công việc ở trên hoặc chat với Najimez (VD: <em>"Nhắc 15h đi họp đối tác"</em>)!</small></p>
      </div>
    `;
    return;
  }

  container.innerHTML = tasks.map(t => {
    return `
      <div class="todo-row-item ${t.done ? 'done' : ''}" data-id="${t.id}">
        <div class="todo-left">
          <button type="button" class="btn-task-check ${t.done ? 'done' : ''}" data-action="toggle-todo" data-id="${t.id}" title="${t.done ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu đã hoàn thành'}">
            <i class="fa-solid fa-check"></i>
          </button>
          <div class="todo-text">
            <strong>${escapeHTML(t.title)}</strong>
            <span><i class="fa-regular fa-clock"></i> ${escapeHTML(t.time || 'Hôm nay')}</span>
          </div>
        </div>
        <button type="button" class="btn-row-del" data-action="del-todo" data-id="${t.id}" title="Xóa công việc này">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </div>
    `;
  }).join('');

  container.querySelectorAll('[data-action="toggle-todo"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const curData = getLedgerData();
      const task = curData.tasks.find(tk => tk.id === id);
      if (task) {
        task.done = !task.done;
        saveLedgerData(curData);
      }
    });
  });

  container.querySelectorAll('[data-action="del-todo"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      if (!id) return;

      const confirmed = typeof showAppConfirm === 'function'
        ? await showAppConfirm('Xóa công việc này khỏi danh sách?', {
            title: 'Xóa công việc',
            btnText: 'Xác nhận xóa',
            btnIcon: 'fa-solid fa-trash-can'
          })
        : confirm('Xóa công việc này khỏi danh sách?');

      if (confirmed) {
        const curData = getLedgerData();
        curData.tasks = (curData.tasks || []).filter(tk => String(tk.id) !== String(id));
        saveLedgerData(curData);
      }
    });
  });
}

function initTodosTab() {
  const btnAdd = document.getElementById('btnQuickAddTask');
  const titleInput = document.getElementById('quickTaskTitleInput');
  const timeInput = document.getElementById('quickTaskTimeInput');

  if (btnAdd && titleInput) {
    btnAdd.addEventListener('click', () => {
      const title = titleInput.value.trim();
      const time = timeInput ? timeInput.value.trim() : 'Hôm nay';

      if (!title) {
        alert('Vui lòng nhập nội dung công việc.');
        titleInput.focus();
        return;
      }

      const data = getLedgerData();
      const newTask = {
        id: 'tk-' + Date.now(),
        title: title,
        time: time || 'Hôm nay',
        done: false,
        timestamp: Date.now()
      };

      data.tasks.unshift(newTask);
      saveLedgerData(data);

      titleInput.value = '';
      if (timeInput) timeInput.value = '';
    });
  }
}

function toggleTask(id, cardEl) {
  const data = getLedgerData();
  const task = data.tasks.find(t => t.id === id);
  if (task) {
    task.done = !task.done;
    saveLedgerData(data);
    cardEl.classList.toggle('done', task.done);
  }
}
