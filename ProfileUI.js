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
      <div class="stats-modal-overlay" id="experience-modal-overlay"></div>
      <div class="stats-modal" id="experience-modal">
        <div class="stats-modal__header">
          <button class="stats-modal__close" data-modal="experience">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
          <h2 class="stats-modal__title">Опыт</h2>
          <div style="width: 24px;"></div>
        </div>
        <div class="stats-modal__content">
          <input type="text" class="stats-modal__input stats-modal__input--large" id="experience-input" placeholder="0">
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

// ─── Добавляет HTML структуру в DOM один раз при инициализации ───
  function initDOM() {
    var container = document.body;
    // Проверяем, не уже ли добавлена структура
    var existing = document.getElementById('role-selector-overlay');
    
    if (!existing) {
      var tempDiv = document.createElement('div');
      tempDiv.innerHTML = createProfileHTML();
      
      // Перемещаем все элементы из временного контейнера в body
      while (tempDiv.firstElementChild) {
        container.appendChild(tempDiv.firstElementChild);
      }
    }
  }

// ─── Показывает селектор выбора роли (добавляет класс active) ───
  function showRoleSelector() {
    var overlay = document.getElementById('role-selector-overlay');
    var panel = document.getElementById('role-selector-panel');
    
    if (overlay && panel) {
      overlay.classList.add('active');
      panel.classList.add('active');
      console.log('[ProfileUI] Role selector shown');
    }
  }

// ─── Скрывает селектор выбора роли (удаляет класс active) ───
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
    // 1️⃣ UPSERT вместо UPDATE — создаст запись, если её нет
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

    // 2️⃣ Получаем user_id
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

    // 3️⃣ Создаём запись в trainers или clients
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

// ─── Привязывает события к кнопкам выбора роли (Тренер/Клиент) ───
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
      <div class="profile-card__name">${escapeHtml(profile.displayName || 'Тренер')}</div>
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

// ─── Обновить элемент с именем тренера ───
// ─── Установить редактор имени ───
function setupDisplayNameEditor(userTgId, displayName) {
  var nameElement = document.querySelector('[data-profile-name]');
  
  if (!nameElement) return;

  // Получаем username из Telegram если нет displayName
  var currentName = displayName;
  if (!currentName || currentName === 'null') {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe) {
      var user = window.Telegram.WebApp.initDataUnsafe.user;
      if (user && user.username) {
        currentName = user.username;
      }
    }
  }

  if (!currentName) {
    currentName = 'Тренер';
  }

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
}

// ─── Сохранить имя ───
async function saveDisplayName(userTgId, displayName) {
  if (!window.sb) return;

  try {
    var updateRes = await window.sb
      .from('trainers')
      .update({ display_name: displayName })
      .eq('telegram_id', parseInt(userTgId));

    if (updateRes.error) {
      console.error('[ProfileUI] Ошибка при сохранении:', updateRes.error);
    }
  } catch (err) {
    console.error('[ProfileUI] Ошибка:', err);
  }
}

// ─── Режим редактирования ───
function enterEditMode(nameElement, userTgId, currentName) {
  console.log('[ProfileUI] Режим редактирования включен');

  // Создаём input
  var input = document.createElement('input');
  input.type = 'text';
  input.value = currentName;
  input.className = 'name-edit-input';
  input.style.cssText = `
    font-size: 24px;
    font-weight: 600;
    padding: 8px;
    border: 2px solid #007AFF;
    border-radius: 6px;
    font-family: inherit;
    width: 200px;
  `;

  // Заменяем текст на input
  nameElement.textContent = '';
  nameElement.appendChild(input);
  input.focus();
  input.select();

  // Функция сохранения
  function saveChanges() {
    var newName = input.value.trim();
    
    if (!newName) {
      exitEditMode(nameElement, currentName);
      return;
    }

    console.log('[ProfileUI] Сохраняю имя:', newName);
    
    // Отправляем на сервер
    saveDisplayName(userTgId, newName);
    currentName = newName;
    exitEditMode(nameElement, newName);
  }

  // Enter — сохранить
  input.onkeydown = function(e) {
    if (e.key === 'Enter') {
      saveChanges();
    } else if (e.key === 'Escape') {
      exitEditMode(nameElement, currentName);
    }
  };

  // Blur — сохранить
  input.onblur = function() {
    saveChanges();
  };
}

// ─── Выход из режима редактирования ───
function exitEditMode(nameElement, displayName) {
  console.log('[ProfileUI] Выход из режима редактирования');
  
  nameElement.textContent = displayName;
  nameElement.style.opacity = '1';
  nameElement.style.cursor = 'pointer';
  nameElement.title = 'Нажмите для редактирования';
}

