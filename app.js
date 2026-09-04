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
var selectedDate = today.toISOString().split('T')[0];
var currentMonth = today;

// Инициализируем хранилище тренировок
WorkoutsStore.init(trainerTgId);

function renderCalendar() {
  var monthDiv = document.getElementById('month-select');
  var monthName = currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  monthDiv.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  
  var grid = document.getElementById('calendar-grid');
  grid.innerHTML = '';
  
  // Дни недели
  var weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  weekDays.forEach(function(day) {
    var header = document.createElement('div');
    header.className = 'calendar-header-day';
    header.textContent = day;
    grid.appendChild(header);
  });
  
  // Первый день месяца
  var firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  var startDow = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  
  // Пустые ячейки в начале
  for (var i = 0; i < startDow; i++) {
    var empty = document.createElement('div');
    empty.className = 'calendar-day empty';
    grid.appendChild(empty);
  }
  
  // Дни месяца
  var lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  for (var day = 1; day <= lastDay; day++) {
    var dateStr = currentMonth.getFullYear() + '-' + 
                  String(currentMonth.getMonth() + 1).padStart(2, '0') + '-' + 
                  String(day).padStart(2, '0');
    
    var dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    if (dateStr === selectedDate) dayDiv.classList.add('selected');
    if (dateStr === today.toISOString().split('T')[0]) dayDiv.classList.add('today');
    
    dayDiv.innerHTML = '<span class="day-number">' + day + '</span>';
    dayDiv.addEventListener('click', function() {
      selectedDate = dateStr;
      renderCalendar();
      renderWorkouts();
    });
    
    grid.appendChild(dayDiv);
  }
}

function renderWorkouts() {
  var workouts = WorkoutsStore.forDate(selectedDate);
  var container = document.getElementById('workouts-list');
  container.innerHTML = '';
  
  if (workouts.length === 0) {
    container.innerHTML = '<div class="empty-state">На этот день тренировок нет</div>';
    return;
  }
  
  workouts.forEach(function(w, i) {
    var card = document.createElement('div');
    card.className = 'workout-card';
    card.setAttribute('data-workout-id', w.id);
    card.style.borderLeftColor = '#' + ['3B82F6', 'EC4899', '10B981', 'A855F7'][i % 4];
    
    card.innerHTML = 
      '<div class="workout-header">' +
        '<h3>' + (w.client_name || 'Тренировка') + '</h3>' +
      '</div>' +
      '<div class="workout-details">' +
        '<span>' + w.start_time + ' • ' + w.duration + ' мин</span>' +
      '</div>';
    
    // Свайп для действий
    makeSwipeable(card, w.id);
    
    container.appendChild(card);
  });
}

function makeSwipeable(card, workoutId) {
  var startX = 0;
  var currentX = 0;
  var isDragging = false;
  
  card.addEventListener('touchstart', function(e) {
    startX = e.touches[0].clientX;
    isDragging = true;
  });
  
  card.addEventListener('touchmove', function(e) {
    if (!isDragging) return;
    currentX = e.touches[0].clientX;
    var diff = startX - currentX;
    card.style.transform = 'translateX(' + (-diff) + 'px)';
  });
  
  card.addEventListener('touchend', function(e) {
    isDragging = false;
    var diff = startX - currentX;
    
    if (diff > 100) {
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
    '<div class="card-actions">' +
      '<button class="action-btn done-btn">Проведена</button>' +
      '<button class="action-btn delete-btn">Удалить</button>' +
    '</div>';
  
  card.querySelector('.done-btn').addEventListener('click', function() {
    markWorkoutDone(workoutId);
  });
  
  card.querySelector('.delete-btn').addEventListener('click', function() {
    deleteWorkout(workoutId);
  });
}

function markWorkoutDone(workoutId) {
  sb.from('workouts').update({
    status: 'done',
    updated_at_supabase: new Date().toISOString(),
    sync_status: 'pending'
  }).eq('id', workoutId).then(function(res) {
    if (!res.error) {
      console.log('[app] ✅ Тренировка отмечена как проведённая');
      renderWorkouts();
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
      renderWorkouts();
    }
  });
}

// ─── Инициализация ─────────────────────────────────
WorkoutsStore.subscribe(function() {
  renderWorkouts();
});

renderCalendar();
renderWorkouts();

// Кнопки навигации месяца
document.getElementById('prev-month').addEventListener('click', function() {
  currentMonth.setMonth(currentMonth.getMonth() - 1);
  renderCalendar();
});

document.getElementById('next-month').addEventListener('click', function() {
  currentMonth.setMonth(currentMonth.getMonth() + 1);
  renderCalendar();
});
