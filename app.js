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

// ─── Инициализация хранилища ──────────────────────
WorkoutsStore.init(trainerTgId);

// ─── ВКЛАДКА "ГЛАВНАЯ" ─────────────────────────────
var homeSelectedDate = new Date().toISOString().split('T')[0];

function renderHomeCalendar() {
  var container = document.getElementById('home-cal-days');
  if (!container) return;
  
  container.innerHTML = '';
  
  // Показываем 14 дней: -7 дней и +7 дней от сегодня
  var today = new Date();
  
  for (var i = -7; i <= 7; i++) {
    var d = new Date(today);
    d.setDate(d.getDate() + i);
    var dateStr = d.toISOString().split('T')[0];
    
    var dayBtn = document.createElement('button');
    dayBtn.className = 'home-calendar__day-btn';
    if (dateStr === homeSelectedDate) dayBtn.classList.add('active');
    if (i === 0) dayBtn.classList.add('today');
    
    dayBtn.textContent = d.getDate();
    dayBtn.addEventListener('click', function() {
      homeSelectedDate = dateStr;
      renderHomeCalendar();
      renderHomeWorkouts();
    });
    
    container.appendChild(dayBtn);
  }
}

function renderHomeWorkouts() {
  var container = document.getElementById('home-list');
  if (!container) return;
  
  var workouts = WorkoutsStore.forDate(homeSelectedDate);
  
  if (workouts.length === 0) {
    container.innerHTML = '<p class="placeholder-text">На этот день тренировок нет</p>';
    return;
  }
  
  container.innerHTML = '';
  
  workouts.forEach(function(w) {
    var card = document.createElement('div');
    card.className = 'workout-card';
    card.setAttribute('data-workout-id', w.id);
    
    var colors = ['#3B82F6', '#EC4899', '#10B981', '#A855F7'];
    card.style.borderLeftColor = colors[workouts.indexOf(w) % 4];
    
    card.innerHTML = 
      '<div class="workout-info">' +
        '<h3 class="workout-card__title">' + (w.client_name || 'Тренировка') + '</h3>' +
        '<p class="workout-card__time">' + w.start_time + ' • ' + w.duration + ' мин</p>' +
      '</div>';
    
    makeSwipeable(card, w.id);
    container.appendChild(card);
  });
}

// ─── ВКЛАДКА "РАСПИСАНИЕ" ──────────────────────────
var scheduleCurrentDate = new Date().toISOString().split('T')[0];

function renderScheduleCalendar() {
  var monthContainer = document.getElementById('cal-month-s');
  var daysContainer = document.getElementById('cal-days-s');
  
  if (!monthContainer || !daysContainer) return;
  
  // Месяц
  var d = new Date(scheduleCurrentDate);
  var monthName = d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  monthContainer.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  
  // Дни месяца (горизонтальная полоса)
  daysContainer.innerHTML = '';
  
  var firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
  var lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  
  for (var day = 1; day <= lastDay; day++) {
    var dateStr = d.getFullYear() + '-' + 
                  String(d.getMonth() + 1).padStart(2, '0') + '-' + 
                  String(day).padStart(2, '0');
    
    var dayBtn = document.createElement('button');
    dayBtn.className = 'calendar-strip__day-btn';
    
    if (dateStr === scheduleCurrentDate) dayBtn.classList.add('active');
    if (dateStr === new Date().toISOString().split('T')[0]) dayBtn.classList.add('today');
    
    dayBtn.innerHTML = '<span class="day-num">' + day + '</span>';
    dayBtn.addEventListener('click', function() {
      scheduleCurrentDate = dateStr;
      renderScheduleCalendar();
      renderScheduleWorkouts();
    });
    
    daysContainer.appendChild(dayBtn);
  }
}

function renderScheduleWorkouts() {
  var container = document.getElementById('schedule-list');
  if (!container) return;
  
  var workouts = WorkoutsStore.forDate(scheduleCurrentDate);
  
  if (workouts.length === 0) {
    container.innerHTML = '<p class="placeholder-text">На этот день тренировок нет</p>';
    return;
  }
  
  container.innerHTML = '';
  
  workouts.forEach(function(w) {
    var card = document.createElement('div');
    card.className = 'workout-card';
    card.setAttribute('data-workout-id', w.id);
    
    var colors = ['#3B82F6', '#EC4899', '#10B981', '#A855F7'];
    card.style.borderLeftColor = colors[workouts.indexOf(w) % 4];
    
    card.innerHTML = 
      '<div class="workout-info">' +
        '<h3 class="workout-card__title">' + (w.client_name || 'Тренировка') + '</h3>' +
        '<p class="workout-card__time">' + w.start_time + ' • ' + w.duration + ' мин</p>' +
      '</div>';
    
    makeSwipeable(card, w.id);
    container.appendChild(card);
  });
}

