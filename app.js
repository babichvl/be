// ─── Telegram ──────────────────────────────────────
var tg = window.Telegram && window.Telegram.WebApp;
if (tg) { tg.expand(); tg.setHeaderColor('#FFFFFF'); }

// ─── Supabase (только публичный anon key) ──────────
var SUPABASE_URL      = 'https://qhvtapqlyajkikgfacdo.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodnRhcHFseWFqa2lrZ2ZhY2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxNjM3NjEsImV4cCI6MjEwMzczOTc2MX0.hr8Uiy3hvbhwfJ0At7T0TR8waK4Mt5ylFw-B-qp5Cow';

var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── ID тренера (из Telegram или фоллбэк для теста) ─
var trainerTgId = null;

function loadUser() {
  var nameEl = document.getElementById('user-name');
  try {
    var params   = new URLSearchParams(tg && tg.initData ? tg.initData : '');
    var userJson = params.get('user');
    if (userJson) {
      var u = JSON.parse(userJson);
      if (nameEl) nameEl.textContent = u.first_name || 'Тренер';
      trainerTgId = u.id || null;
    } else {
      if (nameEl) nameEl.textContent = 'Тренер';
      trainerTgId = 111111; // фоллбэк для теста в браузере
    }
  } catch (e) {
    if (nameEl) nameEl.textContent = 'Тренер';
    trainerTgId = 111111;
  }
}
loadUser();

// ─── Вкладки ───────────────────────────────────────
var TAB_TITLES = {
  home:     'Главная',
  schedule: 'Расписание',
  clients:  'Клиенты',
  programs: 'Программы'
};

var navItems  = document.querySelectorAll('.bottomnav__item[data-tab]');
var screens   = document.querySelectorAll('.screen');
var pageTitle = document.getElementById('page-title');

function switchTab(tabId) {
  navItems.forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
  screens.forEach(function(s) {
    s.classList.toggle('active', s.id === 'screen-' + tabId);
  });
  if (pageTitle) pageTitle.textContent = TAB_TITLES[tabId] || 'Главная';

  // при открытии расписания — загружаем тренировки на выбранный день
  if (tabId === 'schedule') {
    loadWorkouts(selectedScheduleDate, trainerTgId);
  }
}

navItems.forEach(function(btn) {
  btn.addEventListener('click', function() {
    switchTab(btn.dataset.tab);
  });
});

switchTab('home');

// ─── Меню ──────────────────────────────────────────
var menuBtn  = document.getElementById('menu-btn');
var dropdown = document.getElementById('dropdown');

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

// ─── Расписание: загрузка из Supabase ──────────────
var CARD_COLORS = ['blue', 'pink', 'green', 'purple'];

// текущая выбранная дата в расписании (ISO: "2026-09-02")
var today = new Date();
var selectedScheduleDate = dateToISO(today);

function dateToISO(date) {
  var y = date.getFullYear();
  var m = String(date.getMonth() + 1).padStart(2, '0');
  var d = String(date.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

async function loadWorkouts(dateStr, tgId) {
  var listEl = document.getElementById('schedule-list');
  if (!listEl) return;

  listEl.innerHTML = '<p class="placeholder-text">Загружаем...</p>';

  if (!tgId) {
    listEl.innerHTML = '<p class="placeholder-text">Нет ID тренера</p>';
    return;
  }

  var result = await sb
    .from('workouts')
    .select('title, client_name, workout_date, start_time, duration')
    .eq('trainer_tg_id', tgId)
    .eq('workout_date', dateStr)
    .order('start_time');

  if (result.error) {
    console.error('Supabase error:', result.error);
    listEl.innerHTML = '<p class="placeholder-text">Ошибка загрузки данных</p>';
    return;
  }

  var rows = result.data;

  if (!rows || rows.length === 0) {
    listEl.innerHTML = '<p class="placeholder-text">На этот день тренировок нет</p>';
    return;
  }

  listEl.innerHTML = rows.map(function(w, i) {
    var time  = w.start_time ? w.start_time.slice(0, 5) : '--:--';
    var color = CARD_COLORS[i % CARD_COLORS.length];
    var sub   = (w.client_name || '') + ' · ' + (w.duration || 60) + ' мин';
    return (
      '<div class="schedule-row">' +
        '<div class="schedule-time">' + time + '</div>' +
        '<div class="schedule-card card schedule-card--' + color + '">' +
          '<span class="schedule-card__title">' + (w.title || 'Тренировка') + '</span>' +
          '<span class="schedule-card__sub">' + sub + '</span>' +
        '</div>' +
      '</div>'
    );
  }).join('');
}

// ─── Календарь ─────────────────────────────────────
var DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
var MONTHS = ['January','February','March','April','May','June',
              'July','August','September','October','November','December'];

// onSelect(dateISO) — опциональный колбэк при выборе дня
function buildCalendar(daysId, monthId, onSelect) {
  var wrap  = document.getElementById(daysId);
  var label = document.getElementById(monthId);
  if (!wrap || !label) return;

  var refDate = new Date();
  label.textContent = MONTHS[refDate.getMonth()] + ' ' + refDate.getFullYear();
  wrap.innerHTML = '';

  for (var i = -3; i <= 3; i++) {
    var date = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() + i);
    var iso  = dateToISO(date);

    var chip = document.createElement('div');
    chip.className  = 'cal-day' + (i === 0 ? ' active' : '');
    chip.dataset.date = iso;

    var nameEl = document.createElement('span');
    nameEl.className   = 'cal-day__name';
    nameEl.textContent = DAYS[date.getDay()];

    var numEl = document.createElement('span');
    numEl.className   = 'cal-day__num';
    numEl.textContent = date.getDate();

    chip.appendChild(nameEl);
    chip.appendChild(numEl);

    chip.addEventListener('click', (function(el, d) {
      return function() {
        wrap.querySelectorAll('.cal-day').forEach(function(c) {
          c.classList.remove('active');
        });
        el.classList.add('active');
        if (onSelect) onSelect(d);
      };
    })(chip, iso));

    wrap.appendChild(chip);
  }

  var active = wrap.querySelector('.cal-day.active');
  if (active) active.scrollIntoView({ inline: 'center', block: 'nearest' });
}

// Главная — без колбэка, только визуал
buildCalendar('cal-days', 'cal-month');

// Расписание — при выборе дня грузим тренировки
buildCalendar('cal-days-s', 'cal-month-s', function(dateISO) {
  selectedScheduleDate = dateISO;
  loadWorkouts(dateISO, trainerTgId);
});
