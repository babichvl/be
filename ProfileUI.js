// ═══════════════════════════════════════════════════════════
// PROFILEUI.JS — UI профиля + селектор роли (объединено)
// ═══════════════════════════════════════════════════════════

// ─── IIFE (Immediately Invoked Function Expression) для инкапсуляции ───
var ProfileUI = (function() {
  // Флаг открыта ли панель профиля
  var isOpen = false;
  // Текущий профиль пользователя
  var currentProfile = null;

// ─── Генерирует полную HTML структуру селектора роли и профиля ───
  function createProfileHTML() {
    var html = `
      <!-- ─── Role Selector — Панель выбора роли при первом входе ───── -->
      <div class="role-selector-overlay" id="role-selector-overlay"></div>
      <div class="role-selector-panel" id="role-selector-panel">
        <div class="role-selector-card">
          <h1 class="role-selector-title">Выберите вашу роль</h1>
          <p class="role-selector-subtitle">Это определит, какие функции вам будут доступны</p>
          <div class="role-selector-buttons">
            <button id="role-btn-trainer" class="role-selector-btn role-selector-btn--trainer">
              <div class="role-selector-btn__icon">👨‍🏫</div>
              <div class="role-selector-btn__title">Я тренер</div>
              <div class="role-selector-btn__desc">Управляю расписанием и клиентами</div>
            </button>
            <button id="role-btn-client" class="role-selector-btn role-selector-btn--client">
              <div class="role-selector-btn__icon">💪</div>
              <div class="role-selector-btn__title">Я клиент</div>
              <div class="role-selector-btn__desc">Смотрю расписание тренировок</div>
            </button>
          </div>
        </div>
      </div>

      <!-- ─── Profile Panel — Основная панель профиля, выезжает с низу ───── -->
      <div class="profile-overlay" id="profile-overlay"></div>
      <div class="profile-panel" id="profile-panel">
        <div class="profile-panel__handle"></div>
        <div class="profile-panel__header">
          <button class="profile-panel__back-btn" id="profile-back-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
        </div>
        <div class="profile-panel__content" id="profile-content">
          <!-- Содержимое будет загружаться здесь -->
        </div>
      </div>

<!-- ─── Experience Modal — Модаль редактирования опыта ───── -->
<!-- ─── Experience Modal — Модаль редактирования опыта с 2 полями ───── -->
<div class="stats-modal-overlay" id="experience-modal-overlay"></div>
<div class="stats-modal" id="experience-modal">
  <div class="stats-modal__header">
    <button class="stats-modal__close" data-modal="experience">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
    <h2 class="stats-modal__title" id="experience-modal-title">Опыт</h2>
    <div style="width: 24px;"></div>
  </div>
  <div class="stats-modal__content">
    <div class="stats-modal__field">
      <label class="stats-modal__label">Количество лет</label>
      <input type="number" class="stats-modal__input" id="experience-years-input" placeholder="0" min="0" max="100">
    </div>
    <div class="stats-modal__field">
      <label class="stats-modal__label">Описание опыта</label>
      <textarea class="stats-modal__textarea" id="experience-description-input" placeholder="Расскажите о вашем опыте работы..."></textarea>
    </div>
  </div>
  <div class="stats-modal__footer">
    <button class="stats-modal__btn stats-modal__btn--cancel" data-modal="experience">Отменить</button>
    <button class="stats-modal__btn stats-modal__btn--save" data-save="experience">Сохранить</button>
  </div>
</div>

      <!-- ─── Specializations Modal — Модаль редактирования специализации ───── -->
      <div class="stats-modal-overlay" id="specializations-modal-overlay"></div>
      <div class="stats-modal" id="specializations-modal">
        <div class="stats-modal__header">
          <button class="stats-modal__close" data-modal="specializations">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
          <h2 class="stats-modal__title">Специализация</h2>
          <div style="width: 24px;"></div>
        </div>
        <div class="stats-modal__content">
          <input type="text" class="stats-modal__input stats-modal__input--large" id="specializations-input" placeholder="0">
        </div>
        <div class="stats-modal__footer">
          <button class="stats-modal__btn stats-modal__btn--cancel" data-modal="specializations">Отменить</button>
          <button class="stats-modal__btn stats-modal__btn--save" data-save="specializations">Сохранить</button>
        </div>
      </div>

      <!-- ─── Rating Modal — Модаль редактирования рейтинга ───── -->
      <div class="stats-modal-overlay" id="rating-modal-overlay"></div>
      <div class="stats-modal" id="rating-modal">
        <div class="stats-modal__header">
          <button class="stats-modal__close" data-modal="rating">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
          <h2 class="stats-modal__title">Рейтинг</h2>
          <div style="width: 24px;"></div>
        </div>
        <div class="stats-modal__content">
          <input type="text" class="stats-modal__input stats-modal__input--large" id="rating-input" placeholder="0.0" step="0.1" min="0" max="5">
        </div>
        <div class="stats-modal__footer">
          <button class="stats-modal__btn stats-modal__btn--cancel" data-modal="rating">Отменить</button>
          <button class="stats-modal__btn stats-modal__btn--save" data-save="rating">Сохранить</button>
        </div>
      </div>
    `;
    return html;
  }

// ─── Универсальная функция для сохранения полей профиля ───
async function saveProfileField(userTgId, fieldName, fieldValue) {
  if (!window.sb) {
    console.error('[ProfileUI] Supabase не инициализирован');
    return;
  }

  console.log('[ProfileUI] Отправляю', fieldName, '=', fieldValue);

  try {
    var updateData = {};
    
    // Парсим значение в зависимости от типа поля
    if (fieldName === 'experience') {
      // Приводим к числу
      var numValue = parseInt(fieldValue);
      if (isNaN(numValue) || numValue < 0) {
        console.warn('[ProfileUI] Невалидное значение для experience:', fieldValue, 'используем 0');
        numValue = 0;
      }
      updateData['experience'] = numValue;
    } else if (fieldName === 'rating') {
      // Приводим к числу с точкой
      var numValue = parseFloat(fieldValue);
      if (isNaN(numValue) || numValue < 0 || numValue > 5) {
        console.warn('[ProfileUI] Невалидное значение для rating:', fieldValue, 'используем 0');
        numValue = 0;
      }
      updateData['rating'] = numValue;
    } else {
      // Для остальных полей (текст)
      updateData[fieldName] = String(fieldValue || '');
    }

    console.log('[ProfileUI] Финальные данные:', updateData);

    var updateRes = await window.sb
      .from('trainers')
      .update(updateData)
      .eq('telegram_id', parseInt(userTgId));

    if (updateRes.error) {
      console.error('[ProfileUI] Ошибка при сохранении:', updateRes.error);
      alert('Ошибка при сохранении');
      return;
    }

    console.log('[ProfileUI] ✅ Данные сохранены');

    // Обновляем локальный профиль
    if (currentProfile) {
      Object.keys(updateData).forEach(function(key) {
        currentProfile[key] = updateData[key];
      });
      
      if (isOpen) {
        render(currentProfile);
      }
    }

  } catch (err) {
    console.error('[ProfileUI] Ошибка:', err);
    alert('Ошибка. Попробуйте позже.');
  }
}
  
// ─── Добавляет HTML структуру в DOM один раз при инициализации ───
  function initDOM() {
    var container = document.body;
    var existing = document.getElementById('role-selector-overlay');
    
    if (!existing) {
      var tempDiv = document.createElement('div');
      tempDiv.innerHTML = createProfileHTML();
      
      while (tempDiv.firstElementChild) {
        container.appendChild(tempDiv.firstElementChild);
      }
    }
  }

// ─── Показывает селектор выбора роли ───
  function showRoleSelector() {
    var overlay = document.getElementById('role-selector-overlay');
    var panel = document.getElementById('role-selector-panel');
    
    if (overlay && panel) {
      overlay.classList.add('active');
      panel.classList.add('active');
      console.log('[ProfileUI] Role selector shown');
    }
  }

// ─── Скрывает селектор выбора роли ───
  function hideRoleSelector() {
    var overlay = document.getElementById('role-selector-overlay');
    var panel = document.getElementById('role-selector-panel');
    
    if (overlay && panel) {
      overlay.classList.remove('active');
      panel.classList.remove('active');
      console.log('[ProfileUI] Role selector hidden');
    }
  }

// ─── Сохраняет выбранную роль в Supabase ───
async function saveRole(userTgId, role, callback) {
  if (!window.sb) {
    console.error('[ProfileUI] Supabase не инициализирован');
    if (callback) callback(null);
    return;
  }

  console.log('[ProfileUI] Сохраняю роль:', role, 'для telegram_id:', userTgId);

  try {
    var upsertRes = await window.sb
      .from('users')
      .upsert([{ 
        telegram_id: parseInt(userTgId),
        role: role 
      }], { onConflict: 'telegram_id' });

    if (upsertRes.error) {
      console.error('[ProfileUI] Ошибка upsert:', upsertRes.error);
      if (callback) callback(null);
      return;
    }

    console.log('[ProfileUI] ✅ Запись в users создана/обновлена');

    var userRes = await window.sb
      .from('users')
      .select('id')
      .eq('telegram_id', parseInt(userTgId))
      .single();

    if (userRes.error || !userRes.data) {
      console.error('[ProfileUI] Не удалось получить user_id:', userRes.error);
      if (callback) callback(null);
      return;
    }

    var userId = userRes.data.id;
    console.log('[ProfileUI] ✅ Получен user_id:', userId);

    var table = role === 'trainer' ? 'trainers' : 'clients';
    var insertRes = await window.sb
      .from(table)
      .insert([{
        user_id: userId,
        telegram_id: parseInt(userTgId)
      }]);

    if (insertRes.error) {
      console.error('[ProfileUI] ❌ ОШИБКА ВСТАВКИ:', insertRes.error);
    } else {
      console.log('[ProfileUI] ✅ Запись в', table, 'создана');
    }

    hideRoleSelector();

    if (window.ProfileStore) {
      ProfileStore.init(userTgId);
    }

    if (callback) callback(role);

  } catch (err) {
    console.error('[ProfileUI] Критическая ошибка:', err);
    if (callback) callback(null);
  }
}

// ─── Привязывает события к кнопкам выбора роли ───
  function bindRoleSelectorEvents(userTgId) {
    var trainerBtn = document.getElementById('role-btn-trainer');
    var clientBtn = document.getElementById('role-btn-client');

    if (trainerBtn) {
      trainerBtn.onclick = function() {
        saveRole(userTgId, 'trainer', function() {
          // После сохранения профиль загружается через ProfileStore
        });
      };
    }

    if (clientBtn) {
      clientBtn.onclick = function() {
        saveRole(userTgId, 'client', function() {
          // После сохранения профиль загружается через ProfileStore
        });
      };
    }
  }

// ─── Генерирует HTML карточки профиля для тренера ───
  function renderTrainerProfile(profile) {
    var initials = profile.displayName 
      ? profile.displayName.split(' ').map(n => n[0]).join('') 
      : 'T';

    return `
<div class="profile-card">
  <div class="profile-card__top">
    <div class="profile-card__avatar">
      <div class="profile-card__avatar-img">
        ${profile.photoUrl 
          ? `<img src="${profile.photoUrl}" alt="${profile.displayName}" style="width: 100%; height: 100%; object-fit: cover;">`
          : initials
        }
      </div>
      <div class="profile-card__status ${profile.isOnline ? '' : 'offline'}"></div>
    </div>
    <div class="profile-card__info">
      <div class="profile-card__name" data-profile-name>${escapeHtml(profile.displayName || 'Тренер')}</div>
      <div class="profile-card__role">Тренер</div>
    </div>
    <button class="profile-card__pro-btn">PRO+</button>
  </div>

  <div class="profile-card__stats">
    <div class="profile-card__stat-item">
      <div class="profile-card__stat-value">${profile.experience || '0'} лет</div>
      <div class="profile-card__stat-label">Опыт</div>
    </div>
    <div class="profile-card__stat-item">
      <div class="profile-card__stat-value">${profile.specializations || '0'} типов</div>
      <div class="profile-card__stat-label">Специализация</div>
    </div>
    <div class="profile-card__stat-item">
      <div class="profile-card__stat-value">${profile.rating || '0.0'}</div>
      <div class="profile-card__stat-label">Рейтинг</div>
    </div>
  </div>
</div>

<!-- ─── АККАУНТ ─────────────────── -->
      <!-- Account Section -->
      <div class="profile-section">
        <div class="profile-section__title">Аккаунт</div>
        <div class="profile-section__items">
          <div class="profile-item">
            <div class="profile-item__label">
              <span class="profile-item__icon">👤</span>
              <span class="profile-item__link">Персональная страница</span>
            </div>
            <span class="profile-item__arrow">›</span>
          </div>
          <div class="profile-item">
            <div class="profile-item__label">
              <span class="profile-item__icon">🏪</span>
              <span class="profile-item__link">Маркетплейс</span>
            </div>
            <span class="profile-item__arrow">›</span>
          </div>
          <div class="profile-item">
            <div class="profile-item__label">
              <span class="profile-item__icon">🏆</span>
              <span class="profile-item__link">Челленджи</span>
            </div>
            <span class="profile-item__arrow">›</span>
          </div>
          <div class="profile-item">
            <div class="profile-item__label">
              <span class="profile-item__icon">🤝</span>
              <span class="profile-item__link">Партнёрская программа</span>
            </div>
            <span class="profile-item__arrow">›</span>
          </div>
        </div>
      </div>
      
   <!-- ─── УВЕДОМЛЕНИЯ ─────────────────── -->
   
      <!-- Notification Section -->
      <div class="profile-section">
        <div class="profile-section__title">Уведомления</div>
        <div class="profile-section__items">
          <div class="profile-item">
            <div class="profile-item__label">
              <span class="profile-item__icon">🔔</span>
              <span>Push-уведомления</span>
            </div>
            <button class="profile-item__toggle ${profile.notificationsEnabled ? 'active' : ''}" 
                    id="profile-notifications-toggle"
                    data-enabled="${profile.notificationsEnabled ? 'true' : 'false'}">
            </button>
          </div>
        </div>
      </div>

<!-- ─── ДРУГОЕ ─────────────────── -->

      <!-- Other Section -->
      <div class="profile-section">
        <div class="profile-section__title">Другое</div>
        <div class="profile-section__items">
          <div class="profile-item">
            <div class="profile-item__label">
              <span class="profile-item__icon">ℹ️</span>
              <span>О приложении</span>
            </div>
            <span class="profile-item__arrow">›</span>
          </div>
          <div class="profile-item">
            <div class="profile-item__label">
              <span class="profile-item__icon">⚙️</span>
              <span>Настройки</span>
            </div>
            <span class="profile-item__arrow">›</span>
          </div>
        </div>
      </div>
    `;
  }

// ─── Установить редактор имени ───
function setupDisplayNameEditor(userTgId, displayName) {
  var nameElement = document.querySelector('[data-profile-name]');
  
  if (!nameElement) {
    console.log('[ProfileUI] ⚠️ [data-profile-name] не найден');
    return;
  }

  var currentName = displayName;
  console.log('[ProfileUI] setupDisplayNameEditor: displayName из профиля =', displayName);

  // Если нет имени в БД, пытаемся получить данные из Telegram
  if (!currentName || currentName === 'null') {
    console.log('[ProfileUI] displayName пуст, ищу данные в Telegram...');
    
    var tgData = null;
    
    // Способ 1: initDataUnsafe
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe) {
      tgData = window.Telegram.WebApp.initDataUnsafe.user;
      console.log('[ProfileUI] initDataUnsafe.user =', tgData);
    }
    
    // Способ 2: Если не сработал, пробуем initData парсить
    if (!tgData && window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
      try {
        var params = new URLSearchParams(window.Telegram.WebApp.initData);
        var userJson = params.get('user');
        if (userJson) {
          tgData = JSON.parse(userJson);
          console.log('[ProfileUI] Распарсил user из initData:', tgData);
        }
      } catch (e) {
        console.log('[ProfileUI] Ошибка парса initData:', e);
      }
    }
    
    // Способ 3: Берём данные прямо из WebApp
    if (!tgData && window.Telegram && window.Telegram.WebApp) {
      tgData = {
        first_name: window.Telegram.WebApp.initDataUnsafe?.user?.first_name,
        last_name: window.Telegram.WebApp.initDataUnsafe?.user?.last_name,
        username: window.Telegram.WebApp.initDataUnsafe?.user?.username,
        id: window.Telegram.WebApp.initDataUnsafe?.user?.id
      };
      console.log('[ProfileUI] Собрал user с помощью optional chaining:', tgData);
    }
    
    if (tgData) {
      console.log('[ProfileUI] Telegram данные:', tgData);
      
      // Приоритет: first_name + last_name, потом username, потом ID
      if (tgData.first_name) {
        currentName = tgData.first_name;
        if (tgData.last_name) {
          currentName += ' ' + tgData.last_name;
        }
        console.log('[ProfileUI] ✅ Использую имя:', currentName);
      } else if (tgData.username) {
        currentName = '@' + tgData.username;
        console.log('[ProfileUI] ✅ Использую username:', currentName);
      } else if (tgData.id) {
        currentName = 'Тренер #' + tgData.id;
        console.log('[ProfileUI] ✅ Использую ID:', currentName);
      }
    } else {
      console.log('[ProfileUI] ⚠️ Telegram данные не найдены ни одним способом');
    }
  }

  if (!currentName) {
    currentName = 'Тренер';
  }

  console.log('[ProfileUI] Финальное имя:', currentName);
  nameElement.textContent = currentName;
  nameElement.style.cursor = 'pointer';
  nameElement.style.opacity = '0.8';
  nameElement.title = 'Нажмите для редактирования';

  nameElement.onclick = function(e) {
    e.stopPropagation();
    enterEditMode(nameElement, userTgId, currentName);
  };
}


// ─── Режим редактирования ───
function enterEditMode(nameElement, userTgId, currentName) {
  var input = document.createElement('input');
  input.type = 'text';
  input.value = currentName;
  input.style.cssText = `
    font-size: 24px;
    font-weight: 600;
    padding: 8px;
    border: 2px solid #007AFF;
    border-radius: 6px;
    font-family: inherit;
    width: 200px;
  `;

  nameElement.textContent = '';
  nameElement.appendChild(input);
  input.focus();
  input.select();

  function saveChanges() {
    var newName = input.value.trim();
    if (!newName) {
      exitEditMode(nameElement, currentName);
      return;
    }
    saveDisplayName(userTgId, newName);
    currentName = newName;
    exitEditMode(nameElement, newName);
  }

  input.onkeydown = function(e) {
    if (e.key === 'Enter') {
      saveChanges();
    } else if (e.key === 'Escape') {
      exitEditMode(nameElement, currentName);
    }
  };

  input.onblur = function() {
    saveChanges();
  };
}

// ─── Выход из редактирования ───
function exitEditMode(nameElement, displayName) {
  nameElement.textContent = displayName;
  nameElement.style.opacity = '1';
  nameElement.style.cursor = 'pointer';
  nameElement.title = 'Нажмите для редактирования';
}

// ─── Сохранить имя ───
async function saveDisplayName(userTgId, displayName) {
  if (!window.sb) {
    console.error('[ProfileUI] Supabase не инициализирован');
    return;
  }

  console.log('[ProfileUI] Сохраняю displayName:', displayName);

  try {
    var updateRes = await window.sb
      .from('trainers')
      .update({ display_name: displayName })
      .eq('telegram_id', parseInt(userTgId));

    if (updateRes.error) {
      console.error('[ProfileUI] Ошибка при сохранении:', updateRes.error);
      return;
    }

    console.log('[ProfileUI] ✅ displayName сохранён');

  } catch (err) {
    console.error('[ProfileUI] Ошибка:', err);
  }
}

// ─── Генерирует HTML карточки профиля для клиента ───
  function renderClientProfile(profile) {
    var initials = profile.name 
      ? profile.name.split(' ').map(n => n[0]).join('') 
      : 'C';

    return `
      <div class="profile-card">
        <div class="profile-card__avatar">
          <div class="profile-card__avatar-img">
            ${profile.photoUrl 
              ? `<img src="${profile.photoUrl}" alt="${profile.name}" style="width: 100%; height: 100%; object-fit: cover;">`
              : initials
            }
          </div>
          <div class="profile-card__status ${profile.isOnline ? '' : 'offline'}"></div>
        </div>
        <div class="profile-card__info">
          <div class="profile-card__name">${escapeHtml(profile.name || 'Клиент')}</div>
          <div class="profile-card__role">Клиент</div>
        </div>
      </div>
    `;
  }

// ─── Экранирует HTML специальные символы для безопасности ───
  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

// ─── Отображает профиль в панель ───
  function render(profile) {
    var content = document.getElementById('profile-content');
    if (!content) return;

    if (!profile) {
      content.innerHTML = '<div class="profile-empty">Загружаю профиль...</div>';
      return;
    }

    if (profile.role === null) {
      content.innerHTML = '<div class="profile-empty">Роль не установлена...</div>';
      return;
    }

    var html = profile.role === 'trainer' 
      ? renderTrainerProfile(profile)
      : renderClientProfile(profile);

    content.innerHTML = html;
    bindEvents();
  }

// ─── Привязывает события к элементам внутри профиля ───
function bindEvents() {
  var backBtn = document.getElementById('profile-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', close);
  }

  // Установить редактор имени если это тренер
  if (currentProfile && currentProfile.role === 'trainer') {
    setupDisplayNameEditor(currentProfile.userTgId, currentProfile.displayName);
  }

  var statItems = document.querySelectorAll('.profile-card__stat-item');
  statItems.forEach(function(item, index) {
    item.addEventListener('click', function() {
      var fields = ['experience', 'specializations', 'rating'];
      openStatsModal(fields[index], currentProfile);
    });
  });

  var notificationToggle = document.getElementById('profile-notifications-toggle');
  if (notificationToggle) {
    notificationToggle.addEventListener('click', function() {
      this.classList.toggle('active');
      var isEnabled = this.classList.contains('active');
      console.log('[ProfileUI] Notifications toggled:', isEnabled);
    });
  }

  var logoutBtn = document.getElementById('profile-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      if (confirm('Вы уверены?')) {
        console.log('[ProfileUI] Logout clicked');
      }
    });
  }
}

