// ============================================================================
// TRAINER PROFILE - Профиль тренера/клиента
// ============================================================================
// Полный функционал: просмотр профиля, редактирование, галерея, уведомления
// ============================================================================

const TrainerProfile = (() => {
  const state = {
    currentProfile: null,
    isOwnProfile: false,
    selectedPhotoIndex: 0,
    isGalleryOpen: false,
  };

  // ────────────────────────────────────────────────────────────────────────
  // ИНИЦИАЛИЗАЦИЯ
  // ────────────────────────────────────────────────────────────────────────
  async function init() {
    createProfileContainer();
    setupEventListeners();
  }

  // ────────────────────────────────────────────────────────────────────────
  // СОЗДАНИЕ КОНТЕЙНЕРА
  // ────────────────────────────────────────────────────────────────────────
  function createProfileContainer() {
    if (document.getElementById('profile-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'profile-modal';
    modal.className = 'profile-modal hidden';
    modal.innerHTML = `
      <div class="profile-container">
        <!-- HEADER -->
        <div class="profile-header">
          <button class="profile-back-btn" id="profileBackBtn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <h2 class="profile-title">Profile</h2>
          <button class="profile-menu-btn" id="profileMenuBtn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2"/>
              <circle cx="12" cy="12" r="2"/>
              <circle cx="12" cy="19" r="2"/>
            </svg>
          </button>
        </div>

        <!-- ПРОФИЛЬ КОНТЕНТ -->
        <div class="profile-content">
          <!-- ФОТО И ИМЯ -->
          <div class="profile-top-section">
            <!-- Аватар с галереей -->
            <div class="profile-photo-wrapper">
              <img id="profileMainPhoto" class="profile-photo" src="" alt="Profile photo" />
              <button class="profile-photo-btn" id="openGalleryBtn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9l6-6h6l6 6v12H3V9zm3 3v6h12v-6H6z"/>
                </svg>
              </button>
            </div>

            <!-- Инфо справа -->
            <div class="profile-info-right">
              <div class="profile-name-type">
                <h3 id="profileName" class="profile-name">Babich Vlad</h3>
                <p id="profileType" class="profile-type">Personal trainer</p>
              </div>
              <button class="profile-pro-btn" id="profileProBtn">Pro</button>
            </div>
          </div>

          <!-- 3 РАЗДЕЛА: Experience / Specialization / Rating -->
          <div class="profile-stats">
            <div class="profile-stat-item">
              <div class="stat-value" id="statExperience">15 years</div>
              <div class="stat-label">Experience</div>
            </div>
            <div class="profile-stat-item">
              <div class="stat-value" id="statSpecialty">All types</div>
              <div class="stat-label">Specialization</div>
            </div>
            <div class="profile-stat-item">
              <div class="stat-value" id="statRating">5.0</div>
              <div class="stat-label">Rating</div>
            </div>
          </div>

          <!-- ACCOUNT BLOCK -->
          <div class="profile-section">
            <h4 class="profile-section-title">Account</h4>
            <button class="profile-menu-item" id="personalPageBtn">
              <div class="menu-item-left">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span>Personal page</span>
              </div>
              <svg class="menu-item-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 18l6-6-6-6" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <button class="profile-menu-item" id="marketplaceBtn">
              <div class="menu-item-left">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="9" cy="21" r="1"/>
                  <circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                <span>Marketplace</span>
              </div>
              <svg class="menu-item-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 18l6-6-6-6" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <button class="profile-menu-item" id="challengesBtn">
              <div class="menu-item-left">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 9l6-6 6 6M6 15l6 6 6-6"/>
                </svg>
                <span>Challenges</span>
              </div>
              <svg class="menu-item-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 18l6-6-6-6" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <button class="profile-menu-item" id="partnerBtn">
              <div class="menu-item-left">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span>Partner program</span>
              </div>
              <svg class="menu-item-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 18l6-6-6-6" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <!-- NOTIFICATION BLOCK -->
          <div class="profile-section">
            <h4 class="profile-section-title">Notification</h4>
            <div class="profile-notification-item">
              <div class="notification-left">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <span>Pop-up Notification</span>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="notificationsToggle" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <!-- OTHER BLOCK -->
          <div class="profile-section">
            <h4 class="profile-section-title">Other</h4>
            <button class="profile-menu-item" id="contactBtn">
              <div class="menu-item-left">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span>Contact</span>
              </div>
              <svg class="menu-item-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 18l6-6-6-6" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <button class="profile-menu-item" id="privacyBtn">
              <div class="menu-item-left">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span>Privacy Policy</span>
              </div>
              <svg class="menu-item-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 18l6-6-6-6" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <button class="profile-menu-item" id="settingsBtn">
              <div class="menu-item-left">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m3.08 3.08l4.24 4.24M1 12h6m6 0h6m-1.78-7.22l-4.24 4.24m-3.08 3.08l-4.24 4.24"/>
                </svg>
                <span>Settings</span>
              </div>
              <svg class="menu-item-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 18l6-6-6-6" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- ГАЛЕРЕЯ ФОТО -->
      <div class="profile-gallery-modal hidden" id="galleryModal">
        <div class="gallery-header">
          <button class="gallery-close-btn" id="galleryCloseBtn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
          <span class="gallery-counter" id="galleryCounter">1 / 1</span>
          <button class="gallery-upload-btn" id="galleryUploadBtn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </button>
        </div>
        <div class="gallery-viewer">
          <button class="gallery-nav-btn gallery-prev" id="galleryPrevBtn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M15 19l-7-7 7-7" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
          <img id="galleryImage" class="gallery-image" src="" alt="Gallery" />
          <button class="gallery-nav-btn gallery-next" id="galleryNextBtn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 5l7 7-7 7" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <input type="file" id="photoInput" class="hidden" accept="image/*" multiple />
      </div>
    `;

    document.body.appendChild(modal);
  }

  // ────────────────────────────────────────────────────────────────────────
  // EVENT LISTENERS
  // ────────────────────────────────────────────────────────────────────────
  function setupEventListeners() {
    // Закрытие профиля
    document.getElementById('profileBackBtn').addEventListener('click', close);

    // Галерея
    document.getElementById('openGalleryBtn').addEventListener('click', openGallery);
    document.getElementById('galleryCloseBtn').addEventListener('click', closeGallery);
    document.getElementById('galleryUploadBtn').addEventListener('click', () => {
      document.getElementById('photoInput').click();
    });
    document.getElementById('galleryPrevBtn').addEventListener('click', prevPhoto);
    document.getElementById('galleryNextBtn').addEventListener('click', nextPhoto);
    document.getElementById('photoInput').addEventListener('change', handlePhotoUpload);

    // Уведомления
    document.getElementById('notificationsToggle').addEventListener('change', toggleNotifications);

    // Account меню
    document.getElementById('personalPageBtn').addEventListener('click', () => {
      showToast('Персональная страница (заглушка)');
    });
    document.getElementById('marketplaceBtn').addEventListener('click', () => {
      showToast('Маркетплейс (заглушка)');
    });
    document.getElementById('challengesBtn').addEventListener('click', () => {
      showToast('Челленджи (заглушка)');
    });
    document.getElementById('partnerBtn').addEventListener('click', () => {
      showToast('Партнёрская программа (заглушка)');
    });

    // Other меню
    document.getElementById('contactBtn').addEventListener('click', openContactModal);
    document.getElementById('privacyBtn').addEventListener('click', () => {
      showToast('Политика приватности');
    });
    document.getElementById('settingsBtn').addEventListener('click', () => {
      showToast('Настройки (заглушка)');
    });

    // Pro кнопка
    document.getElementById('profileProBtn').addEventListener('click', () => {
      showToast('PRO подписка (заглушка)');
    });

    // Меню (три точки)
    document.getElementById('profileMenuBtn').addEventListener('click', openProfileMenu);
  }

  // ────────────────────────────────────────────────────────────────────────
  // ОТКРЫТИЕ ПРОФИЛЯ
  // ────────────────────────────────────────────────────────────────────────
  async function open(trainerId, currentUserId, userRole) {
    const modal = document.getElementById('profile-modal');
    
    try {
      // Загружаем данные профиля
      const profile = await fetchProfileData(trainerId, userRole);
      state.currentProfile = profile;
      state.isOwnProfile = trainerId === currentUserId;

      // Заполняем данные
      renderProfile(profile);

      // Показываем модальное окно
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    } catch (error) {
      console.error('Error opening profile:', error);
      showToast('Error loading profile');
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // ЗАГРУЗКА ДАННЫХ ИЗ БД
  // ────────────────────────────────────────────────────────────────────────
  async function fetchProfileData(trainerId, userRole) {
    const table = userRole === 'trainer' ? 'trainers' : 'users';
    
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('tg_id', trainerId) // или 'user_id' для клиентов
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // РЕНДЕР ПРОФИЛЯ
  // ────────────────────────────────────────────────────────────────────────
  function renderProfile(profile) {
    const roleText = profile.role === 'trainer' ? 'Personal trainer' : 'Client';
    
    // Основная информация
    document.getElementById('profileName').textContent = profile.full_name || 'Unknown';
    document.getElementById('profileType').textContent = roleText;
    
    // Статистика
    document.getElementById('statExperience').textContent = profile.experience || 'N/A';
    document.getElementById('statSpecialty').textContent = profile.specialty || 'N/A';
    document.getElementById('statRating').textContent = profile.rating ? profile.rating.toFixed(1) : '5.0';

    // Фото
    const photos = profile.photos ? JSON.parse(profile.photos) : [];
    if (photos.length > 0) {
      document.getElementById('profileMainPhoto').src = photos[0];
      state.selectedPhotoIndex = 0;
    } else {
      document.getElementById('profileMainPhoto').src = profile.photo_url || '/default-avatar.png';
    }

    // Уведомления
    document.getElementById('notificationsToggle').checked = profile.notifications_enabled !== false;

    // Если это не свой профиль - скрываем кнопку загрузки фото и меню редактирования
    if (!state.isOwnProfile) {
      document.getElementById('openGalleryBtn').style.display = 'none';
      document.getElementById('profileMenuBtn').style.display = 'none';
    } else {
      document.getElementById('openGalleryBtn').style.display = 'block';
      document.getElementById('profileMenuBtn').style.display = 'block';
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // ГАЛЕРЕЯ
  // ────────────────────────────────────────────────────────────────────────
  function openGallery() {
    if (!state.isOwnProfile) return;

    const photos = state.currentProfile.photos ? JSON.parse(state.currentProfile.photos) : [];
    if (photos.length === 0) {
      // Если нет фото - открываем загрузку
      document.getElementById('photoInput').click();
      return;
    }

    state.isGalleryOpen = true;
    state.selectedPhotoIndex = 0;
    document.getElementById('galleryModal').classList.remove('hidden');
    updateGalleryView();
  }

  function closeGallery() {
    state.isGalleryOpen = false;
    document.getElementById('galleryModal').classList.add('hidden');
  }

  function updateGalleryView() {
    const photos = state.currentProfile.photos ? JSON.parse(state.currentProfile.photos) : [];
    if (photos.length === 0) return;

    const img = document.getElementById('galleryImage');
    img.src = photos[state.selectedPhotoIndex];
    
    document.getElementById('galleryCounter').textContent = 
      `${state.selectedPhotoIndex + 1} / ${photos.length}`;

    // Показываем/скрываем кнопки навигации
    document.getElementById('galleryPrevBtn').style.display = 
      state.selectedPhotoIndex > 0 ? 'flex' : 'none';
    document.getElementById('galleryNextBtn').style.display = 
      state.selectedPhotoIndex < photos.length - 1 ? 'flex' : 'none';
  }

  function nextPhoto() {
    const photos = state.currentProfile.photos ? JSON.parse(state.currentProfile.photos) : [];
    if (state.selectedPhotoIndex < photos.length - 1) {
      state.selectedPhotoIndex++;
      updateGalleryView();
    }
  }

  function prevPhoto() {
    if (state.selectedPhotoIndex > 0) {
      state.selectedPhotoIndex--;
      updateGalleryView();
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // ЗАГРУЗКА ФОТО
  // ────────────────────────────────────────────────────────────────────────
  async function handlePhotoUpload(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      showToast('Загружаем фото...');

      const uploadedUrls = [];

      for (const file of files) {
        // Сжимаем изображение под экран телефона
        const compressedImage = await compressImage(file);
        
        // Загружаем в Supabase Storage
        const fileName = `${state.currentProfile.tg_id || state.currentProfile.user_id}-${Date.now()}.jpg`;
        const bucket = state.currentProfile.role === 'trainer' ? 'trainer-photos' : 'client-photos';
        
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, compressedImage);

        if (error) throw error;

        // Получаем публичный URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      // Обновляем в БД
      const table = state.currentProfile.role === 'trainer' ? 'trainers' : 'users';
      const idField = state.currentProfile.role === 'trainer' ? 'tg_id' : 'user_id';
      const currentPhotos = state.currentProfile.photos ? JSON.parse(state.currentProfile.photos) : [];
      const allPhotos = [...currentPhotos, ...uploadedUrls];

      const { error: updateError } = await supabase
        .from(table)
        .update({ photos: JSON.stringify(allPhotos) })
        .eq(idField, state.currentProfile.tg_id || state.currentProfile.user_id);

      if (updateError) throw updateError;

      // Обновляем state
      state.currentProfile.photos = JSON.stringify(allPhotos);
      renderProfile(state.currentProfile);
      closeGallery();
      showToast('Фото успешно загружено!');

      // Очищаем input
      e.target.value = '';
    } catch (error) {
      console.error('Error uploading photo:', error);
      showToast('Error uploading photo');
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // СЖАТИЕ ИЗОБРАЖЕНИЯ
  // ────────────────────────────────────────────────────────────────────────
  async function compressImage(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Максимальный размер для мобильного экрана
          const MAX_WIDTH = 540;
          const MAX_HEIGHT = 960;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = (height * MAX_WIDTH) / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = (width * MAX_HEIGHT) / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/jpeg', 0.8);
        };
      };
    });
  }

  // ────────────────────────────────────────────────────────────────────────
  // УВЕДОМЛЕНИЯ
  // ────────────────────────────────────────────────────────────────────────
  async function toggleNotifications(e) {
    const enabled = e.target.checked;
    
    try {
      const table = state.currentProfile.role === 'trainer' ? 'trainers' : 'users';
      const idField = state.currentProfile.role === 'trainer' ? 'tg_id' : 'user_id';

      const { error } = await supabase
        .from(table)
        .update({ notifications_enabled: enabled })
        .eq(idField, state.currentProfile.tg_id || state.currentProfile.user_id);

      if (error) throw error;

      state.currentProfile.notifications_enabled = enabled;
      showToast(enabled ? 'Уведомления включены' : 'Уведомления отключены');
    } catch (error) {
      console.error('Error toggling notifications:', error);
      showToast('Error updating notifications');
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // КОНТАКТЫ
  // ────────────────────────────────────────────────────────────────────────
  function openContactModal() {
    const phone = state.currentProfile.contact_phone || '';
    const email = state.currentProfile.contact_email || '';

    const modalHTML = `
      <div class="contact-modal-overlay" id="contactModalOverlay">
        <div class="contact-modal-content">
          <h3>Contact Information</h3>
          <div class="contact-info-item">
            <label>Phone:</label>
            <p>${phone || 'Not provided'}</p>
          </div>
          <div class="contact-info-item">
            <label>Email:</label>
            <p>${email || 'Not provided'}</p>
          </div>
          ${state.isOwnProfile ? `
            <button id="editContactBtn" class="btn-primary">Edit Contact</button>
          ` : ''}
          <button id="closeContactBtn" class="btn-secondary">Close</button>
        </div>
      </div>
    `;

    const existing = document.getElementById('contactModalOverlay');
    if (existing) existing.remove();

    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalHTML;
    document.body.appendChild(wrapper.firstElementChild);

    document.getElementById('closeContactBtn').addEventListener('click', () => {
      document.getElementById('contactModalOverlay').remove();
    });

    if (state.isOwnProfile) {
      document.getElementById('editContactBtn').addEventListener('click', openEditContactModal);
    }
  }

  function openEditContactModal() {
    const phone = state.currentProfile.contact_phone || '';
    const email = state.currentProfile.contact_email || '';

    const modalHTML = `
      <div class="contact-modal-overlay" id="contactModalOverlay">
        <div class="contact-modal-content">
          <h3>Edit Contact Information</h3>
          <input type="tel" id="phoneInput" placeholder="Phone" value="${phone}" />
          <input type="email" id="emailInput" placeholder="Email" value="${email}" />
          <button id="saveContactBtn" class="btn-primary">Save</button>
          <button id="closeContactBtn" class="btn-secondary">Cancel</button>
        </div>
      </div>
    `;

    const existing = document.getElementById('contactModalOverlay');
    if (existing) existing.remove();

    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalHTML;
    document.body.appendChild(wrapper.firstElementChild);

    document.getElementById('saveContactBtn').addEventListener('click', saveContact);
    document.getElementById('closeContactBtn').addEventListener('click', () => {
      document.getElementById('contactModalOverlay').remove();
    });
  }

  async function saveContact() {
    const phone = document.getElementById('phoneInput').value;
    const email = document.getElementById('emailInput').value;

    try {
      const table = state.currentProfile.role === 'trainer' ? 'trainers' : 'users';
      const idField = state.currentProfile.role === 'trainer' ? 'tg_id' : 'user_id';

      const { error } = await supabase
        .from(table)
        .update({ contact_phone: phone, contact_email: email })
        .eq(idField, state.currentProfile.tg_id || state.currentProfile.user_id);

      if (error) throw error;

      state.currentProfile.contact_phone = phone;
      state.currentProfile.contact_email = email;

      document.getElementById('contactModalOverlay').remove();
      showToast('Contact info updated!');
    } catch (error) {
      console.error('Error saving contact:', error);
      showToast('Error saving contact');
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // МЕНЮ ПРОФИЛЯ (три точки)
  // ────────────────────────────────────────────────────────────────────────
  function openProfileMenu() {
    const menuHTML = `
      <div class="profile-menu-overlay" id="profileMenuOverlay">
        <div class="profile-menu-popup">
          <button id="editProfileBtn" class="menu-popup-item">Edit Profile</button>
          <button id="reportBtn" class="menu-popup-item">Report</button>
          <button id="blockBtn" class="menu-popup-item">Block</button>
        </div>
      </div>
    `;

    const existing = document.getElementById('profileMenuOverlay');
    if (existing) existing.remove();

    const wrapper = document.createElement('div');
    wrapper.innerHTML = menuHTML;
    document.body.appendChild(wrapper.firstElementChild);

    document.getElementById('profileMenuOverlay').addEventListener('click', (e) => {
      if (e.target.id === 'profileMenuOverlay') {
        e.target.remove();
      }
    });

    document.getElementById('editProfileBtn').addEventListener('click', () => {
      if (state.isOwnProfile) {
        showToast('Edit Profile (заглушка)');
      } else {
        document.getElementById('profileMenuOverlay').remove();
      }
    });

    document.getElementById('reportBtn').addEventListener('click', () => {
      showToast('Report (заглушка)');
      document.getElementById('profileMenuOverlay').remove();
    });

    document.getElementById('blockBtn').addEventListener('click', () => {
      showToast('Block (заглушка)');
      document.getElementById('profileMenuOverlay').remove();
    });
  }

  // ────────────────────────────────────────────────────────────────────────
  // ЗАКРЫТИЕ ПРОФИЛЯ
  // ────────────────────────────────────────────────────────────────────────
  function close() {
    const modal = document.getElementById('profile-modal');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    closeGallery();
  }

  // ────────────────────────────────────────────────────────────────────────
  // UTILS
  // ────────────────────────────────────────────────────────────────────────
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ────────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ────────────────────────────────────────────────────────────────────────
  return {
    init,
    open,
    close,
  };
})();

// Инициализируем при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  TrainerProfile.init();
});
