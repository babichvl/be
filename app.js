// ─── Telegram ──────────────────────────────────────
var tg = window.Telegram && window.Telegram.WebApp;
if (tg) { tg.expand(); tg.setHeaderColor('#F5F5F7'); }

// ─── Supabase ──────────────────────────────────────
var SUPABASE_URL = 'https://qhvtapqlyajkikgfacdo.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodnRhcHFseWFqa2lrZ2ZhY2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxNjM3NjEsImV4cCI6MjEwMzczOTc2MX0.hr8Uiy3hvbhwfJ0At7T0TR8waK4Mt5ylFw-B-qp5Cow';
var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── ID тренера ────────────────────────────────────
var trainerTgId = null;

function loadUser() {
  var urlId = new URLSearchParams(window.location.search).get('tg_id');
  try {
    var params = new URLSearchParams(tg && tg.initData ? tg.initData : '');
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
  if (!trainerTgId) {
    trainerTgId = 786441589;
  }
  console.log('[app] trainerTgId =', trainerTgId);
}
loadUser();

// ─── Вкладки ───────────────────────────────────────
var navItems = document.querySelectorAll('.bottomnav__item[data-tab]');
var screens = document.querySelectorAll('.screen');

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
var selectedDate = today;
var allWorkouts = [];
var localDoneIds = {};
var localDeletedIds = {};
var currentOpenCard = null;

// ─── Календарь ─────────────────────────────────────
function buildCalendar(centerDate) {
  var wrap = document.getElementById('calendar-days');
  wrap.innerHTML = '';

  var start = new Date(centerDate);
  start.setDate(start.getDate() - 7);

  for (var i = 0; i < 15; i++) {
    var d = new Date(start);
    d.setDate(start.getDate() + i);

    var div = document.createElement('div');
    div.className = 'cal-day';
    div.dataset.date = d.toISOString().split('T')[0];

    var daySpan = document.createElement('div');
    daySpan.className = 'cal-day__name';
    daySpan.textContent = ['ВС','ПН','ВТ','СР','ЧТ','ПТ','СБ'][d.getDay()];

    var numSpan = document.createElement('div');
    numSpan.className = 'cal-day__number';
    numSpan.textContent = d.getDate();

    div.appendChild(daySpan);
    div.appendChild(numSpan);

    if (d.toDateString() === centerDate.toDateString()) {
      div.classList.add('active');
    }

    div.addEventListener('click', function() {
      var clickedDate = new Date(this.dataset.date + 'T00:00:00');
      selectedDate = clickedDate;
      wrap.querySelectorAll('.cal-day').forEach(function(c) { c.classList.remove('active'); });
      this.classList.add('active');
      renderWorkouts();
    });

    wrap.appendChild(div);
  }

  wrap.scrollLeft = (wrap.scrollWidth - wrap.clientWidth) / 2;
}

buildCalendar(today);

// ─── Свайп календаря ───────────────────────────────
(function() {
  var wrap = document.getElementById('calendar-days');
  var startX = 0, scrollStart = 0;

  wrap.addEventListener('touchstart', function(e) {
    startX = e.touches[0].clientX;
    scrollStart = wrap.scrollLeft;
  });

  wrap.addEventListener('touchmove', function(e) {
    var dx = startX - e.touches[0].clientX;
    wrap.scrollLeft = scrollStart + dx;
  });

  wrap.addEventListener('touchend', function() {
    var day = wrap.querySelector('.cal-day.active');
    if (day) {
      var rect = day.getBoundingClientRect();
      var wrapRect = wrap.getBoundingClientRect();
      if (rect.right < wrapRect.left || rect.left > wrapRect.right) {
        var allDays = Array.from(wrap.querySelectorAll('.cal-day'));
        var closest = null;
        var minDist = Infinity;
        allDays.forEach(function(el) {
          var r = el.getBoundingClientRect();
          var center = (r.left + r.right) / 2;
          var wrapCenter = (wrapRect.left + wrapRect.right) / 2;
          var dist = Math.abs(center - wrapCenter);
          if (dist < minDist) {
            minDist = dist;
            closest = el;
          }
        });
        if (closest) {
          var clickedDate = new Date(closest.dataset.date + 'T00:00:00');
          selectedDate = clickedDate;
          allDays.forEach(function(el) { el.classList.remove('active'); });
          closest.classList.add('active');
          renderWorkouts();
        }
      }
    }
  });
})();

// ─── Развернуть карточку ───────────────────────────
function toggleExpand(cardEl) {
  var expandEl = cardEl.querySelector('.workout-card__expand');
  if (!expandEl) return;

  var wasExpanded = expandEl.classList.contains('expanded');
  document.querySelectorAll('.workout-card__expand.expanded').forEach(function(el) {
    el.classList.remove('expanded');
  });

  if (!wasExpanded) {
    expandEl.classList.add('expanded');
  }
}

document.addEventListener('click', function(e) {
  if (!e.target.closest('.workout-card__expand')) {
    document.querySelectorAll('.workout-card__expand.expanded').forEach(function(el) {
      el.classList.remove('expanded');
    });
  }
});

// ─── Свайп по карточкам ────────────────────────────
var SWIPE_WIDTH = 152;

document.addEventListener('click', function(e) {
  if (currentOpenCard && !currentOpenCard.closest('.swipe-wrapper').contains(e.target)) {
    currentOpenCard.style.transform = 'translateX(0)';
    currentOpenCard = null;
  }
});

function markDone(workoutId, itemEl) {
  if (!workoutId) return;
  var id = String(workoutId);
  localDoneIds[id] = true;

  var badge = itemEl.querySelector('.workout-card__status-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.className = 'workout-card__status-badge';
    badge.textContent = '✓ Проведена';
    itemEl.querySelector('.workout-card__main').appendChild(badge);
  }

  currentOpenCard.style.transform = 'translateX(0)';
  currentOpenCard = null;

  sb.from('workouts')
    .update({ status: 'completed' })
    .eq('id', workoutId)
    .then(function(res) {
      if (res.error) {
        console.warn('[app] ошибка обновления статуса:', res.error.message);
      } else {
        console.log('[app] status=completed записан в БД:', workoutId);
        delete localDoneIds[id];
      }
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

  sb.from('workouts')
    .update({ deleted: true })
    .eq('id', workoutId)
    .then(function(res) {
      if (res.error) {
        console.warn('[app] ошибка удаления:', res.error.message);
      } else {
        console.log('[app] deleted=true записано в БД:', workoutId);
        delete localDeletedIds[id];
        
        // Удаляем из Google Calendar через бота
        deleteFromGoogleCalendar(workoutId);
      }
    });
}

// ─── Удаление из Google Calendar ───────────────────
function deleteFromGoogleCalendar(workoutId) {
  if (tg && tg.sendData) {
    tg.sendData(JSON.stringify({
      action: 'delete_calendar_event',
      workout_id: workoutId
    }));
    console.log('[calendar] Команда отправлена боту:', workoutId);
  } else {
    console.warn('[calendar] Telegram WebApp sendData недоступен');
  }
}

function applyLocalCache(workouts) {
  return workouts
    .filter(function(w) {
      return !localDeletedIds[String(w.id)];
    })
    .map(function(w) {
      if (localDoneIds[String(w.id)]) {
        w.status = 'completed';
      }
      return w;
    });
}

function initSwipes(listEl) {
  listEl.querySelectorAll('.swipe-wrapper').forEach(function(wrapper) {
    var card      = wrapper.querySelector('.workout-card');
    var btnDone   = wrapper.querySelector('.swipe-btn--done');
    var btnDel    = wrapper.querySelector('.swipe-btn--delete');

    if (btnDone) {
      btnDone.addEventListener('click', function() {
        var workoutId = this.dataset.id;
        var itemEl = this.closest('.workout-item');
        markDone(workoutId, itemEl);
      });
    }

    if (btnDel) {
      btnDel.addEventListener('click', function() {
        var workoutId = this.dataset.id;
        var itemEl = this.closest('.workout-item');
        deleteWorkout(workoutId, itemEl);
      });
    }

    var startX = 0, startedOpen = false;
    card.addEventListener('touchstart', function(e) {
      startX = e.touches[0].clientX;
      startedOpen = (currentOpenCard === card);
    });

    card.addEventListener('touchmove', function(e) {
      if (currentOpenCard && currentOpenCard !== card) {
        currentOpenCard.style.transform = 'translateX(0)';
        currentOpenCard = null;
      }
      var dx = e.touches[0].clientX - startX;
      if (dx > 0) return;

      var base = startedOpen ? -SWIPE_WIDTH : 0;
      var x    = Math.min(0, Math.max(-SWIPE_WIDTH, base + dx));
      card.style.transform = 'translateX(' + x + 'px)';
    });

    card.addEventListener('touchend', function(e) {
      var dx        = e.changedTouches[0].clientX - startX;
      var base      = startedOpen ? -SWIPE_WIDTH : 0;
      var finalX    = Math.min(0, Math.max(-SWIPE_WIDTH, base + dx));
      var threshold = SWIPE_WIDTH * 0.35;

      if (Math.abs(finalX) >= threshold) {
        card.style.transform = 'translateX(-' + SWIPE_WIDTH + 'px)';
        currentOpenCard = card;
      } else {
        card.style.transform = 'translateX(0)';
        currentOpenCard = null;
      }
    });
  });
}

// ─── Рендер списка тренировок ──────────────────────
function renderWorkouts() {
  var listEl = document.getElementById('workouts-list');
  var dateStr = selectedDate.toISOString().split('T')[0];

  var filtered = applyLocalCache(allWorkouts).filter(function(w) {
    return w.workout_date === dateStr;
  });

  if (!filtered.length) {
    listEl.innerHTML = '<div class="empty-state">Нет тренировок на этот день</div>';
    return;
  }

  listEl.innerHTML = filtered.map(function(w, idx) {
    var color = CARD_COLORS[idx % CARD_COLORS.length];
    var time  = w.start_time ? w.start_time.slice(0,5) : '';
    var clientName = w.client_name || 'Клиент';
    var title = w.title || 'Тренировка';
    var statusBadge = (w.status === 'completed') 
      ? '<div class="workout-card__status-badge">✓ Проведена</div>' 
      : '';
    var id = w.id;

    return (
      '<div class="workout-item">' +
      '<div class="swipe-wrapper">' +
        '<div class="swipe-actions">' +
          '<button class="swipe-btn swipe-btn--done"   data-id="' + id + '">✓<br>Проведена</button>' +
          '<button class="swipe-btn swipe-btn--delete" data-id="' + id + '">🗑<br>Удалить</button>' +
        '</div>' +
        '<div class="workout-card workout-card--' + color + '" onclick="toggleExpand(this)">' +
          '<div class="workout-card__main">' +
            '<div class="workout-card__time">' + time + '</div>' +
            '<div class="workout-card__info">' +
              '<div class="workout-card__client">' + clientName + '</div>' +
              '<div class="workout-card__title">' + title + '</div>' +
            '</div>' +
            statusBadge +
          '</div>' +
          '<div class="workout-card__expand">' +
            '<div class="workout-card__expand-row">' +
              '<span class="workout-card__expand-label">Описание:</span>' +
              '<span>' + (w.description || 'Нет описания') + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '</div>'
    );
  }).join('');

  initSwipes(listEl);
}

// ─── Загрузка тренировок ───────────────────────────
function loadWorkouts() {
  if (!trainerTgId) return;

  var sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  var fromDate = sevenDaysAgo.toISOString().split('T')[0];

  sb.from('workouts')
    .select('*, clients(name)')
    .eq('trainer_id', trainerTgId)
    .eq('deleted', false)
    .gte('workout_date', fromDate)
    .order('workout_date', { ascending: true })
    .order('start_time', { ascending: true })
    .then(function(res) {
      if (res.error) {
        console.error('[app] ошибка загрузки:', res.error);
        return;
      }

      allWorkouts = (res.data || []).map(function(w) {
        w.client_name = (w.clients && w.clients.name) || 'Клиент';
        return w;
      });

      console.log('[app] загружено тренировок:', allWorkouts.length);
      renderWorkouts();
    });
}

loadWorkouts();

// ─── Realtime подписка ─────────────────────────────
sb.channel('workouts-changes')
  .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'workouts' },
      function(payload) {
        console.log('[realtime]', payload);
        loadWorkouts();
      }
  )
  .subscribe();
