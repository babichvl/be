// Инициализация Telegram Web App
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.expand();
  tg.enableClosingConfirmation();
}

// ─── Переключение вкладок ────────────────────────
const navItems  = document.querySelectorAll('.bottomnav__item[data-tab]');
const screens   = document.querySelectorAll('.screen');
const pageTitle = document.getElementById('page-title');

const TAB_TITLES = {
  home:     'Home',
  schedule: 'Расписание',
  clients:  'Клиенты',
  workouts: 'Тренировки',
};

function switchTab(tabId) {
  navItems.forEach(btn =>
    btn.classList.toggle('active', btn.dataset.tab === tabId)
  );
  screens.forEach(s =>
    s.classList.toggle('active', s.id === `screen-${tabId}`)
  );
  pageTitle.textContent = TAB_TITLES[tabId] ?? 'Home';
}

navItems.forEach(btn =>
  btn.addEventListener('click', () => switchTab(btn.dataset.tab))
);

// ─── Меню (три точки) ────────────────────────────
const menuBtn  = document.getElementById('menu-btn');
const dropdown = document.getElementById('dropdown');

menuBtn.addEventListener('click', e => {
  e.stopPropagation();
  dropdown.hidden = !dropdown.hidden;
});

// Закрыть меню при клике вне его
document.addEventListener('click', () => {
  dropdown.hidden = true;
});

// ─── FAB ────────────────────────────────────────
document.getElementById('fab-btn').addEventListener('click', () => {
  alert('Добавить — функционал в разработке');
});

// ─── Полоска календаря ──────────────────────────
const DAY_NAMES   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

function buildCalendar() {
  const today    = new Date();
  const calDays  = document.getElementById('cal-days');
  const calMonth = document.getElementById('cal-month');

  calMonth.textContent = `${MONTH_NAMES[today.getMonth()]} ${today.getFullYear()}`;

  calDays.innerHTML = '';

  // Показываем 7 дней: 3 до сегодня, сегодня, 3 после
  for (let offset = -3; offset <= 3; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);

    const el = document.createElement('div');
    el.className = 'cal-day' + (offset === 0 ? ' active' : '');
    el.setAttribute('role', 'listitem');
    el.setAttribute('aria-label',
      `${DAY_NAMES[d.getDay()]} ${d.getDate()}${offset === 0 ? ', сегодня' : ''}`
    );
    el.innerHTML = `
      <span class="cal-day__name">${DAY_NAMES[d.getDay()]}</span>
      <span class="cal-day__num">${d.getDate()}</span>
    `;
    calDays.appendChild(el);
  }

  // Прокручиваем активный день в центр
  requestAnimationFrame(() => {
    const active = calDays.querySelector('.cal-day.active');
    active?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  });
}

buildCalendar();
