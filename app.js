// ═══════════════════════════════════════════════════════════
// APP.JS — интерфейс НЕЗАВИСИМ от БД
// ═══════════════════════════════════════════════════════════

// ─── Telegram ──────────────────────────────────────────────────────────
var tg = window.Telegram && window.Telegram.WebApp;
if (tg) { 
  tg.expand(); 
  tg.setHeaderColor('#F5F5F7');
  // Отключаем вертикальный свайп для закрытия приложения
  tg.disableVerticalSwipes();
}

// ─── Supabase (инициализируется в фоне) ────────────
var SUPABASE_URL      = 'https://qhvtapqlyajkikgfacdo.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodnRhcHFseWFqa2lrZ2ZhY2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxNjM3NjEsImV4cCI6MjEwMzczOTc2MX0.hr8Uiy3hvbhwfJ0At7T0TR8waK4Mt5ylFw-B-qp5Cow';
var sb = null;

// Инициализируем Supabase с повторными попытками
function initSupabase() {
  console.log('[app.js] Попытка инициализации Supabase...', {
    'window.supabase': !!window.supabase,
    'window.supabase.createClient': !!(window.supabase && window.supabase.createClient)
  });
  
  if (window.supabase && window.supabase.createClient) {
    try {
      sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('[app.js] ✅ Supabase инициализирован успешно');
      return true;
    } catch (e) {
      console.error('[app.js] Ошибка инициализации Supabase:', e);
      return false;
    }
  }
  return false;
}

// Агрессивные попытки загрузки
var attemptCount = 0;
var maxAttempts = 10;

function tryInitSupabase() {
  attemptCount++;
  if (initSupabase()) {
    return; // Успешно!
  }
  
  if (attemptCount < maxAttempts) {
    var delay = Math.min(100 * attemptCount, 2000);
    console.log('[app.js] Повторная попытка ' + attemptCount + '/' + maxAttempts + ' через ' + delay + 'ms');
    setTimeout(tryInitSupabase, delay);
  } else {
    console.warn('[app.js] ⚠️ Supabase не загружен, но интерфейс работает автономно');
  }
}

tryInitSupabase();

// Первая попытка через 100ms
setTimeout(function() {
  if (!initSupabase()) {
    // Вторая попытка через 500ms
    setTimeout(function() {
      if (!initSupabase()) {
        // Третья попытка через 1s
        setTimeout(function() {
          if (!initSupabase()) {
            console.error('[app.js] ❌ Не удалось инициализировать Supabase после 3 попыток');
          }
        }, 1000);
      }
    }, 500);
  }
}, 100);

// ─── Локальный кэш ─────────────────────────────────
var localDeletedIds = {};
var localDoneIds    = {};

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
  console.log('[app.js] Trainer ID:', trainerTgId);
}
loadUser();

// ═══════════════════════════════════════════════════════════
// ОСНОВНОЕ ПРИЛОЖЕНИЕ - ЗАПУСКАЕТСЯ СРАЗУ, БЕЗ ОЖИДАНИЯ БД
// ═══════════════════════════════════════════════════════════

// ─── Вкладки (главная навигация) ────────────────────
var navItems = document.querySelectorAll('.bottomnav__item[data-tab]');
var screens  = document.querySelectorAll('.screen');

function switchTab(tabId) {
  navItems.forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
  screens.forEach(function(s) {
    s.classList.toggle('active', s.id === 'screen-' + tabId);
  });
  console.log('[app.js] Switched to tab:', tabId);
}

navItems.forEach(function(btn) {
  btn.addEventListener('click', function() { 
    switchTab(btn.dataset.tab); 
  });
});

console.log('[app.js] ✅ Вкладки инициализированы');

// ─── Подвкладки Клиентов ──────────────────────────
var clientsTabs = document.querySelectorAll('.clients-tab');
var clientsSubtabs = document.querySelectorAll('.clients-subtab');

console.log('[app.js] clients-tabs найдено:', clientsTabs.length);
console.log('[app.js] clients-subtabs найдено:', clientsSubtabs.length);

clientsTabs.forEach(function(tab) {
  tab.addEventListener('click', function() {
    var subtab = this.dataset.subtab;
    console.log('[app.js] Clients subtab clicked:', subtab);
    
    clientsTabs.forEach(function(t) { t.classList.remove('active'); });
    this.classList.add('active');
    
    clientsSubtabs.forEach(function(v) {
      var shouldShow = v.id === 'clients-subtab-' + subtab;
      v.classList.toggle('active', shouldShow);
    });
  });
});

console.log('[app.js] ✅ Подвкладки клиентов инициализированы');