// ─── Свайп на карточке ────────────────────────────
function makeSwipeable(card, workoutId) {
  var startX = 0;
  var currentX = 0;
  var isDragging = false;
  var threshold = 80;
  
  card.addEventListener('touchstart', function(e) {
    if (card.classList.contains('swiped')) return;
    startX = e.touches[0].clientX;
    isDragging = true;
  });
  
  card.addEventListener('touchmove', function(e) {
    if (!isDragging || card.classList.contains('swiped')) return;
    currentX = e.touches[0].clientX;
    var diff = startX - currentX;
    
    if (diff > 0) {
      card.style.transform = 'translateX(' + (-diff) + 'px)';
    }
  });
  
  card.addEventListener('touchend', function(e) {
    if (!isDragging) return;
    isDragging = false;
    
    var diff = startX - currentX;
    
    if (diff > threshold) {
      // Свайп влево — показываем кнопки
      showCardActions(card, workoutId);
    } else {
      card.style.transform = 'translateX(0)';
    }
  });
}

function showCardActions(card, workoutId) {
  card.classList.add('swiped');
  
  card.innerHTML = 
    '<div class="workout-actions">' +
      '<button class="action-btn action-done">✓ Проведена</button>' +
      '<button class="action-btn action-delete">🗑 Удалить</button>' +
    '</div>';
  
  card.querySelector('.action-done').addEventListener('click', function() {
    markWorkoutDone(workoutId);
  });
  
  card.querySelector('.action-delete').addEventListener('click', function() {
    deleteWorkout(workoutId);
  });
}

function hideCardActions(card) {
  card.classList.remove('swiped');
  card.style.transform = 'translateX(0)';
}

// ─── Действия с тренировками ──────────────────────

function markWorkoutDone(workoutId) {
  sb.from('workouts').update({
    status: 'done',
    updated_at_supabase: new Date().toISOString(),
    sync_status: 'pending'
  }).eq('id', workoutId).then(function(res) {
    if (!res.error) {
      console.log('[app] ✅ Тренировка отмечена как проведённая');
      renderHomeWorkouts();
      renderScheduleWorkouts();
    } else {
      console.error('[app] Ошибка:', res.error);
    }
  });
}

function deleteWorkout(workoutId) {
  // Мягкое удаление: помечаем deleted_at
  sb.from('workouts').update({
    deleted_at: new Date().toISOString(),
    sync_status: 'pending'
  }).eq('id', workoutId).then(function(res) {
    if (!res.error) {
      console.log('[app] ✅ Тренировка удалена (помечена как deleted_at)');
      renderHomeWorkouts();
      renderScheduleWorkouts();
    } else {
      console.error('[app] Ошибка:', res.error);
    }
  });
}

// ─── Слушатель на изменение хранилища ─────────────

WorkoutsStore.subscribe(function() {
  console.log('[app] Хранилище обновилось');
  renderHomeWorkouts();
  renderScheduleWorkouts();
});

// ─── Кнопки навигации месяца ──────────────────────

document.getElementById('schedule-arrow-left').addEventListener('click', function() {
  var d = new Date(scheduleCurrentDate);
  d.setMonth(d.getMonth() - 1);
  scheduleCurrentDate = d.toISOString().split('T')[0];
  renderScheduleCalendar();
  renderScheduleWorkouts();
});

document.getElementById('schedule-arrow-right').addEventListener('click', function() {
  var d = new Date(scheduleCurrentDate);
  d.setMonth(d.getMonth() + 1);
  scheduleCurrentDate = d.toISOString().split('T')[0];
  renderScheduleCalendar();
  renderScheduleWorkouts();
});

// ─── Инициализация ────────────────────────────────

renderHomeCalendar();
renderHomeWorkouts();
renderScheduleCalendar();
renderScheduleWorkouts();

console.log('[app] Инициализация завершена');
