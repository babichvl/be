var tg = window.Telegram && window.Telegram.WebApp;
if (tg) { tg.expand(); }

// ─── Вкладки ───────────────────────────────────────
var TAB_TITLES = {
  home:      'Главная',
  schedule:  'Расписание',
  clients:   'Клиенты',
  programs:  'Программы'
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
  pageTitle.textContent = TAB_TITLES[tabId] || 'Главная';
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

// ─── Календарь ─────────────────────────────────────
var DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
var MONTHS = ['January','February','March','April','May','June',
              'July','August','September','October','November','December'];

function buildCalendar(daysId, monthId) {
  var wrap  = document.getElementById(daysId);
  var label = document.getElementById(monthId);
  if (!wrap || !label) return;

  var today = new Date();
  label.textContent = MONTHS[today.getMonth()] + ' ' + today.getFullYear();
  wrap.innerHTML = '';

  for (var i = -3; i <= 3; i++) {
    var date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    var chip = document.createElement('div');
    chip.className = 'cal-day' + (i === 0 ? ' active' : '');

    var nameEl = document.createElement('span');
    nameEl.className = 'cal-day__name';
    nameEl.textContent = DAYS[date.getDay()];

    var numEl = document.createElement('span');
    numEl.className = 'cal-day__num';
    numEl.textContent = date.getDate();

    chip.appendChild(nameEl);
    chip.appendChild(numEl);

    chip.addEventListener('click', function(el) {
      return function() {
        wrap.querySelectorAll('.cal-day').forEach(function(c) {
          c.classList.remove('active');
        });
        el.classList.add('active');
      };
    }(chip));

    wrap.appendChild(chip);
  }

  var active = wrap.querySelector('.cal-day.active');
  if (active) active.scrollIntoView({ inline: 'center', block: 'nearest' });
}

buildCalendar('cal-days',   'cal-month');
buildCalendar('cal-days-s', 'cal-month-s');
