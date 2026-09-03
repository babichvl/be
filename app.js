// ─── Telegram ──────────────────────────────────────
var tg = window.Telegram && window.Telegram.WebApp;
if (tg) { tg.expand(); tg.setHeaderColor('#F5F5F7'); }

// ─── Supabase ──────────────────────────────────────
var SUPABASE_URL      = 'https://qhvtapqlyajkikgfacdo.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodnRhcHFseWFqa2lrZ2ZhY2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxNjM3NjEsImV4cCI6MjEwMzczOTc2MX0.hr8Uiy3hvbhwfJ0At7T0TR8waK4Mt5ylFw-B-qp5Cow';
var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── ID тренера ────────────────────────────────────
var trainerTgId = null;

function loadUser() {
  var urlId = new URLSearchParams(window.location.search).get('tg_id');
  try {
    var params   = new URLSearchParams(tg && tg.initData ? tg.initData : '');
    var userJson = params.get('user');
    if (userJson) {
      var u = JSON.parse(userJson);
      trainerTgId = u.id || null;
    } else {
      trainerTgId = urlId ? Number(urlId) : null;
    }
  } catch (e) {
    trainerTgId = urlId ? Number(urlId) : null;
  }
  if (!trainerTgId) trainerTgId = 786441589;
  console.log('[app] trainerTgId =', trainerTgId);
}
loadUser();

// ─── Вкладки ───────────────────────────────────────
var navItems = document.querySelectorAll('.bottomnav__item[data-tab]');
var screens  = document.querySelectorAll('.screen');

function switchTab(tabId) {
  navItems.forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
  screens.forEach(function(s) {
    s.classList.toggle('active', s.id === 'screen-' + tabId);
  });
}
navItems.forEach(function(btn) {
  btn.addEventListener('click', function() { switchTab(btn.dataset.tab); });
});

// ─── FAB ───────────────────────────────────────────
document.getElementById('fab-btn').addEventListener('click', function() {
  alert('Добавить — в разработке');
});

// ─── Расписание ────────────────────────────────────
var CARD_COLORS = ['blue','pink','green','purple'];
var today = new Date();
var selectedHomeDate     = dateToISO(today);
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