// ─── FAB кнопка ────────────────────────────────────
var fabBtn = document.getElementById('fab-btn');
if (fabBtn) {
  fabBtn.addEventListener('click', function() {
    alert('ИИ-ассистент — в разработке');
  });
  console.log('[app.js] ✅ FAB кнопка инициализирована');
}

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

// ─── Главная: горизонтальный календарь ────────────
var homeExpanded = false;
var isScrollingProgrammatically = false;

function centerDay(element) {
  if (!element) return;
  isScrollingProgrammatically = true;
  element.scrollIntoView({ inline: 'center', block: 'nearest' });
  setTimeout(function() { isScrollingProgrammatically = false; }, 50);
}

function initHomeCalendarSwipes() {
  var wrap = document.getElementById('home-cal-days');
  if (!wrap) return;

  var startX = 0;
  var isDragging = false;
  var swipeStarted = false;

  wrap.addEventListener('touchstart', function(e) {
    startX = e.touches[0].clientX;
    isDragging = true;
    swipeStarted = false;
  }, { passive: true });

  wrap.addEventListener('touchmove', function(e) {
    if (!isDragging) return;
    var currentX = e.touches[0].clientX;
    var delta = startX - currentX;
    if (Math.abs(delta) > 10) {
      swipeStarted = true; // Флаг: идёт активный свайп
    }
  }, { passive: true });

  wrap.addEventListener('touchend', function(e) {
    if (!isDragging) return;
    isDragging = false;

    var endX = e.changedTouches[0].clientX;
    var delta = startX - endX;
    var threshold = 30;

    if (Math.abs(delta) < threshold) return;

    var activeEl = wrap.querySelector('.home-cal-day.active');
    if (!activeEl) return;

    var targetEl = null;

    if (delta > threshold) {
      targetEl = activeEl.nextElementSibling;
    } else if (delta < -threshold) {
      targetEl = activeEl.previousElementSibling;
    }

    if (!targetEl) return;

    var newDate = targetEl.dataset.date;
    selectedHomeDate = newDate;

    wrap.querySelectorAll('.home-cal-day').forEach(function(el) {
      el.classList.remove('active');
    });
    targetEl.classList.add('active');

    homeExpanded = true;
    var expand = document.getElementById('home-expand');
    if (expand) expand.classList.add('expanded');

    renderHomeWorkouts();
    targetEl.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, { passive: true });

  // Отключаем клик при свайпе
  wrap.addEventListener('click', function(e) {
    if (swipeStarted) {
      e.stopPropagation();
      swipeStarted = false;
    }
  }, true); // Capture phase!
}

// ─── Главная: горизонтальный календарь ────────────
var homeExpanded = false;
var isScrollingProgrammatically = false;

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
  // ... весь код ...

  var activeEl = wrap.querySelector('.home-cal-day.active');
  if (activeEl) {
    requestAnimationFrame(function() { centerDay(activeEl); });
  }
  
  initHomeCalendarSwipes(); // ✅ ВЫЗОВ В КОНЦЕ
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

  initHomeCalendarSwipes(); // ✅ ЭТА СТРОКА
}

// ─── Расписание: календарь ─────────────────────────
var scheduleState = { offset: 0 };

function rebuildScheduleCalendar() {
  buildCalendar('cal-days-s', 'cal-month-s', function(iso) {
    selectedScheduleDate = iso;
    renderScheduleWorkouts();
  }, scheduleState, selectedScheduleDate);
}

// ─── Свайп и действия ──────────────────────────────
var currentOpenCard = null;

function closeOpenCard() {
  if (!currentOpenCard) return;
  var card = currentOpenCard.querySelector('.schedule-card');
  if (card) {
    card.style.transition = 'transform 0.25s ease';
    card.style.transform  = 'translateX(0)';
  }
  currentOpenCard = null;
}

function markDone(workoutId, itemEl) {
  if (!workoutId || !sb) return;
  var id = String(workoutId);

  localDoneIds[id] = true;

  allWorkouts = allWorkouts.map(function(w) {
    if (String(w.id) === id) return Object.assign({}, w, { status: 'done' });
    return w;
  });

  var card = itemEl.querySelector('.schedule-card');
  if (card) {
    card.className = 'schedule-card schedule-card--done';
    var timeEl = card.querySelector('.schedule-card__time');
    if (timeEl) timeEl.style.display = 'none';
    if (!card.querySelector('.schedule-card__check')) {
      var check = document.createElement('span');
      check.className   = 'schedule-card__check';
      check.textContent = '✓';
      card.appendChild(check);
    }
    card.style.transition = 'transform 0.25s ease';
    card.style.transform  = 'translateX(0)';
  }
  currentOpenCard = null;

  if (sb) {
    sb.from('workouts')
      .update({ 
        status: 'done',
        updated_at_supabase: new Date().toISOString()
      })
      .eq('id', workoutId)
      .then(function(res) {
        if (!res.error) {
          delete localDoneIds[id];
        }
      });
  }
}

