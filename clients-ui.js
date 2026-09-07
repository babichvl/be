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

    loadClientWorkouts(clientId).then(function(workouts) {
      renderProfile(client, workouts);
    });

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
    var birthDate = client.birth_date ? new Date(client.birth_date).toLocaleDateString('ru-RU') : 'Не указан';

    var html = '';

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
    html += '    <span class="client-profile__info-value" id="birth-date-display" style="cursor: pointer; color: #667eea;">' + birthDate + '</span>';
    html += '  </div>';
    html += '  <div class="client-profile__info-row">';
    html += '    <span class="client-profile__info-label">Дата добавления</span>';
    html += '    <span class="client-profile__info-value">' + createdDate + '</span>';
    html += '  </div>';
    html += '</div>';

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

    var displayEl = document.getElementById('birth-date-display');
    if (displayEl) {
      displayEl.addEventListener('click', function() {
        showBirthDateForm(client);
      });
    }
  }

  function showBirthDateForm(client) {
    var displayEl = document.getElementById('birth-date-display');
    var row = displayEl.parentElement;
    
    var formattedDate = '';
    if (client.birth_date) {
      var parts = client.birth_date.split('-');
      if (parts.length === 3) {
        formattedDate = parts[2] + '/' + parts[1] + '/' + parts[0];
      }
    }

    var formHTML = '<div class="birth-date-form-container">' +
      '<div class="birth-date-form-single">' +
      '<input type="text" class="birth-date-input-single" placeholder="дд/мм/гггг" maxlength="10" value="' + formattedDate + '">' +
      '</div>' +
      '<div class="birth-date-buttons">' +
      '<button class="birth-date-btn save">Сохранить</button>' +
      '<button class="birth-date-btn cancel">Отмена</button>' +
      '</div>' +
      '</div>';

    row.innerHTML = formHTML;

    var input = row.querySelector('.birth-date-input-single');
    var saveBtn = row.querySelector('.birth-date-btn.save');
    var cancelBtn = row.querySelector('.birth-date-btn.cancel');

    input.addEventListener('input', function() {
      var val = this.value.replace(/[^0-9]/g, '');
      
      if (val.length > 0) {
        if (val.length <= 2) {
          this.value = val;
        } else if (val.length <= 4) {
          this.value = val.slice(0, 2) + '/' + val.slice(2);
        } else {
          this.value = val.slice(0, 2) + '/' + val.slice(2, 4) + '/' + val.slice(4, 8);
        }
      }
    });

    saveBtn.addEventListener('click', function() {
      var val = input.value.trim();
      
      if (val.length !== 10) {
        alert('Введите дату в формате дд/мм/гггг');
        return;
      }

      var parts = val.split('/');
      if (parts.length !== 3) {
        alert('Неверный формат');
        return;
      }

      var dayNum = parseInt(parts[0]);
      var monthNum = parseInt(parts[1]);
      var yearNum = parseInt(parts[2]);

      if (dayNum < 1 || dayNum > 31) {
        alert('День: 1-31');
        return;
      }
      if (monthNum < 1 || monthNum > 12) {
        alert('Месяц: 1-12');
        return;
      }
      if (yearNum < 1900 || yearNum > new Date().getFullYear()) {
        alert('Год: 1900-' + new Date().getFullYear());
        return;
      }

      var dateStr = yearNum + '-' + String(monthNum).padStart(2, '0') + '-' + String(dayNum).padStart(2, '0');
      saveBirthDate(client.id, dateStr);
    });

    cancelBtn.addEventListener('click', function() {
      openProfile(client.id);
    });

    input.focus();
  }

  function saveBirthDate(clientId, birthDate) {
    if (!window.sb) return;
    
    console.log('[ClientsUI] Сохраняем дату рождения:', birthDate);

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
        
        if (currentClient) {
          currentClient.birth_date = birthDate;
        }
        
        setTimeout(function() {
          openProfile(clientId);
        }, 300);
      });
  }

  return {
    init: init
  };
})();

window.ClientsUI = ClientsUI;
