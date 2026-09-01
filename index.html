// Инициализация Telegram Web App
const tg = window.Telegram?.WebApp;
if (tg) { tg.expand(); tg.enableClosingConfirmation(); }

document.addEventListener('DOMContentLoaded', () => {

  // ─── Переключение вкладок ──────────────────────
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
      s.classList.toggle('active', s.id === 'screen-' + tabId)
    );
    if (pageTitle) pageTitle.textContent = TAB_TITLES[tabId] ?? 'Home';
  }

  navItems.forEach(btn =>
    btn.addEventListener('click', () => switchTab(btn.dataset.tab))
  );

  // Установить начальное состояние явно
  switchTab('home');

  // ─── Меню (три точки) ─────────────────────────
  const menuBtn  = document.getElementById('menu-btn');
  const dropdown = document.getElementById('dropdown');

  menuBtn.addEventListener('click', e => {
    e.stopPropagation();
    dropdown.hidden = !dropdown.hidden;
  });
  document.addEventListener('click', () => { dropdown.hidden = true; });

  // ─── FAB ──────────────────────────────────────
  document.getElementById('fab-btn').addEventListener('click', () => {
    alert('Добавить — в разработке');
  });

  // ─── Полоска календаря ────────────────────────
  const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MONTH_NAMES = ['January','February','March','April','May','June',
                       'July','August','September','October','November','December'];

  function buildCalendar(dayContainerId, monthId) {
    const today    = new Date();
    const calDays  = document.getElementById(dayContainerId);
    const calMonth = document.getElementById(monthId);
    if (!calDays || !calMonth) return;

    calMonth.textContent = MONTH_NAMES[today.getMonth()] + ' ' + today.getFullYear();
    calDays.innerHTML = '';

    for (let offset = -3; offset <= 3; offset++) {
      const d = new Date(today);
      d.setDate(today.getDate() + offset);
      const el = document.createElement('div');
      el.className = 'cal-day' + (offset === 0 ? ' active' : '');
      el.setAttribute('role', 'listitem');
      el.setAttribute('aria-label',
        DAY_NAMES[d.getDay()] + ' ' + d.getDate() + (offset === 0 ? ', сегодня' : ''));
      el.innerHTML =
        '<span class="cal-day__name">' + DAY_NAMES[d.getDay()] + '</span>' +
        '<span class="cal-day__num">'  + d.getDate() + '</span>';

      // Клик по дню — переключение активного
      el.addEventListener('click', () => {
        calDays.querySelectorAll('.cal-day').forEach(c => c.classList.remove('active'));
        el.classList.add('active');
      });
      calDays.appendChild(el);
    }

    requestAnimationFrame(() => {
      const active = calDays.querySelector('.cal-day.active');
      active?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
  }

  buildCalendar('cal-days',   'cal-month');
  buildCalendar('cal-days-s', 'cal-month-s');

});