// ─── Открывает панель профиля ───
  function open() {
    console.log('[ProfileUI] open() вызвана, isOpen=', isOpen);
    
    if (isOpen) {
      console.log('[ProfileUI] ⚠️ Уже открыта');
      return;
    }
    
    isOpen = true;
    var overlay = document.getElementById('profile-overlay');
    var panel = document.getElementById('profile-panel');
    
    console.log('[ProfileUI] overlay найден?', !!overlay);
    console.log('[ProfileUI] panel найден?', !!panel);
    
    if (overlay && panel) {
      overlay.classList.add('active');
      panel.classList.add('active');
      
      if (currentProfile) {
        render(currentProfile);
      } else {
        render(null);
      }
      
      console.log('[ProfileUI] ✅ Profile opened successfully');
    } else {
      console.error('[ProfileUI] ❌ overlay или panel не найдены!');
    }
  }

// ─── Закрывает панель профиля ───
  function close() {
    if (!isOpen) return;
    
    isOpen = false;
    var overlay = document.getElementById('profile-overlay');
    var panel = document.getElementById('profile-panel');
    
    if (overlay && panel) {
      overlay.classList.remove('active');
      panel.classList.remove('active');
      console.log('[ProfileUI] Profile closed');
    }
  }

// ─── Привязывает клик на overlay для закрытия панелей ───
  function setupOverlayClick() {
    var profileOverlay = document.getElementById('profile-overlay');
    if (profileOverlay) {
      profileOverlay.addEventListener('click', close);
    }

    var roleSelectorOverlay = document.getElementById('role-selector-overlay');
    if (roleSelectorOverlay) {
      roleSelectorOverlay.addEventListener('click', function(e) {
        if (e.target === roleSelectorOverlay) {
          console.log('[ProfileUI] Role selector should stay open');
        }
      });
    }
  }

