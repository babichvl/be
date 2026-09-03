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
  
  // ВРЕМЕННО: подставь свой Telegram ID для тестирования
  if (!trainerTgId) {
    trainerTgId = 786441589; // <--- ЗАМЕНИ НА СВОЙ ID
  }
  
  console.log('[app] trainerTgId =', trainerTgId);
}
loadUser();

// ─── Вкладки ───────────────────────────────────────
var navItems  = document.querySelectorAll('.bottomnav__item[data-tab]');
var screens   = document.querySelectorAll('.screen');

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
var selectedHomeDate = dateToISO(today);
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

// ─── Главная: горизонтальный календарь (30 дней для свайпа) ─────────────
var homeExpanded = false;
var isScrollingProgrammatically = false;
var scrollEndTimer = null;

// Функция центрирования элемента в контейнере (точное вычисление)
function centerElementInWrap(wrap, element, smooth) {
  if (!wrap || !element) return;

  // Получаем координаты элемента и контейнера относительно viewport
  var wrapRect = wrap.getBoundingClientRect();
  var elRect = element.getBoundingClientRect();

  // Текущий scrollLeft контейнера
  var currentScrollLeft = wrap.scrollLeft;

  // Целевой scrollLeft: элемент должен оказаться по центру контейнера
  var targetScrollLeft = currentScrollLeft + (elRect.left - wrapRect.left) 
                         + (elRect.width / 2) - (wrap.clientWidth / 2);

  // Ограничиваем значения (чтобы не выйти за пределы контента)
  targetScrollLeft = Math.max(0, Math.min(targetScrollLeft, wrap.scrollWidth - wrap.clientWidth));

  // Если разница минимальна, не трогаем
  if (Math.abs(currentScrollLeft - targetScrollLeft) < 1) return;

  if (smooth) {
    isScrollingProgrammatically = true;
    wrap.scrollTo({
      left: targetScrollLeft,
      behavior: 'smooth'
    });
    // Сброс флага после завершения анимации (приблизительно)
    setTimeout(function() {
      isScrollingProgrammatically = false;
    }, 300);
  } else {
    isScrollingProgrammatically = true;
    wrap.scrollLeft = targetScrollLeft;
    isScrollingProgrammatically = false;
  }
}

function buildHomeCalendar() {
  var wrap = document.getElementById('home-cal-days');
  if (!wrap) {
    console.warn('[app] home-cal-days not found');
    return;
  }
  
  wrap.innerHTML = '';
  
  var startDate = new Date(today);
  startDate.setDate(today.getDate() - 3);
  
  for (var i = 0; i < 30; i++) {
    var d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    var iso = dateToISO(d);
    
    var chip = document.createElement('div');
    chip.className = 'home-cal-day';
    
    if (iso === selectedHomeDate) {
      chip.classList.add('active');
    }
    
    chip.dataset.date = iso;
    
    var numEl = document.createElement('span');
    numEl.className = 'home-cal-day__num';
    numEl.textContent = d.getDate();
    
    var nameEl = document.createElement('span');
    nameEl.className = 'home-cal-day__name';
    nameEl.textContent = DAYS[d.getDay()];
    
    var icon = document.createElement('div');
    icon.className = 'home-cal-day__icon';
    icon.innerHTML = '<svg viewBox="0 0 24 24" fill="white" stroke="none"><path d="M12 2a2 2 0 0 1 2 2c1.7.3 3 1.8 3 3.5V11c0 1.3.8 2.4 2 2.8V15H5v-1.2c1.2-.4 2-1.5 2-2.8V7.5c0-1.7 1.3-3.2 3-3.5a2 2 0 0 1 2-2zm-1 17h2a1 1 0 1 1-2 0z"/></svg>';
    
    chip.appendChild(numEl);
    chip.appendChild(nameEl);
    chip.appendChild(icon);
    
    // Обработчик клика
    chip.addEventListener('click', (function(isoDate, element) {
      return function() {
        selectedHomeDate = isoDate;
        
        // Обновляем активный класс
        wrap.querySelectorAll('.home-cal-day').forEach(function(el) {
          el.classList.remove('active');
        });
        element.classList.add('active');
        
        // Раскрываем секцию
        homeExpanded = true;
        var expand = document.getElementById('home-expand');
        if (expand) expand.classList.add('expanded');
        
        renderHomeWorkouts();
        
        // Центрируем выбранный день с плавной прокруткой
        centerElementInWrap(wrap, element, true);
      };
    })(iso, chip));
    
    wrap.appendChild(chip);
  }
  
  // При первой загрузке центрируем выбранный день без анимации
  var activeDay = wrap.querySelector('.home-cal-day.active');
  if (activeDay) {
    // Небольшая задержка, чтобы DOM полностью отрисовался
    setTimeout(function() {
      centerElementInWrap(wrap, activeDay, false);
    }, 50);
  }
  
  console.log('[app] home calendar built, 30 days, selected:', selectedHomeDate);
}

buildHomeCalendar();

