// ─── Замените на ваши реальные значения ───
const SUPABASE_URL      = ''https://qhvtapqlyajkikgfacdo.supabase.co'';
const SUPABASE_ANON_KEY = ''eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodnRhcHFseWFqa2lrZ2ZhY2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxNjM3NjEsImV4cCI6MjEwMzczOTc2MX0.hr8Uiy3hvbhwfJ0At7T0TR8waK4Mt5ylFw-B-qp5Cow';
// ──────────────────────────────────────────

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const tg = window.Telegram?.WebApp;

// ═══════════════════════ State ═══════════════════════
let state = {
  view:       'day',        // day | week | month
  current:    new Date(),   // selected date
  sessions:   [],           // cached from Supabase
  clients:    [],           // trainer's clients
  trainerId:  null,         // DB uuid
  trainerTgId: null,
};

const TYPE_LABELS = {
  personal: 'Персональная',
  group:    'Групповая',
  online:   'Онлайн',
  intro:    'Вводная',
};

const STATUS_LABELS = {
  pending:   'Ожидает',
  confirmed: 'Подтверждена',
  completed: 'Проведена',
  cancelled: 'Отменена',
};

// ═══════════════════════ Init ════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  if (tg) {
    tg.ready();
    tg.expand();
  }

  setupTabs();
  setupViewSwitcher();
  setupNavArrows();
  setupModals();

  await loadTrainer();
  if (state.trainerId) {
    await loadClients();
    await loadSessions();
    renderSchedule();
  }
});

// ═══════════════════════ Auth / Data ═════════════════

async function loadTrainer() {
  const tgUser = tg?.initDataUnsafe?.user;
  if (!tgUser) return;
  state.trainerTgId = tgUser.id;

  const { data } = await db
    .from('users')
    .select('id')
    .eq('telegram_id', tgUser.id)
    .single();

  if (data) state.trainerId = data.id;
}

async function loadClients() {
  if (!state.trainerId) return;
  const { data } = await db
    .from('clients')
    .select('id, name')
    .eq('trainer_id', state.trainerId)
    .order('name');
  state.clients = data || [];
  populateClientSelect();
}

async function loadSessions() {
  if (!state.trainerId) return;

  // load ±60 days around current date
  const from = new Date(state.current);
  from.setDate(from.getDate() - 60);
  const to = new Date(state.current);
  to.setDate(to.getDate() + 60);

  const { data } = await db
    .from('sessions')
    .select('*, clients(name)')
    .eq('trainer_id', state.trainerId)
    .gte('scheduled_at', from.toISOString())
    .lte('scheduled_at', to.toISOString())
    .order('scheduled_at');
  state.sessions = data || [];
}

// ═══════════════════════ Render router ═══════════════

function renderSchedule() {
  updatePeriodLabel();
  updateWeekStrip();
  const body = document.getElementById('calendar-body');

  if (state.view === 'day')   renderDayView(body);
  else if (state.view === 'week')  renderWeekView(body);
  else renderMonthView(body);
}

// ═══════════════════════ Day view ════════════════════

function renderDayView(container) {
  const day = state.current;
  const daySessions = sessionsForDay(day);

  const hours = [];
  for (let h = 6; h <= 22; h++) hours.push(h);

  container.innerHTML = `
    <div class="time-grid">
      <div class="time-col">
        ${hours.map(h => `
          <div class="time-slot" data-hour="${h}">
            <span class="time-label">${formatHour(h)}</span>
          </div>
        `).join('')}
      </div>
      <div class="events-col" id="events-col">
        ${renderSessionCards(daySessions, day)}
      </div>
    </div>
  `;

  // click on empty slot → pre-fill add form
  container.querySelectorAll('.time-slot').forEach(slot => {
    slot.addEventListener('click', () => {
      openAddModal(day, parseInt(slot.dataset.hour));
    });
  });

  attachSessionCardListeners(container);
}

function renderSessionCards(sessions, day) {
  if (!sessions.length) return '';
  const dayStart = 6; // 06:00 is hour 0 in grid
  const slotH    = 68; // px per hour (matches CSS)

  return sessions.map(s => {
    const dt       = new Date(s.scheduled_at);
    const hour     = dt.getHours() + dt.getMinutes() / 60;
    const top      = (hour - dayStart) * slotH;
    const height   = Math.max((s.duration / 60) * slotH - 4, 28);
    const name     = s.clients?.name || '—';
    const statusCls = `status-${s.status}`;

    return `
      <div class="session-card ${statusCls}"
           style="top:${top}px; height:${height}px"
           data-id="${s.id}"
           role="button" tabindex="0"
           aria-label="${name}, ${TYPE_LABELS[s.type]}">
        <span class="card-name">${name}</span>
        <span class="card-meta">${TYPE_LABELS[s.type] || s.type}</span>
      </div>
    `;
  }).join('');
}