// ─── Главная инициализация ProfileUI ───
  function init(userTgId) {
    console.log('[ProfileUI] init() вызван с userTgId:', userTgId);

    initDOM();
    setupOverlayClick();
    setupStatsModalEvents();
    bindRoleSelectorEvents(userTgId);

    var avatarBtns = document.querySelectorAll('.page-header__avatar');
    console.log('[ProfileUI] 🔍 Найдено кнопок аватара:', avatarBtns.length);
    
    avatarBtns.forEach(function(btn, index) {
      console.log('[ProfileUI] 🔗 Привязываю клик к кнопке #' + index);
      btn.addEventListener('click', function(e) {
        console.log('[ProfileUI] 🎯 КЛИК ПО АВАТАРУ!');
        e.preventDefault();
        open();
      });
    });

    if (window.ProfileStore) {
      console.log('[ProfileUI] Подписываемся на ProfileStore');
      
      ProfileStore.subscribe(function(profile) {
        console.log('[ProfileUI] Получили профиль из Store:', profile);
        currentProfile = profile;
        
        if (profile && profile.role === null) {
          console.log('[ProfileUI] Роль не установлена, показываю селектор');
          showRoleSelector();
        } else if (profile && profile.role) {
          console.log('[ProfileUI] Роль установлена:', profile.role);
          hideRoleSelector();
          if (isOpen) {
            render(profile);
          }
        }
      });
      
      if (userTgId) {
        console.log('[ProfileUI] Вызываю ProfileStore.init(' + userTgId + ')');
        ProfileStore.init(userTgId);
      } else {
        console.warn('[ProfileUI] ⚠️ userTgId не передан!');
      }
    } else {
      console.error('[ProfileUI] ❌ ProfileStore НЕ найден!');
    }

    console.log('[ProfileUI] ✅ Инициализирован');
  }

