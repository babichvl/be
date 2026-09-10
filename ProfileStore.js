// ═══════════════════════════════════════════════════════════
// PROFILESTORE.JS — Управление профилем тренера/клиента
// ═══════════════════════════════════════════════════════════

// ─── IIFE (Immediately Invoked Function Expression) для инкапсуляции ───
var ProfileStore = (function() {
  // Кэш текущего профиля пользователя
  var profile = null;
  // Флаг загружается ли сейчас профиль
  var loading = false;
  // Массив callback функций подписчиков на изменения профиля
  var subscribers = [];

  // ─── Оповещает всех подписчиков о новых данных профиля ───
  function notify(data) {
    console.log('[ProfileStore] notify() вызван с данными:', data);
    console.log('[ProfileStore] Всего подписчиков:', subscribers.length);
    subscribers.forEach(function(cb) {
      console.log('[ProfileStore] Вызываю callback...');
      cb(data);
    });
    console.log('[ProfileStore] ✅ Все callback вызваны');
  }

  // ─── Подписывает функцию на обновления профиля ───
  function subscribe(callback) {
    console.log('[ProfileStore] subscribe() — добавляю callback');
    console.log('[ProfileStore] Текущий профиль:', profile ? 'ЕСТЬ' : 'null');
    subscribers.push(callback);
    console.log('[ProfileStore] Всего подписчиков теперь:', subscribers.length);
    // Если профиль уже есть, вызывает callback сразу
    if (profile) {
      console.log('[ProfileStore] Профиль уже есть, вызываю callback прямо сейчас');
      callback(profile);
    } else {
      console.log('[ProfileStore] Профиля нет, callback будет вызван позже через notify()');
    }
  }

  // ─── Возвращает текущий кэшированный профиль ───
  function getProfile() {
    return profile;
  }

// ─── Определяет роль пользователя из таблицы users ───
async function determineRole(userTgId) {
  console.log('[ProfileStore] determineRole() вызван для TG ID:', userTgId);
  
  if (!window.sb) {
    console.warn('[ProfileStore] ⚠️ Supabase не инициализирован, возвращаю mock');
    return {
      userTgId: 'mock-' + userTgId,
      role: null,
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
        userTgId: 'mock-' + userTgId,
       role: null,
        isRealUser: false
      };
    }

    if (!userRes.data) {
      console.warn('[ProfileStore] ⚠️ userRes.data пуста');
      return {
        userTgId: 'mock-' + userTgId,
        role: 'trainer',
        isRealUser: false
      };
    }

    console.log('[ProfileStore] ✅ Пользователь найден, ID:', userRes.data.id, 'Роль:', userRes.data.role);
    
    // ✅ Возвращаем реальный UUID из БД
    return {
      userTgId: userRes.data.id,
      role: userRes.data.role,
      isRealUser: true
    };
  } catch (e) {
    console.error('[ProfileStore] ❌ Exception в determineRole:', e.message);
    console.log('[ProfileStore] Возвращаю mock');
    return {
      userTgId: 'mock-' + userTgId,
      role: null,
      isRealUser: false
    };
  }
}

// ─── Загружает данные тренера из таблицы trainers ───
async function loadTrainerProfile(userTgId) {
  console.log('[ProfileStore] loadTrainerProfile() для TG ID:', userTgId);
  
  if (!window.sb) {
    console.warn('[ProfileStore] ⚠️ Supabase не доступен');
    return null;
  }

  try {
    console.log('[ProfileStore] Ищу тренера по telegram_id:', userTgId);
    
    var trainerRes = await window.sb
      .from('trainers')
      .select('*')
      .eq('telegram_id', userTgId)
      .single();

    if (trainerRes.error) {
      console.warn('[ProfileStore] ⚠️ Тренер не найден:', trainerRes.error.message);
      console.log('[ProfileStore] ⚠️ Возвращаю NULL — нужен первичный выбор роли');
      return null;
    }

    if (!trainerRes.data) {
      console.warn('[ProfileStore] ⚠️ trainerRes.data пуста');
      return null;
    }

    var trainer = trainerRes.data;
    console.log('[ProfileStore] ✅ Тренер загружен:', trainer.display_name);

    // Загружаем рецензии для расчёта среднего рейтинга
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

    // Загружаем статус онлайн
    var statusRes = await window.sb
      .from('user_status')
      .select('is_online, last_seen')
      .eq('user_id', userTgId)
      .single();

    var isOnline = false;
    var lastSeen = null;
    if (!statusRes.error && statusRes.data) {
      isOnline = statusRes.data.is_online;
      lastSeen = statusRes.data.last_seen;
    }

    return {
      role: 'trainer',
      telegramId: userTgId,
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
    return null;
  }
}

// ─── Загружает данные клиента из таблицы clients ───
async function loadClientProfile(userTgId) {
  console.log('[ProfileStore] loadClientProfile() для TG ID:', userTgId);
  
  if (!window.sb) {
    console.warn('[ProfileStore] ⚠️ Supabase не доступен');
    return null;
  }

  try {
    console.log('[ProfileStore] Ищу клиента по telegram_id:', userTgId);
    
    var clientRes = await window.sb
      .from('clients')
      .select('*')
      .eq('telegram_id', userTgId)
      .single();

    if (clientRes.error) {
      console.warn('[ProfileStore] ❌ Клиент не найден:', clientRes.error.message);
      return null;
    }

    if (!clientRes.data) {
      console.warn('[ProfileStore] ⚠️ Данные клиента пусты');
      return null;
    }

    var client = clientRes.data;
    console.log('[ProfileStore] ✅ Клиент загружен:', client.name);

    // Загружаем статус онлайн
    var statusRes = await window.sb
      .from('user_status')
      .select('is_online, last_seen')
      .eq('user_id', userTgId)
      .single();

    var isOnline = false;
    var lastSeen = null;
    if (!statusRes.error && statusRes.data) {
      isOnline = statusRes.data.is_online;
      lastSeen = statusRes.data.last_seen;
    }

    return {
      role: 'client',
      telegramId: userTgId,
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
    return null;
  }
}

// ─── Главная функция загрузки профиля (оркестратор) ───
async function loadProfile(userTgId) {
  console.log('[ProfileStore] ===== loadProfile() НАЧАЛО для TG ID:', userTgId, '=====');
  
  if (loading) {
    console.log('[ProfileStore] ⚠️ Уже загружается, игнорирую');
    return;
  }
  
  loading = true;

  try {
    // 1️⃣ Определяем роль пользователя
    var roleData = await determineRole(userTgId);
    
    if (!roleData) {
      console.warn('[ProfileStore] ❌ determineRole вернула null');
      profile = null;
      notify(profile);
      return;
    }

    console.log('[ProfileStore] Роль:', roleData.role);

    // 2️⃣ Если роль не установлена — вернём пустой профиль (покажется селектор роли)
    if (!roleData.role) {
      console.log('[ProfileStore] ⚠️ Роль не установлена — вернём пустой профиль');
      profile = { userTgId: roleData.userTgId, role: null };
      notify(profile);
      return;
    }

    // 3️⃣ Загружаем специфические данные по роли
    var userData = null;
    if (roleData.role === 'trainer') {
      console.log('[ProfileStore] Загружаю тренера...');
      userData = await loadTrainerProfile(userTgId);
    } else if (roleData.role === 'client') {
      console.log('[ProfileStore] Загружаю клиента...');
      userData = await loadClientProfile(userTgId);
    }

    if (!userData) {
      console.warn('[ProfileStore] ⚠️ userData пуста — возможно, это новый пользователь');
      profile = { 
        userTgId: roleData.userTgId, 
        role: roleData.role,
        isIncomplete: true
      };
      notify(profile);
      return;
    }

    // 4️⃣ Дополняем общие данные из таблицы users
    var usersRes = await window.sb
      .from('users')
      .select('photo_url, is_pro, notifications_enabled')
      .eq('id', roleData.userTgId)
      .single();

    if (!usersRes.error && usersRes.data) {
      userData.photoUrl = usersRes.data.photo_url;
      userData.isPro = usersRes.data.is_pro;
      userData.notificationsEnabled = usersRes.data.notifications_enabled;
      console.log('[ProfileStore] ✅ Дополнены данные из users');
    }

    profile = userData;
    console.log('[ProfileStore] ✅✅✅ ПРОФИЛЬ ГОТОВ:', profile);
    notify(profile);

  } catch (e) {
    console.error('[ProfileStore] ❌❌❌ КРИТИЧЕСКАЯ ОШИБКА:', e.message);
    console.error('[ProfileStore] ⚠️ Supabase полностью недоступен, использую mock');
    
    profile = {
      role: 'trainer',
      userTgId: 'mock-error-' + userTgId,
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
    
    notify(profile);
  } finally {
    loading = false;
    console.log('[ProfileStore] ===== loadProfile() КОНЕЦ =====');
  }
}

  // ─── Публичный API ───
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