// ═══════════════════════ Week view ═══════════════════

function renderWeekView(container) {
  const days = weekDays(state.current);

  container.innerHTML = `
    <div class="week-grid">
      <div class="time-col-sm">
        ${[6,8,10,12,14,16,18,20].map(h => `
          <div class="wtime-slot"><span class="time-label">${formatHour(h)}</span></div>
        `).join('')}
      </div>
      <div class="week-cols">
        ${days.map(d => `
          <div class="week-day-col ${isSameDay(d, new Date()) ? 'today' : ''}">
            ${sessionsForDay(d).map(s => {
              const dt = new Date(s.scheduled_at);
              const pct = ((dt.getHours() + dt.getMinutes()/60 - 6) / 16) * 100;
              const h   = Math.max((s.duration / 60 / 16) * 100, 4);
              return `<div class="week-card status-${s.status}"
                           style="top:${pct}%;height:${h}%"
                           data-id="${s.id}"
                           role="button" tabindex="0">
                        <span class="card-name-sm">${s.clients?.name || '—'}</span>
                      </div>`;
            }).join('')}
          </div>
        `).join('')}
      </div>
    </div>
  `;
  attachSessionCardListeners(container);
}

// ═══════════════════════ Month view ══════════════════

function renderMonthView(container) {
  const year  = state.current.getFullYear();
  const month = state.current.getMonth();
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);

  // pad to Monday start
  const startOffset = (first.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d));

  container.innerHTML = `
    <div class="month-grid">
      ${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d =>
        `<div class="month-head">${d}</div>`).join('')}
      ${cells.map(d => {
        if (!d) return '<div class="month-cell empty"></div>';
        const count = sessionsForDay(d).length;
        const sel   = isSameDay(d, state.current) ? 'selected' : '';
        const tod   = isSameDay(d, new Date()) ? 'today' : '';
        return `
          <div class="month-cell ${sel} ${tod}" data-date="${d.toISOString()}" role="button" tabindex="0">
            <span class="month-day-num">${d.getDate()}</span>
            ${count ? `<span class="month-dot">${count}</span>` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;

  container.querySelectorAll('.month-cell[data-date]').forEach(cell => {
    cell.addEventListener('click', () => {
      state.current = new Date(cell.dataset.date);
      state.view = 'day';
      document.querySelectorAll('.view-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.view === 'day'));
      updateWeekStripVisibility();
      renderSchedule();
    });
  });
}

// ═══════════════════════ Week strip ══════════════════

function updateWeekStrip() {
  const strip   = document.getElementById('week-strip');
  const visible = state.view !== 'month';
  strip.style.display = visible ? '' : 'none';
  if (!visible) return;

  const days = weekDays(state.current);
  const DAY_NAMES = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];

  strip.innerHTML = days.map(d => {
    const sel = isSameDay(d, state.current) ? 'active' : '';
    const tod = isSameDay(d, new Date()) ? 'today' : '';
    return `
      <button class="strip-day ${sel} ${tod}" data-date="${d.toISOString()}" aria-label="${d.toLocaleDateString()}">
        <span class="strip-name">${DAY_NAMES[d.getDay()]}</span>
        <span class="strip-num">${d.getDate()}</span>
      </button>
    `;
  }).join('');

  strip.querySelectorAll('.strip-day').forEach(btn => {
    btn.addEventListener('click', () => {
      state.current = new Date(btn.dataset.date);
      if (state.view === 'week') state.view = 'day';
      document.querySelectorAll('.view-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.view === state.view));
      renderSchedule();
    });
  });

  // scroll selected into center
  const active = strip.querySelector('.strip-day.active');
  if (active) active.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
}

function updateWeekStripVisibility() {
  document.getElementById('week-strip').style.display =
    state.view !== 'month' ? '' : 'none';
}

// ═══════════════════════ Period label ════════════════

function updatePeriodLabel() {
  const label = document.getElementById('period-label');
  const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь',
                  'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  if (state.view === 'day') {
    label.textContent = state.current.toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' });
  } else if (state.view === 'week') {
    const days  = weekDays(state.current);
    const first = days[0];
    const last  = days[6];
    label.textContent = `${first.getDate()} – ${last.getDate()} ${MONTHS[last.getMonth()]}`;
  } else {
    label.textContent = `${MONTHS[state.current.getMonth()]} ${state.current.getFullYear()}`;
  }
}

// ═══════════════════════ Setup handlers ══════════════