// ─── Открывает модаль редактирования статистики ───
function openStatsModal(field, profile) {
  var modal = document.getElementById(field + '-modal');
  var overlay = document.getElementById(field + '-modal-overlay');
  
  if (modal && overlay) {
    // Специальная обработка для Experience
    if (field === 'experience') {
      var yearsInput = document.getElementById('experience-years-input');
      var descriptionInput = document.getElementById('experience-description-input');
      var titleElement = document.getElementById('experience-modal-title');
      
      // Заполняем текущие значения (если они есть)
      // Предполагаем, что в profile.experience может быть объект {years: 5, description: "..."}
      // или просто число
      if (profile.experience) {
        if (typeof profile.experience === 'object') {
          yearsInput.value = profile.experience.years || '';
          descriptionInput.value = profile.experience.description || '';
        } else {
          yearsInput.value = profile.experience || '';
          descriptionInput.value = '';
        }
      }
      
      // Обновляем заголовок при вводе лет
      yearsInput.addEventListener('input', function() {
        var years = this.value || '0';
        titleElement.textContent = years + ' лет';
      });
      
      if (yearsInput.value) {
        titleElement.textContent = yearsInput.value + ' лет';
      }
      
      yearsInput.focus();
    } else {
      // Для остальных модалей (specializations, rating)
      var input = document.getElementById(field + '-input');
      if (input) {
        input.value = profile[field] || '';
        input.focus();
      }
    }
    
    overlay.classList.add('active');
    modal.classList.add('active');
    console.log('[ProfileUI] ' + field + ' modal opened');
  }
}

