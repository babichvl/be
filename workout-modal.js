// ═══════════════════════════════════════════════════════════
// МОДАЛЬНОЕ ОКНО ДОБАВЛЕНИЯ ТРЕНИРОВКИ
// ═══════════════════════════════════════════════════════════

var WorkoutModal = (function() {
  var overlay = null;
  var modal = null;
  var clientPicker = null;
  
  var currentMode = 'quick'; // 'quick' | 'full'
  var selectedClient = null;
  var selectedType = 'personal';
  var workoutDate = null;
  var workoutTime = null;
  
  var onSaveCallback = null;

  function init() {
    createModal();
    createClientPicker();
    attachEventListeners();
  }

  function createModal() {
    // Оверлей
    overlay = document.createElement('div');
    overlay.className = 'workout-modal-overlay';
    overlay.addEventListener('click', close);

    // Модальное окно
    modal = document.createElement('div');
    modal.className = 'workout-modal quick';
    modal.addEventListener('click', function(e) { e.stopPropagation(); });

    modal.innerHTML = `
      <div class="workout-modal__handle"></div>
      
      <div class="workout-modal__header">
        <div>
          <div class="workout-modal__title">Новая тренировка</div>
          <div class="workout-modal__subtitle" id="modal-subtitle"></div>
        </div>
        <button class="workout-modal__close" id="modal-close">×</button>
      </div>

      <div class="workout-modal__content">
        <form id="workout-form" class="workout-form">
          
          <div class="workout-form__field">
            <label class="workout-form__label">Клиент</label>
            <div class="workout-form__client-selector placeholder" id="client-selector">
              <span id="client-selector-text">Выбрать клиента</span>
              <svg class="workout-form__client-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </div>

          <div class="workout-form__field">
            <label class="workout-form__label">Тип тренировки</label>
            <div class="workout-form__chips" id="type-chips">
              <button type="button" class="workout-chip active" data-type="personal">Персональная</button>
              <button type="button" class="workout-chip" data-type="group">Групповая</button>
              <button type="button" class="workout-chip" data-type="online">Онлайн</button>
              <button type="button" class="workout-chip" data-type="intro">Вводная</button>
              <button type="button" class="workout-chip" data-type="split">Сплит</button>
            </div>
          </div>

          <button type="button" class="workout-form__expand-btn" id="expand-btn">
            <span>Подробно</span>
            <span>↑</span>
          </button>

          <!-- Полная форма (скрыта по умолчанию) -->
          <div id="full-form-fields" style="display: none;">
            
            <div class="workout-form__field">
              <label class="workout-form__label">Дата</label>
              <input type="date" class="workout-form__input" id="workout-date" />
            </div>

            <div class="workout-form__field">
              <label class="workout-form__label">Время</label>
              <input type="time" class="workout-form__input" id="workout-time" />
            </div>

            <div class="workout-form__field">
              <label class="workout-form__label">Длительность (мин)</label>
              <div class="workout-form__chips">
                <button type="button" class="workout-chip" data-duration="45">45</button>
                <button type="button" class="workout-chip active" data-duration="60">60</button>
                <button type="button" class="workout-chip" data-duration="90">90</button>
                <button type="button" class="workout-chip" data-duration="120">120</button>
              </div>
            </div>

            <div class="workout-form__field">
              <label class="workout-form__label">Стоимость (₽)</label>
              <input type="number" class="workout-form__input" id="workout-cost" placeholder="1500" />
            </div>

          </div>

        </form>
      </div>

      <div class="workout-modal__footer">
        <button class="workout-modal__btn workout-modal__btn--cancel" id="modal-cancel">Отмена</button>
        <button class="workout-modal__btn workout-modal__btn--save" id="modal-save" disabled>Сохранить</button>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
  }

  function createClientPicker() {
    clientPicker = document.createElement('div');
    clientPicker.className = 'client-picker';

    clientPicker.innerHTML = `
      <div class="client-picker__header">
        <button class="client-picker__back" id="client-picker-back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <input type="text" class="client-picker__search" id="client-search" placeholder="Поиск по имени..." />
      </div>

      <div class="client-picker__content">
        
        <div class="client-picker__section" id="recent-section">
          <div class="client-picker__section-title">Недавние</div>
          <div class="client-picker__recent" id="recent-clients"></div>
        </div>

        <div class="client-picker__section">
          <div class="client-picker__section-title">Все клиенты</div>
          <div class="client-list" id="all-clients"></div>
        </div>

      </div>

      <div class="client-picker__actions">
        <button class="client-picker__action-btn" id="add-new-client">
          <span>➕</span>
          <span>Добавить нового клиента</span>
        </button>
        <button class="client-picker__action-btn" id="send-invite">
          <span>📨</span>
          <span>Пригласить по ссылке</span>
        </button>
      </div>
    `;

    document.body.appendChild(clientPicker);
  }

  function attachEventListeners() {
    // Закрытие
    document.getElementById('modal-close').addEventListener('click', close);
    document.getElementById('modal-cancel').addEventListener('click', close);

    // Выбор клиента
    document.getElementById('client-selector').addEventListener('click', openClientPicker);
    document.getElementById('client-picker-back').addEventListener('click', closeClientPicker);

    // Чипсы типов
    var typeChips = document.querySelectorAll('[data-type]');
    typeChips.forEach(function(chip) {
      chip.addEventListener('click', function() {
        typeChips.forEach(function(c) { c.classList.remove('active'); });
        this.classList.add('active');
        selectedType = this.dataset.type;
      });
    });

    // Кнопка "Подробно"
    document.getElementById('expand-btn').addEventListener('click', toggleFullMode);

    // Чипсы длительности
    var durationChips = document.querySelectorAll('[data-duration]');
    durationChips.forEach(function(chip) {
      chip.addEventListener('click', function() {
        durationChips.forEach(function(c) { c.classList.remove('active'); });
        this.classList.add('active');
      });
    });

    // Сохранение
    document.getElementById('modal-save').addEventListener('click', save);

    // Поиск клиентов
    document.getElementById('client-search').addEventListener('input', filterClients);

    // Добавление нового клиента
    document.getElementById('add-new-client').addEventListener('click', addNewClient);

    // Свайп вниз для закрытия (опционально)
    var handle = modal.querySelector('.workout-modal__handle');
    var startY = 0;
    var currentY = 0;
    var isDragging = false;

    handle.addEventListener('touchstart', function(e) {
      startY = e.touches[0].clientY;
      isDragging = true;
    });

    handle.addEventListener('touchmove', function(e) {
      if (!isDragging) return;
      currentY = e.touches[0].clientY;
      var delta = currentY - startY;
      if (delta > 0) {
        modal.style.transform = 'translateY(' + delta + 'px)';
      }
    });

    handle.addEventListener('touchend', function() {
      if (!isDragging) return;
      isDragging = false;
      var delta = currentY - startY;
      if (delta > 100) {
        close();
      } else {
        modal.style.transform = 'translateY(0)';
      }
    });
  }

  function open(options) {
    options = options || {};
    workoutDate = options.date || null;
    workoutTime = options.time || null;
    onSaveCallback = options.onSave || null;

    selectedClient = null;
    selectedType = 'personal';

    // Подставляем дату и время в подзаголовок
    updateSubtitle();

    // Сбрасываем форму
    resetForm();

    // Загружаем клиентов
    loadClients();

    // Показываем
    overlay.classList.add('active');
    setTimeout(function() {
      modal.classList.add('active');
    }, 10);
  }

function close() {
  modal.classList.remove('active');
  setTimeout(function() {
    overlay.classList.remove('active');
    
    // Сбрасываем кнопку
    var saveBtn = document.getElementById('modal-save');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Сохранить';
    }
  }, 300);
}

  function updateSubtitle() {
    var subtitle = document.getElementById('modal-subtitle');
    if (workoutDate && workoutTime) {
      var d = new Date(workoutDate + 'T' + workoutTime);
      var dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
      var monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                       'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
      
      var dayName = dayNames[d.getDay()];
      var day = d.getDate();
      var month = monthNames[d.getMonth()];
      var time = workoutTime.slice(0, 5);
      
      subtitle.textContent = dayName + ', ' + day + ' ' + month + ' · ' + time;
    } else {
      subtitle.textContent = '';
    }
  }

  function resetForm() {
    document.getElementById('client-selector-text').textContent = 'Выбрать клиента';
    document.getElementById('client-selector').classList.add('placeholder');
    
    var typeChips = document.querySelectorAll('[data-type]');
    typeChips.forEach(function(chip) { chip.classList.remove('active'); });
    typeChips[0].classList.add('active');

    var dateInput = document.getElementById('workout-date');
    var timeInput = document.getElementById('workout-time');
    if (workoutDate) dateInput.value = workoutDate;
    if (workoutTime) timeInput.value = workoutTime;

    document.getElementById('modal-save').disabled = true;
  }

  function loadClients() {
    if (!window.ClientsStore) return;

    var allClients = ClientsStore.getAll();
    var recentClients = ClientsStore.getRecent(3);

    renderRecentClients(recentClients);
    renderAllClients(allClients);
  }

  function renderRecentClients(clients) {
    var container = document.getElementById('recent-clients');
    if (!clients || clients.length === 0) {
      document.getElementById('recent-section').style.display = 'none';
      return;
    }

    container.innerHTML = clients.map(function(client) {
      return '<div class="client-chip" data-client-id="' + client.id + '">' + client.name + '</div>';
    }).join('');

    container.querySelectorAll('.client-chip').forEach(function(chip) {
      chip.addEventListener('click', function() {
        selectClient(this.dataset.clientId);
      });
    });
  }

  function renderAllClients(clients) {
    var container = document.getElementById('all-clients');
    if (!clients || clients.length === 0) {
      container.innerHTML = '<p class="placeholder-text">Клиентов пока нет</p>';
      return;
    }

    container.innerHTML = clients.map(function(client) {
      var initials = client.name ? client.name.charAt(0).toUpperCase() : '?';
      var meta = client.status === 'active' ? 'Подключён' : 'Не подключён';
      var badgeClass = client.status === 'active' ? '' : 'pending';

      return (
        '<div class="client-item" data-client-id="' + client.id + '">' +
          '<div class="client-item__avatar">' + initials + '</div>' +
          '<div class="client-item__info">' +
            '<div class="client-item__name">' + client.name + '</div>' +
            '<div class="client-item__meta">' + meta + '</div>' +
          '</div>' +
          '<div class="client-item__badge ' + badgeClass + '"></div>' +
        '</div>'
      );
    }).join('');

    container.querySelectorAll('.client-item').forEach(function(item) {
      item.addEventListener('click', function() {
        selectClient(this.dataset.clientId);
      });
    });
  }

  function openClientPicker() {
    clientPicker.classList.add('active');
  }

  function closeClientPicker() {
    clientPicker.classList.remove('active');
  }

  function selectClient(clientId) {
    var client = ClientsStore.getById(clientId);
    if (!client) return;

    selectedClient = client;
    
    document.getElementById('client-selector-text').textContent = client.name;
    document.getElementById('client-selector').classList.remove('placeholder');
    
    closeClientPicker();
    
    // Активируем кнопку сохранения
    document.getElementById('modal-save').disabled = false;
  }

  function filterClients() {
    var query = document.getElementById('client-search').value.toLowerCase();
    var items = document.querySelectorAll('.client-item');
    
    items.forEach(function(item) {
      var name = item.querySelector('.client-item__name').textContent.toLowerCase();
      if (name.includes(query)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  }

  function toggleFullMode() {
    if (currentMode === 'quick') {
      currentMode = 'full';
      modal.classList.remove('quick');
      modal.classList.add('full');
      document.getElementById('full-form-fields').style.display = 'block';
      document.getElementById('expand-btn').querySelector('span:last-child').textContent = '↓';
    } else {
      currentMode = 'quick';
      modal.classList.remove('full');
      modal.classList.add('quick');
      document.getElementById('full-form-fields').style.display = 'none';
      document.getElementById('expand-btn').querySelector('span:last-child').textContent = '↑';
    }
  }

  function addNewClient() {
    var name = prompt('Введите имя клиента:');
    if (!name) return;

    ClientsStore.create({ name: name }).then(function(client) {
      loadClients();
      selectClient(client.id);
    }).catch(function(error) {
      alert('Ошибка создания клиента: ' + error.message);
    });
  }

function save() {
  if (!selectedClient) return;

  var dateInput = document.getElementById('workout-date');
  var timeInput = document.getElementById('workout-time');
  var costInput = document.getElementById('workout-cost');
  
  var durationChip = document.querySelector('[data-duration].active');
  var duration = durationChip ? parseInt(durationChip.dataset.duration, 10) : 60;

  var workoutData = {
    client_id: selectedClient.id,
    client_name: selectedClient.name,
    type: selectedType,
    workout_date: dateInput.value || workoutDate,
    start_time: timeInput.value || workoutTime,
    duration: duration,
    cost: costInput.value ? parseFloat(costInput.value) : null,
    status: 'planned',
    trainer_tg_id: window.trainerTgId
  };

  // Блокируем кнопку
  var saveBtn = document.getElementById('modal-save');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Сохранение...';

  if (onSaveCallback) {
    var result = onSaveCallback(workoutData);
    
    if (result && result.then) {
      result
        .then(function() {
          close();
        })
        .catch(function(error) {
          console.error('[WorkoutModal] Ошибка:', error);
          alert('Ошибка сохранения: ' + (error.message || 'Неизвестная ошибка'));
          saveBtn.disabled = false;
          saveBtn.textContent = 'Сохранить';
        });
    } else {
      close();
    }
  } else {
    close();
  }
}

  return {
    init: init,
    open: open,
    close: close
  };
})();

window.WorkoutModal = WorkoutModal;
