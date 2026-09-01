// Инициализация Telegram Web App
const tg = window.Telegram?.WebApp;
if (tg) { tg.expand(); tg.enableClosingConfirmation(); }

// ─── Переключение вкладок ──────────────────────────
const navItems  = document.querySelectorAll('.bottomnav__item[data-tab]');
const screens   = document.querySelectorAll('.screen');
const pageTitle = document.getElementById('page-title');

const TAB_TITLES = {
  home:     'Главная',
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
  pageTitle.textContent = TAB_TITLES[tabId] || 'Главная';
}

navItems.forEach(btn =>
  btn.addEventListener('click', () => switchTab(btn.dataset.tab))
);

// Начальное состояние — Главная
switchTab('home');

// ─── Меню (три точки) ──────────────────────────────
const menuBtn  = document.getElementById('menu-btn');
const dropdown = document.getElementById('dropdown');

menuBtn.addEventListener('click', function(e) {
  e.stopPropagation();
  dropdown.hidden = !dropdown.hidden;
});
document.addEventListener('click', function() {
  dropdown.hidden = true;
});

// ─── FAB ───────────────────────────────────────────
document.getElementById('fab-btn').addEventListener('click', function() {
  alert('Добавить — в разработке');
});

// ─── Полоска календаря ─────────────────────────────
var DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
var MONTH_NAMES = ['January','February','March','April','May','June',
                   'July','August','September','October','November','December'];

function buildCalendar(daysId, monthId) {
  var calDays  = document.getElementById(daysId);
  var calMonth = document.getElementById(monthId);

  if (!calDays || !calMonth) {
    console.warn('Calendar elements not found:', daysId, monthId);
    return;
  }

  var today = new Date();
  calMonth.textContent = MONTH_NAMES[today.getMonth()] + ' ' + today.getFullYear();
  calDays.innerHTML = '';

  for (var offset = -3; offset <= 3; offset++) {
    var d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
    var isToday = (offset === 0);

    var el = document.createElement('div');
    el.className = 'cal-day' + (isToday ? ' active' : '');

    var nameEl = document.createElement('span');
    nameEl.className = 'cal-day__name';
    nameEl.textContent = DAY_NAMES[d.getDay()];

    var numEl = document.createElement('span');
    numEl.className = 'cal-day__num';
    numEl.textContent = d.getDate();

    el.appendChild(nameEl);
    el.appendChild(numEl);

    // Клик — переключить активный день
    (function(elem) {
      elem.addEventListener('click', function() {
        calDays.querySelectorAll('.cal-day').forEach(function(c) {
          c.classList.remove('active');
        });
        elem.classList.add('active');
      });
    })(el);

    calDays.appendChild(el);
  }

  // Прокрутить активный день в центр
  setTimeout(function() {
    var active = calDays.querySelector('.cal-day.active');
    if (active) {
      active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, 50);
}

// Строим оба календаря (Главная и Расписание)
buildCalendar('cal-days',   'cal-month');
buildCalendar('cal-days-s', 'cal-month-s');
