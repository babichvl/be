// ═══════════════════════════════════════════════════════════
// PROFILESTORE.JS — Управление профилем тренера/клиента
// ═══════════════════════════════════════════════════════════

var ProfileStore = (function() {
  var profile = null;
  var loading = false;
  var subscribers = [];

  function notify(data) {
    subscribers.forEach(function(cb) {
      cb(data);
    });
  }

  // ─── Подписка на изменения ──────────────────────────────
  function subscribe(callback) {
    subscribers.push(callback);
    if (profile) callback(profile);
  }

  // ─── Получить текущий профиль ──────────────────────────
  function getProfile() {
    return profile;
  }

  // ─── Mock данные для тестирования ──────────────────────
  function createMockProfile(userTgId) {
    console.log('[ProfileStore] Создаю mock профиль для TG ID:', userTgId);
    
    return {
      role: 'trainer',
      userId: 'mock-user-' + userTgId,
      trainerId: userTgId,
      displayName: 'Василий Тренер',
      specialty: 'Силовой тренинг',
      experience: '5+ лет',
      bio: 'Специалист по гипертрофии и силе',
      price: '1500 ₽/сессия',
      phone: '+7 (999) 123-45-67',
      photoUrl: null,
      rating: 4.8,
      reviewCount: 42,
      isOnline: true,
      lastSeen: null,
      isPro: true,
      notificationsEnabled: true
    };
  }

  // ─── Определить роль пользователя ──────────────────────
  async function determineRole(userTgId) {
    if (!window.sb) {
      console.warn('[ProfileStore] Supabase не инициализирован, используем mock');
      return {
        userId: 'mock-user-' + userTgId,
        role: 'trainer'
      };
    }

    try {
      console.log('[ProfileStore] Ищу пользователя по telegram_id:', userTgId);
      
      var userRes = await window.sb
        .from('users')
        .select('id, role')
        .eq('telegram_id', userTgId)
        .single();

      console.log('[ProfileStore] Результат поиска:', {
        error: userRes.error ? userRes.error.message : null,
        data: userRes.data
      });

      if (userRes.error) {
        console.warn('[ProfileStore] Пользователь не найден в БД:', userRes.error.message);
        return null;
      }

      return {
        userId: userRes.data.id,
        role: userRes.data.role
      };
    } catch (e) {
      console.error('[ProfileStore] Ошибка при определении роли:', e.message);
      return null;
    }
  }

  // ─── Загрузить данные тренера ──────────────────────────
  async function loadTrainerProfile(userId) {
    if (!window.sb) {
      console.warn('[ProfileStore] Supabase не доступен, используем mock тренера');
      return createMockProfile(userId);
    }

    try {
      console.log('[ProfileStore] Загружаю данные тренера для user_id:', userId);
      
      var trainerRes = await window.sb
        .from('trainers')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (trainerRes.error) {
        console.warn('[ProfileStore] Тренер не найден:', trainerRes.error.message);
        return null;
      }

      var trainer = trainerRes.data;
      console.log('[ProfileStore] Загружены данные тренера:', trainer);

      // Загружаем рейтинг
      var reviewsRes = await window.sb
        .from('trainer_reviews')
        .select('rating')
        .eq('trainer_id', trainer.id);

      var avgRating = 0;
      var reviewCount = 0;
      if (!reviewsRes.error && reviewsRes.data && reviewsRes.data.length > 0) {
        var sum = reviewsRes.data.reduce(function(acc, r) {
          return acc + parseFloat(r.rating || 0);
        }, 0);
        avgRating = parseFloat((sum / reviewsRes.data.length).toFixed(1));
        reviewCount = reviewsRes.data.length;
      }

      return {
        role: 'trainer',
        userId: userId,
        trainerId: trainer.id,
        displayName: trainer.display_name || trainer.name,
        specialty: trainer.specialty,
        experience: trainer.experience,
        bio: trainer.bio,
        price: trainer.price,
        phone: trainer.phone,
        photoUrl: trainer.photo_url,
        rating: avgRating,
        reviewCount: reviewCount,
        isOnline: true,
        lastSeen: null,
        isPro: trainer.is_pro || false,
        notificationsEnabled: true
      };
    } catch (e) {
      console.error('[ProfileStore] Ошибка при загрузке тренера:', e.message);
      return null;
    }
  }

  // ─── Загрузить данные клиента ──────────────────────────
  async function loadClientProfile(userId) {
    if (!window.sb) {
      console.warn('[ProfileStore] Supabase не доступен, используем mock клиента');
      return {
        role: 'client',
        userId: userId,
        clientId: 'mock-client-' + userId,
        name: 'Иван Клиент',
        trainerId: null,
        status: 'active',
        phone: '+7 (999) 987-65-43',
        photoUrl: null,
        isOnline: true,
        lastSeen: null,
        birthDate: '1990-05-15',
        notificationsEnabled: true
      };
    }

    try {
      console.log('[ProfileStore] Загружаю данные клиента для user_id:', userId);
      
      var clientRes = await window.sb
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (clientRes.error) {
        console.warn('[ProfileStore] Клиент не найден:', clientRes.error.message);
        return null;
      }

      var client = clientRes.data;
      console.log('[ProfileStore] Загружены данные клиента:', client);

      return {
        role: 'client',
        userId: userId,
        clientId: client.id,
        name: client.name,
        trainerId: client.trainer_id,
        status: client.status,
        phone: client.phone,
        photoUrl: client.photo_url,
        isOnline: true,
        lastSeen: null,
        birthDate: client.birth_date,
        notificationsEnabled: true
      };
    } catch (e) {
      console.error('[ProfileStore] Ошибка при загрузке клиента:', e.message);
      return null;
    }
  }

  // ─── Главная функция загрузки профиля ──────────────────
  async function loadProfile(userTgId) {
    if (loading) {
      console.log('[ProfileStore] Уже загружаем, пропускаем');
      return;
    }
    
    loading = true;
    console.log('[ProfileStore] Загружаем профиль для TG ID:', userTgId);

    try {
      // 1. Определяем роль
      var roleData = await determineRole(userTgId);
      
      if (!roleData) {
        console.warn('[ProfileStore] ⚠️ Не удалось определить роль, используем mock тренера');
        // Используем mock для тестирования
        profile = createMockProfile(userTgId);
        loading = false;
        notify(profile);
        console.log('[ProfileStore] ✅ Mock профиль загружен');
        return;
      }

      console.log('[ProfileStore] Роль определена:', roleData.role);

      // 2. Загружаем профиль в зависимости от роли
      var loadedProfile = null;
      
      if (roleData.role === 'trainer') {
        loadedProfile = await loadTrainerProfile(roleData.userId);
      } else if (roleData.role === 'client') {
        loadedProfile = await loadClientProfile(roleData.userId);
      } else {
        console.warn('[ProfileStore] Неизвестная роль:', roleData.role);
      }

      if (!loadedProfile) {
        console.warn('[ProfileStore] ⚠️ Не удалось загрузить профиль, используем mock');
        loadedProfile = createMockProfile(userTgId);
      }

      profile = loadedProfile;
      loading = false;
      notify(profile);
      console.log('[ProfileStore] ✅ Профиль загружен:', profile);

    } catch (e) {
      console.error('[ProfileStore] ❌ Ошибка при загрузке профиля:', e.message);
      loading = false;
      profile = null;
      notify(profile);
    }
  }

  // ─── API ───────────────────────────────────────────────
  return {
    init: function(userTgId) {
      loadProfile(userTgId);
    },
    subscribe: subscribe,
    getProfile: getProfile,
    loadProfile: loadProfile,
    determineRole: determineRole
  };
})();

console.log('[ProfileStore] ✅ Инициализирован');