// ─── Обновлённая функция сохранения ───
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
      alert('Ошибка при сохранении');
      return;
    }

    console.log('[ProfileUI] ✅ displayName сохранён');

  } catch (err) {
    console.error('[ProfileUI] Ошибка:', err);
    alert('Ошибка. Попробуйте позже.');
  }
}

// ─── Сохранить имя в БД ───
async function saveDisplayName(userTgId, displayName) {
  if (!window.sb) {
    console.error('[ProfileUI] Supabase не инициализирован');
    return;
  }

  console.log('[ProfileUI] Сохраняю displayName:', displayName);

  try {
    // Обновляем trainers таблицу
    var updateRes = await window.sb
      .from('trainers')
      .update({ display_name: displayName })
      .eq('telegram_id', parseInt(userTgId));

    if (updateRes.error) {
      console.error('[ProfileUI] Ошибка при сохранении:', updateRes.error);
      alert('Ошибка при сохранении. Попробуйте позже.');
      return;
    }

    console.log('[ProfileUI] ✅ displayName сохранён');

    // Скрываем форму
    var container = document.querySelector('.onboarding-container');
    if (container) {
      container.remove();
    }

    // Перезагружаем профиль
    if (window.ProfileStore) {
      ProfileStore.init(userTgId);
    }

  } catch (err) {
    console.error('[ProfileUI] Критическая ошибка:', err);
    alert('Ошибка. Попробуйте позже.');
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

// ─── Отображает профиль в панель (выбирает шаблон по роли) ───
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

    // Выбираем шаблон в зависимости от роли
    var html = profile.role === 'trainer' 
      ? renderTrainerProfile(profile)
      : renderClientProfile(profile);

    content.innerHTML = html;

    // Привязываем события к новым элементам
    bindEvents();
  }

// ─── Привязывает события к элементам внутри профиля ───
function bindEvents() {
  // Кнопка назад для закрытия профиля
  var backBtn = document.getElementById('profile-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', close);
  }

  // Клик по каждому значению статистики открывает модаль
  var statItems = document.querySelectorAll('.profile-card__stat-item');
  statItems.forEach(function(item, index) {
    item.addEventListener('click', function() {
      var fields = ['experience', 'specializations', 'rating'];
      openStatsModal(fields[index], currentProfile);
    });
  });

  // Toggle для включения/отключения уведомлений
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

// ─── Открывает панель профиля (показывает с анимацией) ───
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

// ─── Закрывает панель профиля (скрывает с анимацией) ───
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
    // Профиль закрывается при клике на overlay
    var profileOverlay = document.getElementById('profile-overlay');
    if (profileOverlay) {
      profileOverlay.addEventListener('click', close);
    }

    // Role selector НЕ закрывается при клике - остаётся открыт
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

    // Создаём DOM первым
    initDOM();

    // Привязываем события overlay
    setupOverlayClick();
    setupStatsModalEvents();

    // Привязываем события селектора роли
    bindRoleSelectorEvents(userTgId);

    // Привязываем клик к кнопке аватара (открывает профиль)
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

    // Подписываемся на обновления профиля из ProfileStore
    if (window.ProfileStore) {
      console.log('[ProfileUI] Подписываемся на ProfileStore');
      
      ProfileStore.subscribe(function(profile) {
        console.log('[ProfileUI] Получили профиль из Store:', profile);
        currentProfile = profile;
        
        // Если роль не установлена — показываем селектор
        if (profile && profile.role === null) {
          console.log('[ProfileUI] Роль не установлена, показываю селектор');
          showRoleSelector();
        } else if (profile && profile.role) {
          // Роль установлена — скрываем селектор
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
    // Заполняем текущее значение из профиля
    var input = document.getElementById(field + '-input');
    if (input) {
      input.value = profile[field] || '';
      input.focus();
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

// ─── Привязывает события ко всем трём модалям (опыт, специализация, рейтинг) ───
function setupStatsModalEvents() {
  var fields = ['experience', 'specializations', 'rating'];
  
  fields.forEach(function(field) {
    var overlay = document.getElementById(field + '-modal-overlay');
    
    // Клик на overlay закрывает модаль
    if (overlay) {
      overlay.addEventListener('click', function() {
        closeStatsModal(field);
      });
    }

    // Все кнопки закрытия (крест и отмена) закрывают модаль
    document.querySelectorAll('[data-modal="' + field + '"]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        closeStatsModal(field);
      });
    });

    // Кнопка сохранения берёт значение и закрывает модаль
    var saveBtn = document.querySelector('[data-save="' + field + '"]');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        var input = document.getElementById(field + '-input');
        var value = input.value;

        console.log('[ProfileUI] Saving ' + field + ':', value);
        // На следующем шаге будет сохранение в БД через Supabase
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
