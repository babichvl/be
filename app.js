// Telegram Web App
var tg = window.Telegram && window.Telegram.WebApp;
if (tg) { tg.expand(); }

// Скрипт находится в конце <body> — DOM уже готов, обёртки не нужны

// ─── Вкладки ───────────────────────────────────────
var TAB_TITLES = {
  home:     'Главная',
  schedule: 'Расписание',
  clients:  'Клиенты',
  workouts: 'Тренировки'
};

var navItems  = document.querySelectorAll('.bottomnav__item[data-tab]');
var screens   = document.querySelectorAll('.screen');
var pageTitle = document.getElementById('page-title');

function switchTab(tabId) {
  for (var i = 0; i < navItems.length; i++) {
    navItems[i].classList.toggle('active', navItems[i].dataset.tab === tabId);
  }
  for (var j = 0; j < screens.length; j++) {
    screens[j].classList.toggle('active', screens[j].id === 'screen-' + tabId);
  }
  pageTitle.textContent = TAB_TITLES[tabId] || 'Главная';
}

for (var k = 0; k < navItems.length; k++) {
  navItems[k].addEventListener('click', (function(id) {
    return function() { switchTab(id); };
  })(navItems[k].dataset.tab));
}

switchTab('home'); // начальное состояние

// ─── Три точки — дропдаун ──────────────────────────
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

// ─── Календарь ─────────────────────────────────────
var DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
var MONTHS = ['January','February','March','April','May','June',
              'July','August','September','October','November','December'];

function buildCalendar(daysId, monthId) {
  var wrap  = document.getElementById(daysId);
  var label = document.getElementById(monthId);

  // Проверка — элементы должны быть в DOM
  if (!wrap || !label) {
    console.error('buildCalendar: не найдены элементы', daysId, monthId);
    return;
  }

  var today = new Date();
  label.textContent = MONTHS[today.getMonth()] + ' ' + today.getFullYear();

  // Очищаем и строим 7 дней: -3 … сегодня … +3
  wrap.innerHTML = '';
  for (var d = -3; d <= 3; d++) {
    var date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + d);
    var chip = document.createElement('div');
    chip.className = 'cal-day' + (d === 0 ? ' active' : '');

    var nameSpan = document.createElement('span');
    nameSpan.className = 'cal-day__name';
    nameSpan.textContent = DAYS[date.getDay()];

    var numSpan = document.createElement('span');
    numSpan.className = 'cal-day__num';
    numSpan.textContent = date.getDate();

    chip.appendChild(nameSpan);
    chip.appendChild(numSpan);

    // Клик — меняет активный день
    chip.addEventListener('click', function(el) {
      return function() {
        var all = wrap.querySelectorAll('.cal-day');
        for (var i = 0; i < all.length; i++) all[i].classList.remove('active');
        el.classList.add('active');
      };
    }(chip));

    wrap.appendChild(chip);
  }

  // Прокрутить активный в центр
  setTimeout(function() {
    var active = wrap.querySelector('.cal-day.active');
    if (active) active.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, 60);
}

// Строим оба календаря
buildCalendar('cal-days',   'cal-month');    // вкладка Главная
buildCalendar('cal-days-s', 'cal-month-s'); // вкладка Расписание
