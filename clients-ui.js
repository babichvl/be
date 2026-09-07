// ═══════════════════════════════════════════════════════════
// CLIENTS UI — список клиентов + профиль
// ═══════════════════════════════════════════════════════════

var ClientsUI = (function() {
  var listContainer = null;
  var searchInput = null;
  var profileOverlay = null;
  var profile = null;
  var currentClient = null;

  function init() {
    listContainer = document.getElementById('clients-list');
    searchInput = document.getElementById('clients-search-input');

    if (!listContainer || !searchInput) return;

    createProfileModal();
    attachEventListeners();

    // Подписываемся на изменения
    if (window.ClientsStore) {
      ClientsStore.subscribe(render);
    }
  }

  function createProfileModal() {
    profileOverlay = document.createElement('div');
    profileOverlay.className = 'client-profile-overlay';
    profileOverlay.addEventListener('click', closeProfile);

    profile = document.createElement('div');
    profile.className = 'client-profile';
    profile.addEventListener('click', function(e) { e.stopPropagation(); });

    profile.innerHTML = `
      <div class="client-profile__header">
        <button class="client-profile__back" id="client-profile-back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <div class="client-profile__header-title" id="client-profile-title">Клиент</div>
      </div>
      <div class="client-profile__content" id="client-profile-content">
        <p class="placeholder-text">Загружаем...</p>
      </div>
    `;

    document.body.appendChild(profileOverlay);
    document.body.appendChild(profile);

    document.getElementById('client-profile-back').addEventListener('click', closeProfile);
  }

  function attachEventListeners() {
    searchInput.addEventListener('input', filterClients);
  }

  function render(clients) {
    if (!listContainer) return;

    if (!clients || clients.length === 0) {
      listContainer.innerHTML = '<p class="placeholder-text">Клиентов пока нет</p>';
      return;
    }

    listContainer.innerHTML = clients.map(function(client) {
      var initials = client.name ? client.name.charAt(0).toUpperCase() : '?';
      var statusText = client.status === 'active' ? 'Подключён' : 'Не подключён';
      var badgeClass = client.status === 'active' ? '' : 'pending';

      return (
        '<div class="client-card" data-client-id="' + client.id + '">' +
          '<div class="client-card__avatar">' + initials + '</div>' +
          '<div class="client-card__info">' +
            '<div class="client-card__name">' + client.name + '</div>' +
            '<div class="client-card__meta">' + statusText + '</div>' +
          '</div>' +
          '<div class="client-card__badge ' + badgeClass + '"></div>' +
        '</div>'
      );
    }).join('');

    // Обработчики кликов
    listContainer.querySelectorAll('.client-card').forEach(function(card) {
      card.addEventListener('click', function() {
        var clientId = this.dataset.clientId;
        openProfile(clientId);
      });
    });
  }

  function filterClients() {
    var query = searchInput.value.toLowerCase();
    var cards = listContainer.querySelectorAll('.client-card');

    cards.forEach(function(card) {
      var name = card.querySelector('.client-card__name').textContent.toLowerCase();
      if (name.includes(query)) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }

  function openProfile(clientId) {
    if (!window.ClientsStore) return;

    var client = ClientsStore.getById(clientId);
    if (!client) return;

    currentClient = client;

    document.getElementById('client-profile-title').textContent = client.name;

    // Загружаем тренировки клиента
    loadClientWorkouts(clientId).then(function(workouts) {
      renderProfile(client, workouts);
    });

    // Блокируем скролл основного контента
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';

    profileOverlay.classList.add('active');
    setTimeout(function() {
      profile.classList.add('active');
    }, 10);
  }

  function closeProfile() {
    profile.classList.remove('active');
    setTimeout(function() {
      profileOverlay.classList.remove('active');
      currentClient = null;

      // Восстанавливаем скролл
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }, 300);
  }

  function loadClientWorkouts(clientId) {
    if (!window.sb) return Promise.resolve([]);

    return sb.from('workouts')
      .select('*')
      .eq('client_id', clientId)
      .neq('deleted', true)
      .order('workout_date', { ascending: false })
      .limit(10)
      .then(function(result) {
        if (result.error) {
          console.error('[ClientsUI] Ошибка загрузки тренировок:', result.error);
          return [];
        }
        return result.data || [];
      });
  }

  function renderProfile(client, workouts) {
    var contentEl = document.getElementById('client-profile-content');

    var statusText = client.status === 'active' ? 'Подключён' : 'Не подключён';
    var createdDate = client.created_at ? new Date(client.created_at).toLocaleDateString('ru-RU') : '—';

    var html = '';

    // Информация
    html += '<div class="client-profile__info">';
    html += '  <div class="client-profile__info-row">';
    html += '    <span class="client-profile__info-label">Статус</span>';
    html += '    <span class="client-profile__info-value">' + statusText + '</span>';
    html += '  </div>';
    html += '  <div class="client-profile__info-row">';
    html += '    <span class="client-profile__info-label">Телефон</span>';
    html += '    <span class="client-profile__info-value">' + (client.phone || '—') + '</span>';
    html += '  </div>';
    html += '  <div class="client-profile__info-row">';
    html += '    <span class="client-profile__info-label">День рождения</span>';
    html += '    <span class="client-profile__info-value" id="birth-date-display">' + (client.birth_date ? new Date(client.birth_date).toLocaleDateString('ru-RU') : 'Не указан') + '</span>';
    html += '  </div>';
    html += '  <div class="client-profile__info-row">';
    html += '    <span class="client-profile__info-label">Дата добавления</span>';
    html += '    <span class="client-profile__info-value">' + createdDate + '</span>';
    html += '  </div>';
    html += '</div>';

    // История тренировок
    html += '<div class="client-profile__section-title">История тренировок</div>';

    if (workouts.length === 0) {
      html += '<p class="placeholder-text">Тренировок пока нет</p>';
    } else {
      html += '<div class="client-profile__workouts">';
      workouts.forEach(function(w) {
        var date = w.workout_date ? new Date(w.workout_date).toLocaleDateString('ru-RU') : '—';
        var time = w.start_time ? w.start_time.slice(0, 5) : '—';
        var type = w.type || 'personal';
        var typeText = type === 'personal' ? 'Персональная' : type === 'group' ? 'Групповая' : 'Онлайн';
        var status = w.status || 'planned';
        var statusClass = status === 'done' ? 'done' : 'planned';
        var statusText = status === 'done' ? 'Проведена' : 'Запланирована';

        html += '<div class="client-workout-item">';
        html += '  <div class="client-workout-item__info">';
        html += '    <div class="client-workout-item__date">' + date + ' в ' + time + '</div>';
        html += '    <div class="client-workout-item__type">' + typeText + ' · ' + (w.duration || 60) + ' мин</div>';
        html += '  </div>';
        html += '  <div class="client-workout-item__status ' + statusClass + '">' + statusText + '</div>';
        html += '</div>';
      });
      html += '</div>';
    }

    contentEl.innerHTML = html;
    
        // Делаем дату редактируемой
    var displayEl = document.getElementById('birth-date-display');
    if (displayEl) {
      displayEl.style.cursor = 'pointer';
      displayEl.addEventListener('click', function() {
        var newDate = prompt('Введите дату рождения (YYYY-MM-DD):', client.birth_date || '');
        if (newDate) {
          saveBirthDate(client.id, newDate);
        }
      });
    }
  }
  function saveBirthDate(clientId, birthDate) {
    if (!window.sb) return;
    
    sb.from('clients')
      .update({ birth_date: birthDate })
      .eq('id', clientId)
      .then(function(result) {
        if (result.error) {
          console.error('[ClientsUI] Ошибка:', result.error);
          alert('Ошибка: ' + result.error.message);
          return;
        }
        console.log('[ClientsUI] ✅ Дата рождения сохранена');
        if (window.ClientsStore) ClientsStore.refresh();
        openProfile(clientId);
      });
  }
  return {
    init: init
  };
})();

window.ClientsUI = ClientsUI;