function setupTabs() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${tab}`)?.classList.add('active');
    });
  });
}

function setupViewSwitcher() {
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.view = btn.dataset.view;
      updateWeekStripVisibility();
      renderSchedule();
    });
  });
}

function setupNavArrows() {
  document.getElementById('prev-period').addEventListener('click', () => shiftPeriod(-1));
  document.getElementById('next-period').addEventListener('click', () => shiftPeriod(1));
}

function shiftPeriod(dir) {
  const d = new Date(state.current);
  if (state.view === 'day')   d.setDate(d.getDate() + dir);
  if (state.view === 'week')  d.setDate(d.getDate() + dir * 7);
  if (state.view === 'month') d.setMonth(d.getMonth() + dir);
  state.current = d;
  loadSessions().then(renderSchedule);
}

function setupModals() {
  // FAB → add modal
  document.getElementById('fab-add').addEventListener('click', () => openAddModal(state.current));

  // Type change → toggle online link field
  document.getElementById('f-type').addEventListener('change', e => {
    document.getElementById('field-online-link').style.display =
      e.target.value === 'online' ? '' : 'none';
  });

  // Repeat change → toggle days
  document.getElementById('f-repeat').addEventListener('change', e => {
    document.getElementById('field-days').style.display =
      e.target.value === 'custom' ? '' : 'none';
  });

  // Form submit
  document.getElementById('form-session').addEventListener('submit', handleFormSubmit);

  // Cancel add
  document.getElementById('btn-cancel-add').addEventListener('click', () => closeModal('modal-add'));

  // Close detail
  document.getElementById('btn-close-detail').addEventListener('click', () => closeModal('modal-detail'));

  // Click overlay → close
  document.querySelectorAll('.modal-overlay').forEach(o => {
    o.addEventListener('click', e => { if (e.target === o) closeModal(o.id); });
  });
}

// ═══════════════════════ Add / Edit modal ════════════

function openAddModal(date, hour = null) {
  resetAddForm();
  document.getElementById('modal-add-title').textContent = 'Новая тренировка';
  document.getElementById('btn-save-session').textContent = 'Создать';

  const d = new Date(date);
  document.getElementById('f-date').value = d.toISOString().split('T')[0];
  if (hour !== null) {
    document.getElementById('f-time').value = `${String(hour).padStart(2,'0')}:00`;
  }

  openModal('modal-add');
}

function resetAddForm() {
  document.getElementById('form-session').reset();
  document.getElementById('f-session-id').value = '';
  document.getElementById('field-online-link').style.display = 'none';
  document.getElementById('field-days').style.display = 'none';
  document.getElementById('conflict-warning').style.display = 'none';
}

function populateClientSelect() {
  const sel = document.getElementById('f-client');
  sel.innerHTML = '<option value="">— выберите клиента —</option>' +
    state.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const clientId  = document.getElementById('f-client').value;
  const type      = document.getElementById('f-type').value;
  const date      = document.getElementById('f-date').value;
  const time      = document.getElementById('f-time').value;
  const duration  = parseInt(document.getElementById('f-duration').value) || 60;
  const cost      = document.getElementById('f-cost').value;
  const link      = document.getElementById('f-link').value.trim();
  const repeat    = document.getElementById('f-repeat').value;
  const days      = [...document.querySelectorAll('#field-days input:checked')]
                      .map(cb => parseInt(cb.value));
  const sessionId = document.getElementById('f-session-id').value;

  if (!clientId) { alert('Выберите клиента.'); return; }
  if (!date || !time) { alert('Укажите дату и время.'); return; }

  const scheduled_at = new Date(`${date}T${time}:00`).toISOString();

  // conflict check (local)
  const warn = document.getElementById('conflict-warning');
  const conflict = checkConflict(scheduled_at, duration, sessionId);
  warn.style.display = conflict ? '' : 'none';
  // we warn but don't block

  const payload = {
    action:       sessionId ? 'reschedule_session' : 'create_session',
    client_id:    clientId,
    type,
    scheduled_at,
    duration,
    repeat_rule:  repeat,
    repeat_days:  days,
    online_link:  link || null,
    cost:         cost ? parseFloat(cost) : null,
  };
  if (sessionId) payload.session_id = sessionId;

  sendToBot(payload);
  closeModal('modal-add');

  // optimistic refresh
  setTimeout(async () => { await loadSessions(); renderSchedule(); }, 1500);
}

function checkConflict(scheduled_at, duration, excludeId) {
  const start = new Date(scheduled_at).getTime();
  const end   = start + duration * 60000;
  return state.sessions.some(s => {
    if (s.id === excludeId || s.status === 'cancelled') return false;
    const sStart = new Date(s.scheduled_at).getTime();
    const sEnd   = sStart + (s.duration || 60) * 60000;
    return start < sEnd && end > sStart;
  });
}

// ═══════════════════════ Detail modal ════════════════

function attachSessionCardListeners(container) {
  container.querySelectorAll('.session-card, .week-card').forEach(card => {
    card.addEventListener('click', () => openDetailModal(card.dataset.id));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter') openDetailModal(card.dataset.id);
    });
  });
}

function openDetailModal(sessionId) {
  const s = state.sessions.find(x => x.id === sessionId);
  if (!s) return;

  const dt = new Date(s.scheduled_at);

  document.getElementById('d-title').textContent     = s.clients?.name || '—';
  document.getElementById('d-type').textContent      = TYPE_LABELS[s.type] || s.type;
  document.getElementById('d-client').textContent    = s.clients?.name || '—';
  document.getElementById('d-datetime').textContent  = dt.toLocaleString('ru', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });
  document.getElementById('d-duration').textContent  = `${s.duration || 60} мин`;

  const badge = document.getElementById('d-status-badge');
  badge.textContent = STATUS_LABELS[s.status] || s.status;
  badge.className   = `detail-status-badge status-${s.status}`;

  const linkRow = document.getElementById('d-row-link');
  if (s.online_link) {
    linkRow.style.display = '';
    document.getElementById('d-link').href = s.online_link;
  } else {
    linkRow.style.display = 'none';
  }

  const costRow = document.getElementById('d-row-cost');
  if (s.cost) {
    costRow.style.display = '';
    document.getElementById('d-cost').textContent = `${s.cost} ₽`;
  } else {
    costRow.style.display = 'none';
  }

  buildDetailActions(s);
  document.getElementById('reschedule-form').style.display = 'none';
  openModal('modal-detail');
}

function buildDetailActions(s) {
  const wrap = document.getElementById('detail-actions');
  wrap.innerHTML = '';

  const buttons = [];
  if (s.status !== 'completed' && s.status !== 'cancelled') {
    buttons.push({ label: '✅ Проведена', cls: 'btn-success', action: () => sendAction('complete_session', s.id) });
    buttons.push({ label: '🔄 Перенести',  cls: 'btn-warning', action: () => toggleRescheduleForm(s) });
    buttons.push({ label: '❌ Отменить',   cls: 'btn-danger',  action: () => sendAction('cancel_session', s.id) });
    buttons.push({ label: '📨 Напомнить',  cls: 'btn-ghost',   action: () => sendAction('remind_client', s.id) });
  }

  buttons.forEach(({ label, cls, action }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `btn-action ${cls}`;
    btn.textContent = label;
    btn.addEventListener('click', action);
    wrap.appendChild(btn);
  });
}

function toggleRescheduleForm(s) {
  const form = document.getElementById('reschedule-form');
  form.style.display = form.style.display === 'none' ? '' : 'none';

  const dt = new Date(s.scheduled_at);
  document.getElementById('rs-date').value = dt.toISOString().split('T')[0];
  document.getElementById('rs-time').value = `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;

  document.getElementById('btn-rs-cancel').onclick = () => { form.style.display = 'none'; };
  document.getElementById('btn-rs-save').onclick = () => {
    const date = document.getElementById('rs-date').value;
    const time = document.getElementById('rs-time').value;
    if (!date || !time) return;
    const scheduled_at = new Date(`${date}T${time}:00`).toISOString();
    sendToBot({ action: 'reschedule_session', session_id: s.id, scheduled_at });
    closeModal('modal-detail');
    setTimeout(async () => { await loadSessions(); renderSchedule(); }, 1500);
  };
}