function deleteWorkout(workoutId, itemEl) {
  if (!workoutId) return;
  var id = String(workoutId);

  localDeletedIds[id] = true;

  allWorkouts = allWorkouts.filter(function(w) {
    return String(w.id) !== id;
  });

  itemEl.style.transition = 'opacity 0.25s ease, max-height 0.3s ease';
  itemEl.style.overflow   = 'hidden';
  itemEl.style.maxHeight  = itemEl.offsetHeight + 'px';
  itemEl.style.opacity    = '0';
  requestAnimationFrame(function() { itemEl.style.maxHeight = '0'; });
  setTimeout(function() { itemEl.remove(); }, 300);
  currentOpenCard = null;

  if (sb) {
    sb.from('workouts')
      .update({ 
        deleted: true,
        updated_at_supabase: new Date().toISOString()
      })
      .eq('id', workoutId)
      .then(function(res) {
        if (!res.error) {
          delete localDeletedIds[id];
        }
      });
  }
}

function applyLocalCache(workouts) {
  return workouts
    .filter(function(w) {
      return !localDeletedIds[String(w.id)];
    })
    .map(function(w) {
      if (localDoneIds[String(w.id)]) {
        return Object.assign({}, w, { status: 'done' });
      }
      return w;
    });
}

function initSwipes(container) {
  var items = container.querySelectorAll('.schedule-item');
  
  items.forEach(function(item) {
    var card = item.querySelector('.schedule-card');
    if (!card) return;

    var startX = 0;
    var currentX = 0;
    var isDragging = false;
    var threshold = 50;

    card.addEventListener('touchstart', function(e) {
      if (currentOpenCard && currentOpenCard !== item) closeOpenCard();
      startX = e.touches[0].clientX;
      isDragging = true;
    }, { passive: true });

    card.addEventListener('touchmove', function(e) {
      if (!isDragging) return;
      currentX = e.touches[0].clientX;
      var delta = startX - currentX;
      if (delta > 0 && delta < 152) {
        card.style.transition = 'none';
        card.style.transform = 'translateX(' + (-delta) + 'px)';
      }
    }, { passive: true });

    card.addEventListener('touchend', function() {
      if (!isDragging) return;
      isDragging = false;
      var delta = startX - currentX;
      if (delta > threshold) {
        card.style.transition = 'transform 0.25s ease';
        card.style.transform = 'translateX(-152px)';
        currentOpenCard = item;
      } else {
        card.style.transition = 'transform 0.25s ease';
        card.style.transform = 'translateX(0)';
        currentOpenCard = null;
      }
    });
  });

  var doneBtns = container.querySelectorAll('.swipe-btn--done');
  doneBtns.forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var workoutId = this.dataset.id;
      if (workoutId) {
        var item = this.closest('.schedule-item');
        markDone(workoutId, item);
      }
    });
  });

  var deleteBtns = container.querySelectorAll('.swipe-btn--delete');
  deleteBtns.forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var workoutId = this.dataset.id;
      if (workoutId) {
        var item = this.closest('.schedule-item');
        deleteWorkout(workoutId, item);
      }
    });
  });
}