// ─── Карусель: обновление активного дня и доводка до центра ───
(function() {
  var wrap = document.getElementById('home-cal-days');
  if (!wrap) return;
  
  var lastActiveDay = null;
  
  function getClosestDayToCenter() {
    var containerCenter = wrap.scrollLeft + (wrap.clientWidth / 2);
    var closestDay = null;
    var minDistance = Infinity;
    
    var days = wrap.querySelectorAll('.home-cal-day');
    for (var i = 0; i < days.length; i++) {
      var day = days[i];
      var dayCenter = day.offsetLeft + (day.offsetWidth / 2);
      var distance = Math.abs(containerCenter - dayCenter);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestDay = day;
      }
    }
    return closestDay;
  }
  
  function updateActiveDay() {
    var closestDay = getClosestDayToCenter();
    
    if (closestDay && closestDay !== lastActiveDay) {
      lastActiveDay = closestDay;
      
      wrap.querySelectorAll('.home-cal-day').forEach(function(day) {
        day.classList.remove('active');
      });
      
      closestDay.classList.add('active');
      
      // Обновляем контент при смене активного дня
      var newDate = closestDay.dataset.date;
      if (newDate !== selectedHomeDate) {
        selectedHomeDate = newDate;
        homeExpanded = true;
        var expand = document.getElementById('home-expand');
        if (expand) expand.classList.add('expanded');
        renderHomeWorkouts();
      }
    }
  }
  
  // Доводка: после остановки прокрутки корректируем позицию, чтобы ближайший день был точно по центру
  function snapToCenter() {
    if (isScrollingProgrammatically) return; // не мешаем программной прокрутке
    
    var closestDay = getClosestDayToCenter();
    if (closestDay) {
      // Вызываем centerElementInWrap, но только если расхождение заметное
      var wrapRect = wrap.getBoundingClientRect();
      var elRect = closestDay.getBoundingClientRect();
      var currentScrollLeft = wrap.scrollLeft;
      var targetScrollLeft = currentScrollLeft + (elRect.left - wrapRect.left) 
                             + (elRect.width / 2) - (wrap.clientWidth / 2);
      
      targetScrollLeft = Math.max(0, Math.min(targetScrollLeft, wrap.scrollWidth - wrap.clientWidth));
      
      if (Math.abs(currentScrollLeft - targetScrollLeft) > 2) {
        isScrollingProgrammatically = true;
        wrap.scrollTo({
          left: targetScrollLeft,
          behavior: 'smooth'
        });
        setTimeout(function() {
          isScrollingProgrammatically = false;
        }, 300);
      }
    }
  }
  
  wrap.addEventListener('scroll', function() {
    // Обновляем активный день сразу
    requestAnimationFrame(updateActiveDay);
    
    // Если прокрутка не программная, запускаем таймер доводки после остановки
    if (!isScrollingProgrammatically) {
      clearTimeout(scrollEndTimer);
      scrollEndTimer = setTimeout(snapToCenter, 150);
    }
  }, { passive: true });
  
  // Инициализация
  updateActiveDay();
})();

var expandEl = document.getElementById('home-expand');
if (expandEl) expandEl.classList.remove('expanded');

// ─── Расписание: календарь + стрелки ───────────────
var schedCalState = { offset: 0 };

function rebuildScheduleCalendar() {
  buildCalendar('cal-days-s', 'cal-month-s', function(dateISO) {
    selectedScheduleDate = dateISO;
    renderScheduleWorkouts();
  }, schedCalState, selectedScheduleDate);
}
rebuildScheduleCalendar();

var schedArrowLeft = document.getElementById('schedule-arrow-left');
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

// ─── Рендер тренировок ─────────────────────────────
var allWorkouts = [];

function renderHomeWorkouts() {
  var listEl = document.getElementById('home-list');
  if (!listEl) return;

  var list = allWorkouts.filter(function(w) {
    return w.workout_date === selectedHomeDate;
  }).sort(function(a,b) {
    return (a.start_time || '').localeCompare(b.start_time || '');
  });

  if (list.length === 0) {
    listEl.innerHTML = '<p class="placeholder-text">На этот день тренировок нет</p>';
    return;
  }

  listEl.innerHTML = list.map(function(w, i) {
    var time  = w.start_time ? w.start_time.slice(0, 5) : '--:--';
    var color = CARD_COLORS[i % CARD_COLORS.length];
    var name  = w.client_name || 'Клиент';
    var title = w.title || 'Тренировка';
    return (
      '<div class="schedule-row">' +
        '<div class="schedule-time">' + time + '</div>' +
        '<div class="schedule-card schedule-card--' + color + '">' +
          '<span class="schedule-card__title">' + title + '</span>' +
          '<span class="schedule-card__sub">' + name + ' · ' + (w.duration || 60) + ' мин</span>' +
        '</div>' +
      '</div>'
    );
  }).join('');
}

function renderScheduleWorkouts() {
  var listEl = document.getElementById('schedule-list');
  if (!listEl) return;

  var list = allWorkouts.filter(function(w) {
    return w.workout_date === selectedScheduleDate;
  }).sort(function(a,b) {
    return (a.start_time || '').localeCompare(b.start_time || '');
  });

  if (list.length === 0) {
    listEl.innerHTML = '<p class="placeholder-text">На этот день тренировок нет</p>';
    return;
  }

  listEl.innerHTML = list.map(function(w, i) {
    var time  = w.start_time ? w.start_time.slice(0, 5) : '--:--';
    var color = CARD_COLORS[i % CARD_COLORS.length];
    var name  = w.client_name || 'Клиент';
    var title = w.title || 'Тренировка';
    return (
      '<div class="schedule-row">' +
        '<div class="schedule-time">' + time + '</div>' +
        '<div class="schedule-card schedule-card--' + color + '">' +
          '<span class="schedule-card__title">' + title + '</span>' +
          '<span class="schedule-card__sub">' + name + ' · ' + (w.duration || 60) + ' мин</span>' +
        '</div>' +
      '</div>'
    );
  }).join('');
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
  var hint = 'Откройте через Telegram';
  var homeList = document.getElementById('home-list');
  var schedList = document.getElementById('schedule-list');
  if (homeList) homeList.innerHTML = '<p class="placeholder-text">' + hint + '</p>';
  if (schedList) schedList.innerHTML = '<p class="placeholder-text">' + hint + '</p>';
}

renderHomeWorkouts();
renderScheduleWorkouts();
