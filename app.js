// ─── Telegram ──────────────────────────────────────
var tg = window.Telegram && window.Telegram.WebApp;
if (tg) { tg.expand(); tg.setHeaderColor('#F5F5F7'); }

// ─── Supabase ──────────────────────────────────────
var SUPABASE_URL      = 'https://qhvtapqlyajkikgfacdo.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodnRhcHFseWFqa2lrZ2ZhY2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxNjM3NjEsImV4cCI6MjEwMzczOTc2MX0.hr8Uiy3hvbhwfJ0At7T0TR8waK4Mt5ylFw-B-qp5Cow';
var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Локальный кэш изменений ──────────────────────
// Защита от реалтайм-гонки: храним изменения до подтверждения из БД
var localDeletedIds = {};   // { id: true }
var localDoneIds    = {};   // { id: true }

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

// ─── Главная: горизонтальный календарь ────────────
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
      if (isScrollingProgrammatically) return;
      var closest = getClosestDayToCenter();
      if (closest && !closest.classList.contains('active')) {
        wrap.querySelectorAll('.home-cal-day').forEach(function(el) {
          el.classList.remove('active');
        });
        closest.classList.add('active');
        selectedHomeDate = closest.dataset.date;
        homeExpanded = true;
        var expand = document.getElementById('home-expand');
        if (expand) expand.classList.add('expanded');
        renderHomeWorkouts();
      }
    }

    function snapToCenter() {
      if (isScrollingProgrammatically) return;
      var closest = getClosestDayToCenter();
      if (closest) centerDay(closest);
    }

    wrap.addEventListener('scroll', function() {
      if (scrollEndTimer) clearTimeout(scrollEndTimer);
      scrollEndTimer = setTimeout(function() {
        updateActiveDay();
        snapToCenter();
      }, 150);
    });
  })();
}

// ─── Расписание: календарь ─────────────────────────
var scheduleState = { offset: 0 };

function rebuildScheduleCalendar() {
  buildCalendar('cal-days-s', 'cal-month-s', function(iso) {
    selectedScheduleDate = iso;
    renderScheduleWorkouts();
  }, scheduleState, selectedScheduleDate);
}

document.getElementById('schedule-arrow-left').addEventListener('click', function() {
  scheduleState.offset--;
  rebuildScheduleCalendar();
});
document.getElementById('schedule-arrow-right').addEventListener('click', function() {
  scheduleState.offset++;
  rebuildScheduleCalendar();
});

// ─── Свайп ─────────────────────────────────────────
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
  console.log('[action] markDone() вызвана, workoutId =', workoutId);
  
  if (!workoutId) {
    console.warn('[action] workoutId пуст, выходим');
    return;
  }
  var id = String(workoutId);

  // Сохраняем в локальный кэш
  localDoneIds[id] = true;
  console.log('[action] добавил в localDoneIds, сейчас =', localDoneIds);

  // Обновляем в массиве
  allWorkouts = allWorkouts.map(function(w) {
    if (String(w.id) === id) {
      console.log('[action] нашли workout, меняем status на done');
      return Object.assign({}, w, { status: 'done' });
    }
    return w;
  });

  // Визуально
  var card = itemEl.querySelector('.schedule-card');
  console.log('[action] card найдена:', !!card);
  
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

  // Пишем в Supabase
  console.log('[action] отправляю UPDATE в Supabase для', workoutId);
  sb.from('workouts')
    .update({ 
      status: 'done',
      updated_at_supabase: new Date().toISOString()
    })
    .eq('id', workoutId)
    .then(function(res) {
      if (res.error) {
        console.warn('[action] ❌ ошибка UPDATE:', res.error.message);
      } else {
        console.log('[action] ✅ UPDATE успешно, удаляю из localDoneIds');
        delete localDoneIds[id];
      }
    })
    .catch(function(e) {
      console.error('[action] ❌ ошибка запроса:', e);
    });
}