function buildCardHTML(w, index) {
  var time   = w.start_time ? w.start_time.slice(0, 5) : '--:--';
  var color  = CARD_COLORS[index % CARD_COLORS.length];
  var name   = w.client_name || 'Клиент';
  var title  = w.title || 'Тренировка';
  var id     = w.id || '';
  var isDone = w.status === 'done';
  
  return (
    '<div class="schedule-item">' +
      '<div class="swipe-wrapper">' +
        '<div class="swipe-actions">' +
          '<button class="swipe-btn swipe-btn--done"   data-id="' + id + '">✓<br>Проведена</button>' +
          '<button class="swipe-btn swipe-btn--delete" data-id="' + id + '">✕<br>Удалить</button>' +
        '</div>' +
        '<div class="schedule-card ' + (isDone ? 'schedule-card--done' : 'schedule-card--' + color) + '" data-id="' + id + '">' +
          (isDone ? '' : '<span class="schedule-card__time">' + time + '</span>') +
          '<span class="schedule-card__title">' + title + '</span>' +
          '<span class="schedule-card__sub">'   + name  + ' · ' + (w.duration || 60) + ' мин</span>' +
          (isDone ? '<span class="schedule-card__check">✓</span>' : '') +
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

// ─── Инициализация хранилищ (с гарантией загрузки) ────────────
function initStores() {
  var attempt = 0;
  var maxAttempts = 50;

  function checkAndInit() {
    attempt++;
    
    console.log('[app.js] Попытка инициализации ' + attempt + '/' + maxAttempts);
    console.log('[app.js] Проверка:', {
      'sb': !!window.sb,
      'WorkoutsStore': !!window.WorkoutsStore,
      'ClientsStore': !!window.ClientsStore,
      'TriggersStore': !!window.TriggersStore
    });

    // Если все есть — инициализируем
    if (window.sb && window.WorkoutsStore && window.ClientsStore && window.TriggersStore) {
      console.log('[app.js] ✅ ВСЕ ЗАВИСИМОСТИ ГОТОВЫ!');
      
      if (trainerTgId && window.WorkoutsStore) {
        WorkoutsStore.subscribe(function(workouts) {
          allWorkouts = applyLocalCache(workouts);
          renderHomeWorkouts();
          renderScheduleWorkouts();
        });
        WorkoutsStore.init(trainerTgId);
        console.log('[app.js] ✅ WorkoutsStore инициализирован');
      }

      if (trainerTgId && window.ClientsStore) {
        ClientsStore.init(trainerTgId);
        console.log('[app.js] ✅ ClientsStore инициализирован');
      }

      if (trainerTgId && window.TriggersStore) {
        TriggersStore.init(trainerTgId);
        console.log('[app.js] ✅ TriggersStore инициализирован');
      }

      if (window.ClientsUI) {
        ClientsUI.init();
        console.log('[app.js] ✅ ClientsUI инициализирован');
      }

      if (window.TriggersUI) {
        TriggersUI.init();
        console.log('[app.js] ✅ TriggersUI инициализирован');
      }

      if (window.CalendarScheduler) {
        CalendarScheduler.init('calendar-scheduler', today);
        
        if (trainerTgId && window.WorkoutsStore) {
          WorkoutsStore.subscribe(function(workouts) {
            allWorkouts = applyLocalCache(workouts);
            renderHomeWorkouts();
            renderScheduleWorkouts();
            CalendarScheduler.updateWorkouts(allWorkouts);
          });
        }
        console.log('[app.js] ✅ CalendarScheduler инициализирован');
      }

      if (window.WorkoutModal) {
        WorkoutModal.init();
        console.log('[app.js] ✅ WorkoutModal инициализирован');
      }

      console.log('[app.js] ✅✅✅ ПРИЛОЖЕНИЕ ПОЛНОСТЬЮ ИНИЦИАЛИЗИРОВАНО');
      return;
    }

    // Если не все загружено — повторяем
    if (attempt < maxAttempts) {
      setTimeout(checkAndInit, 100);
    } else {
      console.error('[app.js] ❌ ОШИБКА: Не удалось загрузить все зависимости!');
      console.log('[app.js] Финальное состояние:', {
        'sb': !!window.sb,
        'WorkoutsStore': !!window.WorkoutsStore,
        'ClientsStore': !!window.ClientsStore,
        'TriggersStore': !!window.TriggersStore
      });
    }
  }

  checkAndInit();
}

// Запуск после загрузки DOM
setTimeout(initStores, 200);
function initHomeCalendarSwipes() {
  var wrap = document.getElementById('home-cal-days');
  if (!wrap) return;

  var startX = 0;
  var isDragging = false;

  wrap.addEventListener('touchstart', function(e) {
    startX = e.touches[0].clientX;
    isDragging = true;
  }, { passive: true });

  wrap.addEventListener('touchmove', function(e) {
    // Ничего не делаем, просто читаем
  }, { passive: true });

  wrap.addEventListener('touchend', function(e) {
    if (!isDragging) return;
    isDragging = false;

    var endX = e.changedTouches[0].clientX;
    var delta = startX - endX;
    var threshold = 30;

    if (Math.abs(delta) < threshold) return;

    var activeEl = wrap.querySelector('.home-cal-day.active');
    if (!activeEl) return;

    if (delta > threshold) {
      // Свайп влево → следующий день
      var next = activeEl.nextElementSibling;
      if (next) next.click();
    } else if (delta < -threshold) {
      // Свайп вправо → предыдущий день
      var prev = activeEl.previousElementSibling;
      if (prev) prev.click();
    }
  }, { passive: true });
}

buildHomeCalendar();
initHomeCalendarSwipes();
rebuildScheduleCalendar();

console.log('[app.js] ✅✅✅ ПРИЛОЖЕНИЕ ПОЛНОСТЬЮ ИНИЦИАЛИЗИРОВАНО');
console.log('[app.js] Интерфейс работает независимо от БД!');
