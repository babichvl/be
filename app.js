// ─── Telegram ──────────────────────────────────────
var tg = window.Telegram && window.Telegram.WebApp;
if (tg) { tg.expand(); tg.setHeaderColor('#FFFFFF'); }

// ─── Supabase ──────────────────────────────────────
var SUPABASE_URL      = 'https://qhvtapqlyajkikgfacdo.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodnRhcHFseWFqa2lrZ2ZhY2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxNjM3NjEsImV4cCI6MjEwMzczOTc2MX0.hr8Uiy3hvbhwfJ0At7T0TR8waK4Mt5ylFw-B-qp5Cow';
var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── ID тренера ────────────────────────────────────
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
      trainerTgId = 786441589;
    }
  } catch (e) {
    if (nameEl) nameEl.textContent = 'Тренер';
    trainerTgId = 786441589;
  }
}
loadUser();

// ─── Вкладки ───────────────────────────────────────
var TAB_TITLES = { home:'Главная', schedule:'Расписание', clients:'Клиенты', programs:'Программы' };
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
}

navItems.forEach(function(btn) {
  btn.addEventListener('click', function() { switchTab(btn.dataset.tab); });
});
switchTab('home');

// ─── Меню ──────────────────────────────────────────
var menuBtn  = document.getElementById('menu-btn');
var dropdown = document.getElementById('dropdown');
menuBtn.addEventListener('click', function(e) {
  e.stopPropagation();
  dropdown.hidden = !dropdown.hidden;
});
document.addEventListener('click', function() { dropdown.hidden = true; });

// ─── FAB ───────────────────────────────────────────
document.getElementById('fab-btn').addEventListener('click', function() {
  alert('Добавить — в разработке');
});

// ─── Расписание ────────────────────────────────────
var CARD_COLORS = ['blue','pink','green','purple'];
var today = new Date();
var selectedScheduleDate = dateToISO(today);

