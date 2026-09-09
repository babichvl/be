// ═══════════════════════════════════════════════════════════
// PROFILEUI.JS — UI профиля + селектор роли (объединено)
// ═══════════════════════════════════════════════════════════

var ProfileUI = (function() {
  var isOpen = false;
  var currentProfile = null;

  // ─── Создаём HTML структуру ────────────────────────────────────
  function createProfileHTML() {
    var html = `
      <!-- Role Selector -->
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

      <!-- Profile Panel -->
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
    `;
    return html;
  }

  // ─── Инициализация DOM ─────────────────────────────────────────
function initDOM() {
  var container = document.body;
  var existing = document.getElementById('role-selector-overlay');
  
  if (!existing) {
    var tempDiv = document.createElement('div');
    tempDiv.innerHTML = createProfileHTML();
    
    // Перемещаем все дети
    while (tempDiv.firstElementChild) {
      container.appendChild(tempDiv.firstElementChild);
    }
  }
}

  // ─── Показать/скрыть селектор роли ────────────────────────────
  function showRoleSelector() {
    var overlay = document.getElementById('role-selector-overlay');
    var panel = document.getElementById('role-selector-panel');
    
    if (overlay && panel) {
      overlay.classList.add('active');
      panel.classList.add('active');
      console.log('[ProfileUI] Role selector shown');
    }
  }

  function hideRoleSelector() {
    var overlay = document.getElementById('role-selector-overlay');
    var panel = document.getElementById('role-selector-panel');
    
    if (overlay && panel) {
      overlay.classList.remove('active');
      panel.classList.remove('active');
      console.log('[ProfileUI] Role selector hidden');
    }
  }

  // ─── Сохранить роль в БД ──────────────────────────────────────
  function saveRole(userTgId, role, callback) {
    if (!window.sb) {
      console.error('[ProfileUI] Supabase не инициализирован');
      if (callback) callback(null);
      return;
    }

    console.log('[ProfileUI] Сохраняю роль:', role, 'для telegram_id:', userTgId);

    window.sb
      .from('users')
      .update({ role: role })
      .eq('telegram_id', userTgId)
      .then(function(res) {
        if (res.error) {
          console.error('[ProfileUI] Ошибка сохранения роли:', res.error);
          if (callback) callback(null);
          return;
        }

        console.log('[ProfileUI] ✅ Роль успешно сохранена:', role);
        hideRoleSelector();
        
        // Загружаем профиль после сохранения роли
        if (window.ProfileStore) {
          ProfileStore.init(userTgId);
        }
        
        if (callback) callback(role);
      })
      .catch(function(err) {
        console.error('[ProfileUI] Критическая ошибка сохранения роли:', err);
        if (callback) callback(null);
      });
  }

  // ─── Биндим события селектора роли ────────────────────────────
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

  // ─── Генерация HTML карточки профиля (тренер) ──────────────────
  function renderTrainerProfile(profile) {
    var initials = profile.displayName 
      ? profile.displayName.split(' ').map(n => n[0]).join('') 
      : 'T';
    
    var ratingHTML = profile.rating 
      ? `<div class="profile-card__rating">
           <span class="profile-card__rating-star">★</span>
           <span>${profile.rating.toFixed(1)}</span>
           <span class="profile-card__rating-count">(отзывы)</span>
         </div>`
      : '';

    var bioHTML = profile.bio
      ? `<div class="profile-card__bio">${escapeHtml(profile.bio)}</div>`
      : '';

    return `
     <div class="profile-card">
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
    ${ratingHTML}
    ${bioHTML}
  </div>
  <button class="profile-card__pro-btn">PRO+</button>
</div>

      <!-- Account Section -->
      <div class="profile-section">
        <div class="profile-section__title">Аккаунт</div>
        <div class="profile-section__items">
          ${profile.specialty ? `
            <div class="profile-item">
              <div class="profile-item__label">
                <span class="profile-item__icon">🎯</span>
                <span>Специализация</span>
              </div>
              <div class="profile-item__value">${escapeHtml(profile.specialty)}</div>
            </div>
          ` : ''}
          ${profile.experience ? `
            <div class="profile-item">
              <div class="profile-item__label">
                <span class="profile-item__icon">💪</span>
                <span>Опыт</span>
              </div>
              <div class="profile-item__value">${escapeHtml(profile.experience)}</div>
            </div>
          ` : ''}
          ${profile.phone ? `
            <div class="profile-item">
              <div class="profile-item__label">
                <span class="profile-item__icon">📱</span>
                <span>Телефон</span>
              </div>
              <div class="profile-item__value">${escapeHtml(profile.phone)}</div>
            </div>
          ` : ''}
          ${profile.price ? `
            <div class="profile-item">
              <div class="profile-item__label">
                <span class="profile-item__icon">💰</span>
                <span>Цена</span>
              </div>
              <div class="profile-item__value">${escapeHtml(profile.price)}</div>
            </div>
          ` : ''}
        </div>
      </div>

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

  // ─── Генерация HTML карточки профиля (клиент) ──────────────────
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

      <!-- Account Section -->
      <div class="profile-section">
        <div class="profile-section__title">Аккаунт</div>
        <div class="profile-section__items">
          ${profile.phone ? `
            <div class="profile-item">
              <div class="profile-item__label">
                <span class="profile-item__icon">📱</span>
                <span>Телефон</span>
              </div>
              <div class="profile-item__value">${escapeHtml(profile.phone)}</div>
            </div>
          ` : ''}
        </div>
      </div>

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
        </div>
      </div>

      <button class="profile-action-btn danger" id="profile-logout-btn">Выход</button>
    `;
  }

  // ─── Escape HTML ───────────────────────────────────────────────
  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ─── Рендер профиля ────────────────────────────────────────────
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

    // Биндим события
    bindEvents();
  }

  // ─── Биндим события в профиле ──────────────────────────────────
  function bindEvents() {
    var backBtn = document.getElementById('profile-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', close);
    }

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

  // ─── Открыть профиль ───────────────────────────────────────
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

  // ─── Закрыть профиль ───────────────────────────────────────────
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

  // ─── Закрыть при клике на overlay ──────────────────────────────
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

  // ─── Инициализация ────────────────────────────────────────────
  function init(userTgId) {
    console.log('[ProfileUI] init() вызван с userTgId:', userTgId);

    // Создаём DOM первым
    initDOM();

    // Биндим события overlay
    setupOverlayClick();

    // Биндим события селектора роли
    bindRoleSelectorEvents(userTgId);

    // ✅ Привязываем ко ВСЕМ кнопкам аватара
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

    // Подписываемся на ProfileStore
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

  // ─── API ───────────────────────────────────────────────────────
  return {
    init: init,
    openModal: open,
    closeModal: close
  };
})();
window.ProfileUI = ProfileUI;
console.log('[ProfileUI] ✅ Загружен');