function sendAction(action, sessionId) {
  sendToBot({ action, session_id: sessionId });
  closeModal('modal-detail');
  setTimeout(async () => { await loadSessions(); renderSchedule(); }, 1500);
}

// ═══════════════════════ Telegram bridge ═════════════

function sendToBot(payload) {
  if (tg?.sendData) {
    tg.sendData(JSON.stringify(payload));
  } else {
    console.warn('Telegram.WebApp.sendData недоступен:', payload);
  }
}

// ═══════════════════════ Utilities ═══════════════════

function sessionsForDay(date) {
  return state.sessions.filter(s => {
    const sd = new Date(s.scheduled_at);
    return sd.getFullYear() === date.getFullYear() &&
           sd.getMonth()    === date.getMonth()    &&
           sd.getDate()     === date.getDate();
  });
}

function weekDays(date) {
  const d   = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0=Mon
  d.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    return x;
  });
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

function formatHour(h) {
  const suffix = h < 12 ? 'AM' : 'PM';
  const h12    = h % 12 || 12;
  return `${String(h12).padStart(2,'0')}:00 ${suffix}`;
}

function openModal(id) {
  const el = document.getElementById(id);
  el.classList.add('open');
  el.setAttribute('aria-hidden', 'false');
}

function closeModal(id) {
  const el = document.getElementById(id);
  el.classList.remove('open');
  el.setAttribute('aria-hidden', 'true');
}
