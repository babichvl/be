// ═══════════════════════════════════════════════════════════
// PROFILESTORE.JS — Управление профилем тренера/клиента
// ═══════════════════════════════════════════════════════════

var ProfileStore = (function() {
  var profile = null;
  var loading = false;
  var subscribers = [];

  function notify(data) {
    console.log('[ProfileStore] notify() вызван с данными:', data);
    console.log('[ProfileStore] Всего подписчиков:', subscribers.length);
    subscribers.forEach(function(cb) {
      console.log('[ProfileStore] Вызываю callback...');
      cb(data);
    });
    console.log('[ProfileStore] ✅ Все callback вызваны');
  }

  // ─── Подписка на изменения ─────────────────────────────────
  function subscribe(callback) {
    console.log('[ProfileStore] subscribe() — добавляю callback');
    console.log('[ProfileStore] Текущий профиль:', profile ? 'ЕСТЬ' : 'null');
    subscribers.push(callback);
    console.log('[ProfileStore] Всего подписчиков теперь:', subscribers.length);
    if (profile) {
      console.log('[ProfileStore] Профиль уже есть, вызываю callback прямо сейчас');
      callback(profile);
    } else {
      console.log('[ProfileStore] Профиля нет, callback будет вызван позже через notify()');
    }
  }

  // ─── Получить текущий профиль ─────────────────────────────
  function getProfile() {
    return profile;
  }

// ─── Определить роль пользователя ─────────────────────
async function determineRole(userTgId) {
  console.log('[ProfileStore] determineRole() вызван для TG ID:', userTgId);
  
  if (!window.sb) {
    console.warn('[ProfileStore] ⚠️ Supabase не инициализирован, возвращаю mock');
    return {
      userId: 'mock-' + userTgId,  // mock ID, но явно отмечено как mock
      role: 'trainer',
      isRealUser: false
    };
  }

  try {
    console.log('[ProfileStore] Ищу пользователя в users...');
    var userRes = await window.sb
      .from('users')
      .select('id, role')
      .eq('telegram_id', userTgId)
      .single();

    console.log('[ProfileStore] userRes:', userRes);

    if (userRes.error) {
      console.warn('[ProfileStore] ⚠️ Ошибка или пользователь не найден:', userRes.error.message);
      console.log('[ProfileStore] Возвращаю mock с mock-id');
      return {
        userId: 'mock-' + userTgId,  // mock UUID
        role: 'trainer',
        isRealUser: false
      };
    }

    if (!userRes.data) {
      console.warn('[ProfileStore] ⚠️ userRes.data пуста');
      return {
        userId: 'mock-' + userTgId,
        role: 'trainer',
        isRealUser: false
      };
    }

    console.log('[ProfileStore] ✅ Пользователь найден, ID:', userRes.data.id, 'Роль:', userRes.data.role);
    
    // ✅ ПРАВИЛЬНО: Возвращаем реальный UUID из БД
    return {
      userId: userRes.data.id,  // ← UUID из users.id
      role: userRes.data.role,
      isRealUser: true
    };
  } catch (e) {
    console.error('[ProfileStore] ❌ Exception в determineRole:', e.message);
    console.log('[ProfileStore] Возвращаю mock');
    return {
      userId: 'mock-' + userTgId,
      role: 'trainer',
      isRealUser: false
    };
  }
}
// ─── Загрузить данные тренера ──────────────────────────────
async function loadTrainerProfile(userId) {
  console.log('[ProfileStore] loadTrainerProfile() для user_id:', userId);
  
  if (!window.sb) {
    console.warn('[ProfileStore] ⚠️ Supabase не доступен');
    return null;  // ← ВОЗВРАЩАЕМ NULL, НЕ MOCK
  }

  try {
    console.log('[ProfileStore] Ищу тренера по user_id:', userId);
    
    var trainerRes = await window.sb
      .from('trainers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (trainerRes.error) {
      console.warn('[ProfileStore] ⚠️ Тренер не найден:', trainerRes.error.message);
      console.log('[ProfileStore] ⚠️ Возвращаю NULL — нужен первичный выбор роли');
      return null;  // ← NULL, А НЕ MOCK!
    }

    if (!trainerRes.data) {
      console.warn('[ProfileStore] ⚠️ trainerRes.data пуста');
      return null;  // ← NULL
    }

    var trainer = trainerRes.data;
    console.log('[ProfileStore] ✅ Тренер загружен:', trainer.display_name);

    var reviewsRes = await window.sb
      .from('trainer_reviews')
      .select('rating')
      .eq('trainer_tg_id', trainer.id);

    var avgRating = 0;
    if (!reviewsRes.error && reviewsRes.data && reviewsRes.data.length > 0) {
      var sum = reviewsRes.data.reduce(function(acc, r) {
        return acc + parseFloat(r.rating || 0);
      }, 0);
      avgRating = (sum / reviewsRes.data.length).toFixed(1);
    }

    var statusRes = await window.sb
      .from('user_status')
      .select('is_online, last_seen')
      .eq('user_id', userId)
      .single();

    var isOnline = false;
    var lastSeen = null;
    if (!statusRes.error && statusRes.data) {
      isOnline = statusRes.data.is_online;
      lastSeen = statusRes.data.last_seen;
    }

    return {
      role: 'trainer',
      userId: userId,
      trainerId: trainer.id,
      displayName: trainer.display_name,
      specialty: trainer.specialty,
      experience: trainer.experience,
      bio: trainer.bio,
      price: trainer.price,
      phone: trainer.phone,
      photoUrl: null,
      rating: parseFloat(avgRating),
      isOnline: isOnline,
      lastSeen: lastSeen,
      isPro: false,
      notificationsEnabled: true
    };
  } catch (e) {
    console.error('[ProfileStore] ❌ Exception в loadTrainerProfile:', e.message);
    console.log('[ProfileStore] Возвращаю NULL');
    return null;  // ← NULL
  }
}

// ─── Загрузить данные клиента ──────────────────────────────
async function loadClientProfile(userId) {
  console.log('[ProfileStore] loadClientProfile() для user_id:', userId);
  
  if (!window.sb) {
    console.warn('[ProfileStore] ⚠️ Supabase не доступен');
    return null;  // ← NULL
  }

  try {
    var clientRes = await window.sb
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (clientRes.error) {
      console.warn('[ProfileStore] ❌ Клиент не найден:', clientRes.error.message);
      return null;  // ← NULL ВМЕСТО ОШИБКИ
    }

    if (!clientRes.data) {
      console.warn('[ProfileStore] ⚠️ Данные клиента пусты');
      return null;  // ← NULL
    }

    var client = clientRes.data;
    console.log('[ProfileStore] ✅ Клиент загружен:', client.name);

    var statusRes = await window.sb
      .from('user_status')
      .select('is_online, last_seen')
      .eq('user_id', userId)
      .single();

    var isOnline = false;
    var lastSeen = null;
    if (!statusRes.error && statusRes.data) {
      isOnline = statusRes.data.is_online;
      lastSeen = statusRes.data.last_seen;
    }

    return {
      role: 'client',
      userId: userId,
      clientId: client.id,
      name: client.name,
      trainerId: client.trainer_id,
      status: client.status,
      phone: client.phone,
      photoUrl: client.photo_url,
      isOnline: isOnline,
      lastSeen: lastSeen,
      birthDate: client.birth_date,
      notificationsEnabled: true
    };
  } catch (e) {
    console.error('[ProfileStore] ❌ Ошибка loadClientProfile:', e.message);
    return null;  // ← NULL
  }
}

// ─── Главная функция загрузки профиля ──────────────────────
async function loadProfile(userTgId) {
  console.log('[ProfileStore] ===== loadProfile() НАЧАЛО для TG ID:', userTgId, '=====');
  
  if (loading) {
    console.log('[ProfileStore] ⚠️ Уже загружается, игнорирую');
    return;
  }
  
  loading = true;

  try {
    var roleData = await determineRole(userTgId);
    
    if (!roleData) {
      console.warn('[ProfileStore] ❌ determineRole вернула null');
      loading = false;
      profile = null;
      notify(profile);
      return;
    }

    console.log('[ProfileStore] Роль:', roleData.role);

    if (!roleData.role) {
      console.log('[ProfileStore] ⚠️ Роль не установлена — вернём пустой профиль');
      loading = false;
      profile = { userId: roleData.userId, role: null };
      notify(profile);
      return;
    }

    var userData = null;
    if (roleData.role === 'trainer') {
      console.log('[ProfileStore] Загружаю тренера...');
      userData = await loadTrainerProfile(roleData.userId);
    } else if (roleData.role === 'client') {
      console.log('[ProfileStore] Загружаю клиента...');
      userData = await loadClientProfile(roleData.userId);
    }

    if (!userData) {
      console.warn('[ProfileStore] ⚠️ userData пуста — возможно, это новый пользователь');
      loading = false;
      profile = { 
        userId: roleData.userId, 
        role: roleData.role,
        isIncomplete: true
      };
      notify(profile);
      return;
    }

    profile = userData;
    console.log('[ProfileStore] ✅✅✅ ПРОФИЛЬ ГОТОВ:', profile);
    notify(profile);

  } catch (e) {
    console.error('[ProfileStore] ❌❌❌ КРИТИЧЕСКАЯ ОШИБКА:', e.message);
    console.error('[ProfileStore] ⚠️ Supabase полностью недоступен, использую mock');
    
    // ─── Create mock profile для критических ошибок ─────────────────
function createMockProfile(userTgId) {
  console.log('[ProfileStore] ⚠️ КРИТИЧЕСКАЯ ОШИБКА: Supabase не доступен. Использую mock для:', userTgId);
  
  return {
    role: 'trainer',
    userId: 'mock-error-' + userTgId,
    trainerId: 'mock-trainer-' + userTgId,
    displayName: 'Демо Тренер (Нет соединения)',
    specialty: 'Демонстрация',
    experience: 'Демо режим',
    bio: '⚠️ Приложение работает в демо-режиме. Соединение с сервером потеряно.',
    price: 'Demo',
    phone: '+7 (000) 000-00-00',
    photoUrl: null,
    rating: 5.0,
    reviewCount: 0,
    isOnline: false,
    lastSeen: null,
    isPro: false,
    notificationsEnabled: false,
    isMockProfile: true
  };
}
    profile = createMockProfile(userTgId);
    notify(profile);
    loading = false;
  }
  
  loading = false;
  console.log('[ProfileStore] ===== loadProfile() КОНЕЦ =====');
}



    // Загружаем общие данные из users
    var usersRes = await window.sb
      .from('users')
      .select('photo_url, is_pro, notifications_enabled')
      .eq('id', roleData.userId)
      .single();

    if (!usersRes.error && usersRes.data) {
      userData.photoUrl = usersRes.data.photo_url;
      userData.isPro = usersRes.data.is_pro;
      userData.notificationsEnabled = usersRes.data.notifications_enabled;
      console.log('[ProfileStore] ✅ Дополнены данные из users');
    }

    profile = userData;
    console.log('[ProfileStore] ✅✅✅ ПРОФИЛЬ ГОТОВ:', profile);
    console.log('[ProfileStore] ===== ВЫЗЫВАЮ notify() =====');
    notify(profile);
    console.log('[ProfileStore] ===== notify() ЗАВЕРШЁН =====');

  } catch (e) {
    console.error('[ProfileStore] ❌❌❌ ОШИБКА:', e.message);
    loading = false;
    profile = null;
    notify(profile);
  } finally {
    loading = false;
    console.log('[ProfileStore] ===== loadProfile() КОНЕЦ =====');
  }
}

  // ─── API ───────────────────────────────────────────────────
  return {
    init: function(userTgId) {
      console.log('[ProfileStore] init() вызван с userTgId:', userTgId);
      loadProfile(userTgId);
    },
    subscribe: subscribe,
    getProfile: getProfile,
    loadProfile: loadProfile,
    determineRole: determineRole
  };
})();

window.ProfileStore = ProfileStore;
console.log('[ProfileStore] ✅ Загружен и готов');