function dateToISO(date) {
  var y = date.getFullYear();
  var m = String(date.getMonth() + 1).padStart(2, '0');
  var d = String(date.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

// ─── Календарь ─────────────────────────────────────
var DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
var MONTHS = ['January','February','March','April','May','June',
              'July','August','September','October','November','December'];

function buildCalendar(daysId, monthId, onSelect, state) {
  var wrap  = document.getElementById(daysId);
  var label = document.getElementById(monthId);
  if (!wrap || !label) return;

  var ref = new Date(today.getFullYear(), today.getMonth() + state.offset, 1);
  label.textContent = MONTHS[ref.getMonth()] + ' ' + ref.getFullYear();
  wrap.innerHTML = '';

  var daysInMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
  for (var d = 1; d <= daysInMonth; d++) {
    var date = new Date(ref.getFullYear(), ref.getMonth(), d);
    var iso  = dateToISO(date);

    var chip = document.createElement('div');
    chip.className    = 'cal-day' + (iso === selectedScheduleDate ? ' active' : '');
    chip.dataset.date = iso;

    var nameEl = document.createElement('span');
    nameEl.className   = 'cal-day__name';
    nameEl.textContent = DAYS[date.getDay()];

    var numEl = document.createElement('span');
    numEl.className   = 'cal-day__num';
    numEl.textContent = d;

    chip.appendChild(nameEl);
    chip.appendChild(numEl);

    chip.addEventListener('click', (function(el, isoDate) {
      return function() {
        wrap.querySelectorAll('.cal-day').forEach(function(c) { c.classList.remove('active'); });
        el.classList.add('active');
        if (onSelect) onSelect(isoDate);
      };
    })(chip, iso));

    wrap.appendChild(chip);
  }

  var active = wrap.querySelector('.cal-day.active') || wrap.querySelector('.cal-day');
  if (active) active.scrollIntoView({ inline: 'center', block: 'nearest' });
}

// ─── Главная: календарь + стрелки ──────────────────
var homeCalState = { offset: 0 };
var selectedHomeDate = dateToISO(today);

function rebuildHomeCalendar() {
  buildCalendar('cal-days', 'cal-month', function(dateISO) {
    selectedHomeDate = dateISO;
    if (window.WorkoutsStore) WorkoutsStore.refresh();
  }, homeCalState);
}
rebuildHomeCalendar();

document.querySelector('#screen-home .calendar-strip__arrow:first-child')
  .addEventListener('click', function() { homeCalState.offset--; rebuildHomeCalendar(); });
document.querySelector('#screen-home .calendar-strip__arrow:last-child')
  .addEventListener('click', function() { homeCalState.offset++; rebuildHomeCalendar(); });

// ─── Расписание: календарь + стрелки ───────────────
var schedCalState = { offset: 0 };

function rebuildScheduleCalendar() {
  buildCalendar('cal-days-s', 'cal-month-s', function(dateISO) {
    selectedScheduleDate = dateISO;
    if (window.WorkoutsStore) WorkoutsStore.refresh();
  }, schedCalState);
}
rebuildScheduleCalendar();

document.querySelector('#screen-schedule .calendar-strip__arrow:first-child')
  .addEventListener('click', function() { schedCalState.offset--; rebuildScheduleCalendar(); });
document.querySelector('#screen-schedule .calendar-strip__arrow:last-child')
  .addEventListener('click', function() { schedCalState.offset++; rebuildScheduleCalendar(); });

// ─── Рендер тренировок ─────────────────────────────

function renderHomeWorkouts(workouts) {
  var container = document.getElementById('home-workouts-list');
  if (!container) return;

  var list = workouts.filter(function(w) {
    return w.workout_date === selectedHomeDate;
  }).sort(function(a, b) {
    var aTime = new Date(a.workout_date + 'T' + a.start_time).getTime();
    var bTime = new Date(b.workout_date + 'T' + b.start_time).getTime();
    return aTime - bTime;
  }).slice(0, 5);

  if (upcoming.length === 0) {
    container.innerHTML = '<div class="empty-workouts">Ближайших тренировок нет</div>';
    return;
  }

  container.innerHTML = upcoming.map(function(w) {
    var time = w.start_time ? w.start_time.slice(0, 5) : '--:--';
    var name = w.client_name || 'Клиент';
    var duration = w.duration || 60;
    var type = w.title || 'Тренировка';
    
    return (
      '<div class="workout-item">' +
        '<div class="workout-time">' + time + '</div>' +
        '<div class="workout-info">' +
          '<div class="workout-client">' + name + '</div>' +
          '<div class="workout-meta">' + type + ' · ' + duration + ' мин</div>' +
        '</div>' +
      '</div>'
    );
  }).join('');
}

function renderScheduleWorkouts(workouts) {
  var listEl = document.getElementById('schedule-list');
  if (!listEl) return;

  var list = workouts.filter(function(w) {
    return w.workout_date === selectedScheduleDate;
  }).sort(function(a, b) {
    return (a.start_time || '').localeCompare(b.start_time || '');
  });

if (list.length === 0) {
  container.innerHTML = '<div class="empty-workouts">На этот день тренировок нет</div>';
  return;
}

container.innerHTML = list.map(function(w) {

  listEl.innerHTML = list.map(function(w, i) {
    var time = w.start_time ? w.start_time.slice(0, 5) : '--:--';
    var color = CARD_COLORS[i % CARD_COLORS.length];
    var name = w.client_name || 'Клиент';
    var title = w.title || 'Тренировка';
    return (
      '<div class="schedule-row">' +
        '<div class="schedule-time">' + time + '</div>' +
        '<div class="schedule-card card schedule-card--' + color + '">' +
          '<span class="schedule-card__title">' + title + '</span>' +
          '<span class="schedule-card__sub">' + name + ' · ' + (w.duration || 60) + ' мин</span>' +
        '</div>' +
      '</div>'
    );
  }).join('');
}

// ─── Инициализация WorkoutsStore ───────────────────

if (trainerTgId && window.WorkoutsStore) {
  WorkoutsStore.init(trainerTgId).then(function() {
    console.log('[app] WorkoutsStore инициализирован');
  });

  WorkoutsStore.subscribe(function(workouts) {
    renderHomeWorkouts(workouts);
    renderScheduleWorkouts(workouts);
  });
}
