// ═══════════════════════════════════════════════════════════
// PROFILEUI.JS — UI компонент профиля
// ═══════════════════════════════════════════════════════════

var ProfileUI = (function() {
  var isOpen = false;
  var currentProfile = null;

  // ─── Создаём HTML структуру ────────────────────────────────────
  function createProfileHTML() {
    var html = `
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
  // ─── Инициализация ────────────────────────────────────────
  function init(userTgId) {
    console.log('[ProfileUI] Инициализирую ProfileUI с userTgId:', userTgId);

    // Создаём DOM
    initDOM();

    // Биндим события
    setupOverlayClick();

    // Биндим клик по аватару в хэдере
    var avatarBtn = document.querySelector('.page-header__avatar');
    if (avatarBtn) {
      avatarBtn.addEventListener('click', open);
      console.log('[ProfileUI] Avatar button готова');
    }

    // Подписываемся на изменения профиля из ProfileStore
    if (window.ProfileStore) {
      console.log('[ProfileUI] ProfileStore найден, инициируем загрузку...');
      
      ProfileStore.subscribe(function(profile) {
        console.log('[ProfileUI] Получили профиль от ProfileStore:', profile);
        currentProfile = profile;
        if (isOpen) {
          render(profile);
        }
      });
      
      // Загружаем профиль через ProfileStore
      if (userTgId) {
        console.log('[ProfileUI] Вызываем ProfileStore.init(' + userTgId + ')');
        ProfileStore.init(userTgId);
      }
    } else {
      console.error('[ProfileUI] ❌ ProfileStore НЕ найден!');
    }

    console.log('[ProfileUI] ✅ Инициализирован');
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
          <div class="profile-card__status-badge ${profile.isOnline ? '' : 'offline'}"></div>
        </div>
        <div class="profile-card__info">
          <div class="profile-card__name">${escapeHtml(profile.displayName || 'Тренер')}</div>
          <div class="profile-card__role">Тренер</div>
          ${ratingHTML}
          ${bioHTML}
        </div>
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
          ${profile.isPro ? `
            <div class="profile-item">
              <div class="profile-item__label">
                <span class="profile-item__icon">⭐</span>
                <span>Статус</span>
              </div>
              <div class="profile-item__value">Pro</div>
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
            <span class="profile-item__icon">›</span>
          </div>
          <div class="profile-item">
            <div class="profile-item__label">
              <span class="profile-item__icon">⚙️</span>
              <span>Настройки</span>
            </div>
            <span class="profile-item__icon">›</span>
          </div>
        </div>
      </div>

      <button class="profile-action-btn danger" id="profile-logout-btn">Выход</button>
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
          <div class="profile-card__status-badge ${profile.isOnline ? '' : 'offline'}"></div>
        </div>
        <div class="profile-card__info">
          <div class="profile-card__name">${escapeHtml(profile.name || 'Клиент')}</div>
          <div class="profile-card__role">Клиент</div>
        </div>
      </div>

      <!-- Trainer Info (если есть) -->
      ${profile.trainerId ? `
        <div class="profile-trainer-card">
          <div class="profile-trainer-card__avatar">?</div>
          <div class="profile-trainer-card__info">
            <div class="profile-trainer-card__name">Мой тренер</div>
            <div class="profile-trainer-card__label">Связь активна</div>
          </div>
          <div class="profile-trainer-card__chevron">›</div>
        </div>
      ` : `
        <div class="profile-trainer-card">
          <div class="profile-trainer-card__info">
            <div class="profile-trainer-card__name">У вас ещё нет тренера</div>
            <div class="profile-trainer-card__label">Пригласите его по коду</div>
          </div>
        </div>
      `}

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
          ${profile.birthDate ? `
            <div class="profile-item">
              <div class="profile-item__label">
                <span class="profile-item__icon">🎂</span>
                <span>Дата рождения</span>
              </div>
              <div class="profile-item__value">${escapeHtml(profile.birthDate)}</div>
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
            <span class="profile-item__icon">›</span>
          </div>
          <div class="profile-item">
            <div class="profile-item__label">
              <span class="profile-item__icon">⚙️</span>
              <span>Настройки</span>
            </div>
            <span class="profile-item__icon">›</span>
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
        // TODO: Сохранить в БД через ProfileStore
      });
    }

    var logoutBtn = document.getElementById('profile-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function() {
        if (confirm('Вы уверены?')) {
          console.log('[ProfileUI] Logout clicked');
          // TODO: Реализовать выход
        }
      });
    }
  }

  // ─── Открыть профиль ───────────────────────────────────────
  function open() {
    if (isOpen) return;
    
    isOpen = true;
    var overlay = document.getElementById('profile-overlay');
    var panel = document.getElementById('profile-panel');
    
    if (overlay && panel) {
      overlay.classList.add('active');
      panel.classList.add('active');
      
      // Рендерим текущий профиль если он загружен
      if (currentProfile) {
        render(currentProfile);
      } else {
        render(null);
      }
      
      console.log('[ProfileUI] Profile opened');
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
    var overlay = document.getElementById('profile-overlay');
    if (overlay) {
      overlay.addEventListener('click', close);
    }
  }

  // ─── Инициализация ────────────────────────────────────────────
  function init() {
    console.log('[ProfileUI] Инициализирую ProfileUI');

    // Создаём DOM
    initDOM();

    // Биндим события
    setupOverlayClick();

    // Биндим клик по аватару в хэдере
    var avatarBtn = document.querySelector('.page-header__avatar');
    if (avatarBtn) {
      avatarBtn.addEventListener('click', open);
      console.log('[ProfileUI] Avatar button готова');
    }

    // Подписываемся на изменения профиля из ProfileStore
    if (window.ProfileStore) {
      ProfileStore.subscribe(function(profile) {
        currentProfile = profile;
        if (isOpen) {
          render(profile);
        }
      });
      console.log('[ProfileUI] Подписаны на ProfileStore');
    } else {
      console.warn('[ProfileUI] ProfileStore не найден');
    }

    console.log('[ProfileUI] ✅ Инициализирован');
  }

  // ─── API ───────────────────────────────────────────────────────
  return {
    init: init,
    open: open,
    close: close
  };
})();

console.log('[ProfileUI] ✅ Загружен');