// ─── Закрывает модаль редактирования статистики ───
function closeStatsModal(field) {
  var modal = document.getElementById(field + '-modal');
  var overlay = document.getElementById(field + '-modal-overlay');
  
  if (modal && overlay) {
    overlay.classList.remove('active');
    modal.classList.remove('active');
  }
}

// ─── Привязывает события ко всем трём модалям ───
function setupStatsModalEvents() {
  var fields = ['experience', 'specializations', 'rating'];
  
  fields.forEach(function(field) {
    var overlay = document.getElementById(field + '-modal-overlay');
    
    if (overlay) {
      overlay.addEventListener('click', function() {
        closeStatsModal(field);
      });
    }

    document.querySelectorAll('[data-modal="' + field + '"]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        closeStatsModal(field);
      });
    });

var saveBtn = document.querySelector('[data-save="' + field + '"]');
if (saveBtn) {
  saveBtn.addEventListener('click', function() {
    console.log('[ProfileUI] Saving', field);
    
    if (field === 'experience') {
      var yearsInput = document.getElementById('experience-years-input');
      var descriptionInput = document.getElementById('experience-description-input');
      
      if (!yearsInput || !descriptionInput) {
        console.error('[ProfileUI] Поля не найдены!');
        return;
      }
      
      var experienceData = {
        years: parseInt(yearsInput.value) || 0,
        description: descriptionInput.value || ''
      };
      
      if (currentProfile) {
        saveProfileField(currentProfile.userTgId, 'experience_data', experienceData);
      }
      
    } else {
      // Для specializations, rating и остальных
      var input = document.getElementById(field + '-input');
      
      if (!input) {
        console.error('[ProfileUI] Input для', field, 'не найден!');
        return;
      }
      
      var value = input.value || '';
      
      if (currentProfile) {
        saveProfileField(currentProfile.userTgId, field, value);
      }
    }
    
    closeStatsModal(field);
  });
}
  });
}

// ─── Экспортируем публичный API ───
  return {
    init: init,
    openModal: open,
    closeModal: close
  };
})();

// ─── Добавляем на window для доступа из других скриптов ───
window.ProfileUI = ProfileUI;
console.log('[ProfileUI] ✅ Загружен');