function buildCalendar(daysId, monthId, onSelect, state, selectedDate) {
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
    chip.className    = 'cal-day' + (iso === selectedDate ? ' active' : '');
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

// ─── Главная: горизонтальный календарь ─────────────
var homeExpanded = false;
var isScrollingProgrammatically = false;
var scrollEndTimer = null;

function centerDay(element) {
  if (!element) return;
  isScrollingProgrammatically = true;
  element.scrollIntoView({ inline: 'center', block: 'nearest' });
  setTimeout(function() { isScrollingProgrammatically = false; }, 50);
}

function buildHomeCalendar() {
  var wrap = document.getElementById('home-cal-days');
  if (!wrap) return;

  wrap.innerHTML = '';

  var startDate = new Date(today);
  startDate.setDate(today.getDate() - 3);

  for (var i = 0; i < 30; i++) {
    var d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    var iso = dateToISO(d);

    var chip = document.createElement('div');
    chip.className = 'home-cal-day' + (iso === selectedHomeDate ? ' active' : '');
    chip.dataset.date = iso;

    var numEl = document.createElement('span');
    numEl.className   = 'home-cal-day__num';
    numEl.textContent = d.getDate();

    var nameEl = document.createElement('span');
    nameEl.className   = 'home-cal-day__name';
    nameEl.textContent = DAYS[d.getDay()];

    var icon = document.createElement('div');
    icon.className = 'home-cal-day__icon';
    icon.innerHTML = '<svg viewBox="0 0 24 24" fill="white" stroke="none"><path d="M12 2a2 2 0 0 1 2 2c1.7.3 3 1.8 3 3.5V11c0 1.3.8 2.4 2 2.8V15H5v-1.2c1.2-.4 2-1.5 2-2.8V7.5c0-1.7 1.3-3.2 3-3.5a2 2 0 0 1 2-2zm-1 17h2a1 1 0 1 1-2 0z"/></svg>';

    chip.appendChild(numEl);
    chip.appendChild(nameEl);
    chip.appendChild(icon);

    chip.addEventListener('click', (function(isoDate, element) {
      return function() {
        selectedHomeDate = isoDate;
        wrap.querySelectorAll('.home-cal-day').forEach(function(el) {
          el.classList.remove('active');
        });
        element.classList.add('active');
        homeExpanded = true;
        var expand = document.getElementById('home-expand');
        if (expand) expand.classList.add('expanded');
        renderHomeWorkouts();
        requestAnimationFrame(function() {
          requestAnimationFrame(function() { centerDay(element); });
        });
      };
    })(iso, chip));

    wrap.appendChild(chip);
  }

  var activeEl = wrap.querySelector('.home-cal-day.active');
  if (activeEl) {
    requestAnimationFrame(function() { centerDay(activeEl); });
  }

  (function() {
    function getClosestDayToCenter() {
      var wrapRect = wrap.getBoundingClientRect();
      var centerX  = wrapRect.left + wrapRect.width / 2;
      var days     = wrap.querySelectorAll('.home-cal-day');
      var closest  = null;
      var minDist  = Infinity;
      days.forEach(function(el) {
        var rect = el.getBoundingClientRect();
        var dist = Math.abs(rect.left + rect.width / 2 - centerX);
        if (dist < minDist) { minDist = dist; closest = el; }
      });
      return closest;
    }

    function updateActiveDay() {
      var closestDay = getClosestDayToCenter();
      if (closestDay && closestDay.dataset.date !== selectedHomeDate) {
        selectedHomeDate = closestDay.dataset.date;
        wrap.querySelectorAll('.home-cal-day').forEach(function(el) {
          el.classList.remove('active');
        });
        closestDay.classList.add('active');
      }
    }

    function snapToCenter() {
      if (isScrollingProgrammatically) return;
      var closestDay = getClosestDayToCenter();
      if (closestDay) {
        centerDay(closestDay);
        renderHomeWorkouts();
      }
    }

    wrap.addEventListener('scroll', function() {
      requestAnimationFrame(updateActiveDay);
      if (!isScrollingProgrammatically) {
        clearTimeout(scrollEndTimer);
        scrollEndTimer = setTimeout(snapToCenter, 150);
      }
    }, { passive: true });

    updateActiveDay();
  })();

  var expandEl = document.getElementById('home-expand');
  if (expandEl) expandEl.classList.remove('expanded');
}

// ─── Расписание: календарь + стрелки ───────────────
var schedCalState = { offset: 0 };

function rebuildScheduleCalendar() {
  buildCalendar('cal-days-s', 'cal-month-s', function(dateISO) {
    selectedScheduleDate = dateISO;
    renderScheduleWorkouts();
  }, schedCalState, selectedScheduleDate);
}
rebuildScheduleCalendar();

var schedArrowLeft  = document.getElementById('schedule-arrow-left');
var schedArrowRight = document.getElementById('schedule-arrow-right');
if (schedArrowLeft) {
  schedArrowLeft.addEventListener('click', function() {
    schedCalState.offset--;
    rebuildScheduleCalendar();
  });
}
if (schedArrowRight) {
  schedArrowRight.addEventListener('click', function() {
    schedCalState.offset++;
    rebuildScheduleCalendar();
  });
}

// ─── Свайп-действия ────────────────────────────────
var SWIPE_WIDTH = 152; // ширина панели с кнопками
var currentOpenCard = null;

function closeOpenCard() {
  if (currentOpenCard) {
    currentOpenCard.style.transition = 'transform 0.25s ease';
    currentOpenCard.style.transform  = 'translateX(0)';
    currentOpenCard = null;
  }
}

// Закрываем свайп при тапе в другом месте
document.addEventListener('touchstart', function(e) {
  if (currentOpenCard && !currentOpenCard.contains(e.target)) {
    closeOpenCard();
  }
}, { passive: true });

function initSwipes(listEl) {
  listEl.querySelectorAll('.schedule-card').forEach(function(card) {
    var startX, startY, startedOpen, isHoriz = null;

    card.addEventListener('touchstart', function(e) {
      startX      = e.touches[0].clientX;
      startY      = e.touches[0].clientY;
      startedOpen = (currentOpenCard === card);
      isHoriz     = null;
      card.style.transition = 'none';
    }, { passive: true });

    card.addEventListener('touchmove', function(e) {
      var dx = e.touches[0].clientX - startX;
      var dy = e.touches[0].clientY - startY;

      if (isHoriz === null) {
        isHoriz = Math.abs(dx) > Math.abs(dy);
        if (!isHoriz) return;
        // Закрываем другую открытую карточку
        if (currentOpenCard && currentOpenCard !== card) closeOpenCard();
      }
      if (!isHoriz) return;

      e.preventDefault();
      var base = startedOpen ? -SWIPE_WIDTH : 0;
      var x    = Math.min(0, Math.max(-SWIPE_WIDTH, base + dx));
      card.style.transform = 'translateX(' + x + 'px)';
    }, { passive: false });

    card.addEventListener('touchend', function(e) {
      if (!isHoriz) return;

      var dx       = e.changedTouches[0].clientX - startX;
      var base     = startedOpen ? -SWIPE_WIDTH : 0;
      var finalX   = Math.min(0, Math.max(-SWIPE_WIDTH, base + dx));
      var threshold = SWIPE_WIDTH * 0.35;

      card.style.transition = 'transform 0.25s ease';

      if (finalX < -threshold) {
        // Открываем
        card.style.transform = 'translateX(-' + SWIPE_WIDTH + 'px)';
        currentOpenCard = card;
      } else {
        // Закрываем
        card.style.transform = 'translateX(0)';
        if (currentOpenCard === card) currentOpenCard = null;
      }
    });
  });
}

// ─── Шаблон карточки ───────────────────────────────
function buildCardHTML(w, i) {
  var time  = w.start_time ? w.start_time.slice(0, 5) : '--:--';
  var color = CARD_COLORS[i % CARD_COLORS.length];
  var name  = w.client_name || 'Клиент';
  var title = w.title || 'Тренировка';
  var id    = w.id || '';
  return (
    '<div class="schedule-item">' +
      '<div class="swipe-wrapper">' +
        '<div class="swipe-actions">' +
          '<button class="swipe-btn swipe-btn--done"  data-id="' + id + '">✓ Проведена</button>' +
          '<button class="swipe-btn swipe-btn--delete" data-id="' + id + '">🗑 Удалить</button>' +
        '</div>' +
        '<div class="schedule-card schedule-card--' + color + '" data-id="' + id + '">' +
          '<span class="schedule-card__time">'  + time  + '</span>' +
          '<span class="schedule-card__title">' + title + '</span>' +
          '<span class="schedule-card__sub">'   + name  + ' · ' + (w.duration || 60) + ' мин</span>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

// ─── Рендер тренировок ─────────────────────────────
var allWorkouts = [];

function renderHomeWorkouts() {
  var listEl = document.getElementById('home-list');
  if (!listEl) return;

  if (!allWorkouts || !Array.isArray(allWorkouts)) {
    listEl.innerHTML = '<p class="placeholder-text">Загружаем тренировки...</p>';
    return;
  }

  var list = allWorkouts.filter(function(w) {
    return w.workout_date === selectedHomeDate;
  }).sort(function(a, b) {
    return (a.start_time || '').localeCompare(b.start_time || '');
  });

  if (list.length === 0) {
    listEl.innerHTML = '<p class="placeholder-text">На этот день тренировок нет</p>';
    return;
  }

  listEl.innerHTML = list.map(buildCardHTML).join('');
  initSwipes(listEl);
}

function renderScheduleWorkouts() {
  var listEl = document.getElementById('schedule-list');
  if (!listEl) return;

  if (!allWorkouts || !Array.isArray(allWorkouts)) {
    listEl.innerHTML = '<p class="placeholder-text">Загружаем тренировки...</p>';
    return;
  }

  var list = allWorkouts.filter(function(w) {
    return w.workout_date === selectedScheduleDate;
  }).sort(function(a, b) {
    return (a.start_time || '').localeCompare(b.start_time || '');
  });

  if (list.length === 0) {
    listEl.innerHTML = '<p class="placeholder-text">На этот день тренировок нет</p>';
    return;
  }

  listEl.innerHTML = list.map(buildCardHTML).join('');
  initSwipes(listEl);
}

// ─── Инициализация WorkoutsStore ───────────────────
if (trainerTgId && window.WorkoutsStore) {
  WorkoutsStore.subscribe(function(workouts) {
    allWorkouts = workouts;
    console.log('[app] тренировок загружено:', workouts.length);
    renderHomeWorkouts();
    renderScheduleWorkouts();
  });
  WorkoutsStore.init(trainerTgId);
} else {
  console.warn('[app] нет trainerTgId');
  var hint      = 'Откройте через Telegram';
  var homeList  = document.getElementById('home-list');
  var schedList = document.getElementById('schedule-list');
  if (homeList)  homeList.innerHTML  = '<p class="placeholder-text">' + hint + '</p>';
  if (schedList) schedList.innerHTML = '<p class="placeholder-text">' + hint + '</p>';
}

// ─── Запуск главного календаря ─────────────────────
buildHomeCalendar();