function deleteWorkout(workoutId, itemEl) {
  console.log('[action] deleteWorkout() вызвана, workoutId =', workoutId);
  
  if (!workoutId) {
    console.warn('[action] workoutId пуст, выходим');
    return;
  }
  var id = String(workoutId);

  localDeletedIds[id] = true;
  console.log('[action] добавил в localDeletedIds, сейчас =', localDeletedIds);

  allWorkouts = allWorkouts.filter(function(w) {
    return String(w.id) !== id;
  });

  itemEl.style.transition = 'opacity 0.25s ease, max-height 0.3s ease';
  itemEl.style.overflow   = 'hidden';
  itemEl.style.maxHeight  = itemEl.offsetHeight + 'px';
  itemEl.style.opacity    = '0';
  
  requestAnimationFrame(function() { itemEl.style.maxHeight = '0'; });
  setTimeout(function() { 
    console.log('[action] удаляю itemEl из DOM');
    itemEl.remove(); 
  }, 300);
  
  currentOpenCard = null;

  // Мягкое удаление в Supabase
  console.log('[action] отправляю UPDATE deleted=true в Supabase для', workoutId);
  sb.from('workouts')
    .update({ 
      deleted: true,
      updated_at_supabase: new Date().toISOString()
    })
    .eq('id', workoutId)
    .then(function(res) {
      if (res.error) {
        console.warn('[action] ❌ ошибка UPDATE:', res.error.message);
      } else {
        console.log('[action] ✅ UPDATE deleted=true успешно');
        delete localDeletedIds[id];
      }
    })
    .catch(function(e) {
      console.error('[action] ❌ ошибка запроса:', e);
    });
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

  // Мягкое удаление в Supabase (для двусторонней синхронизации)
  sb.from('workouts')
    .update({ 
      deleted: true,
      updated_at_supabase: new Date().toISOString()
    })
    .eq('id', workoutId)
    .then(function(res) {
      if (res.error) {
        console.warn('[app] ошибка удаления:', res.error.message);
      } else {
        console.log('[app] ✅ deleted=true записано (id=' + workoutId + '), google_sync.py удалит из календаря');
        delete localDeletedIds[id];
      }
    });
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
  console.log('[swipe] ===== initSwipes START =====');
  
  var items = container.querySelectorAll('.schedule-item');
  console.log('[swipe] найдено карточек:', items.length);
  
  items.forEach(function(item, index) {
    var card = item.querySelector('.schedule-card');
    if (!card) {
      console.warn('[swipe] карточка не найдена в item', index);
      return;
    }

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

  // ✅ ИСПРАВЛЕНО: ID берём прямо из кнопки data-id
  var doneBtns = container.querySelectorAll('.swipe-btn--done');
  console.log('[swipe] найдено кнопок "Проведена":', doneBtns.length);
  
  doneBtns.forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var workoutId = this.dataset.id;
      console.log('[swipe] ✅ markDone нажата, ID =', workoutId);
      if (workoutId) {
        var item = this.closest('.schedule-item');
        markDone(Number(workoutId), item);
      }
    });
  });

  var deleteBtns = container.querySelectorAll('.swipe-btn--delete');
  console.log('[swipe] найдено кнопок "Удалить":', deleteBtns.length);
  
  deleteBtns.forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var workoutId = this.dataset.id;
      console.log('[swipe] ✅ deleteWorkout нажата, ID =', workoutId);
      if (workoutId) {
        var item = this.closest('.schedule-item');
        deleteWorkout(Number(workoutId), item);
      }
    });
  });
  
  console.log('[swipe] ===== initSwipes END =====');
}

function buildCardHTML(w, index) {
  console.log('[build] buildCardHTML вызвана для workout:', w);
  
  var time   = w.start_time ? w.start_time.slice(0, 5) : '--:--';
  var color  = CARD_COLORS[index % CARD_COLORS.length];
  var name   = w.client_name || 'Клиент';
  var title  = w.title || 'Тренировка';
  var id     = w.id || '';
  var isDone = w.status === 'done';
  
  console.log('[build] id =', id, ', title =', title, ', isDone =', isDone);
  
  if (!id) {
    console.error('[build] ❌ ОШИБКА: id пуст! workout =', w);
  }
  
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
  
  console.log('[render] renderHomeWorkouts вызвана');

  var list = allWorkouts.filter(function(w) {
    return w.workout_date === selectedHomeDate;
  }).sort(function(a, b) {
    return (a.start_time || '').localeCompare(b.start_time || '');
  });

  console.log('[render] найдено тренировок на', selectedHomeDate, ':', list.length);

  if (list.length === 0) {
    listEl.innerHTML = '<p class="placeholder-text">На этот день тренировок нет</p>';
    return;
  }

  listEl.innerHTML = list.map(buildCardHTML).join('');
  console.log('[render] HTML вставлен, вызываю initSwipes');
  initSwipes(listEl);
  console.log('[render] initSwipes завершена');
}

function renderScheduleWorkouts() {
  var listEl = document.getElementById('schedule-list');
  if (!listEl) return;
  
  console.log('[render] renderScheduleWorkouts вызвана');

  var list = allWorkouts.filter(function(w) {
    return w.workout_date === selectedScheduleDate;
  }).sort(function(a, b) {
    return (a.start_time || '').localeCompare(b.start_time || '');
  });

  console.log('[render] найдено тренировок на', selectedScheduleDate, ':', list.length);

  if (list.length === 0) {
    listEl.innerHTML = '<p class="placeholder-text">На этот день тренировок нет</p>';
    return;
  }

  listEl.innerHTML = list.map(buildCardHTML).join('');
  console.log('[render] HTML вставлен, вызываю initSwipes');
  initSwipes(listEl);
  console.log('[render] initSwipes завершена');
}

// ─── Инициализация WorkoutsStore ──────────────────
if (trainerTgId && window.WorkoutsStore) {
  WorkoutsStore.subscribe(function(workouts) {
    console.log('[app] subscribe callback: получено', workouts.length, 'тренировок');
    allWorkouts = applyLocalCache(workouts);
    console.log('[app] после фильтра:', allWorkouts.length, 'тренировок');
    console.log('[app] selectedHomeDate =', selectedHomeDate);
    console.log('[app] selectedScheduleDate =', selectedScheduleDate);
    
    console.log('[app] ===== ВЫЗЫВАЮ РЕНДЕР =====');
    renderHomeWorkouts();
    console.log('[app] renderHomeWorkouts завершена');
    renderScheduleWorkouts();
    console.log('[app] renderScheduleWorkouts завершена');
    console.log('[app] ===== РЕНДЕР ЗАВЕРШЁН =====');
  });
  console.log('[app] вызываю WorkoutsStore.init(' + trainerTgId + ')');
  WorkoutsStore.init(trainerTgId);
  console.log('[app] WorkoutsStore.init завершена');
} else {
  console.warn('[app] нет trainerTgId или WorkoutsStore');
  var hint      = 'Откройте через Telegram';
  var homeList  = document.getElementById('home-list');
  var schedList = document.getElementById('schedule-list');
  if (homeList)  homeList.innerHTML  = '<p class="placeholder-text">' + hint + '</p>';
  if (schedList) schedList.innerHTML = '<p class="placeholder-text">' + hint + '</p>';
}

// ─── Инициализация календарей ──────────────────────
buildHomeCalendar();
rebuildScheduleCalendar();

console.log('[app] инициализация завершена');
