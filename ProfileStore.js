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

  // ─── Подписка на изменения ─────────────────────────────────
  function subscribe(callback) {
    subscribers.push(callback);
    if (profile) callback(profile);
  }

  // ─── Получить текущий профиль ─────────────────────────────
  function getProfile() {
    return profile;
  }

  // ─── Определить роль пользователя ─────────────────────────
  async function determineRole(userTgId) {
    if (!window.sb) {
      console.error('[ProfileStore] Supabase не инициализирован');
      return null;
    }

    try {
      // 1. Ищем пользователя в users по telegram_id
      var userRes = await window.sb
        .from('users')
        .select('id, role')
        .eq('telegram_id', userTgId)
        .single();

      if (userRes.error) {
        console.warn('[ProfileStore] Пользователь не найден:', userRes.error);
        return null;
      }

      return {
        userId: userRes.data.id,
        role: userRes.data.role // 'trainer', 'client', или null
      };
    } catch (e) {
      console.error('[ProfileStore] Ошибка при определении роли:', e);
      return null;
    }
  }

  // ─── Загрузить данные тренера ──────────────────────────────
  async function loadTrainerProfile(userId) {
    if (!window.sb) {
      console.error('[ProfileStore] Supabase не инициализирован');
      return null;
    }

    try {
      // 1. Загружаем данные тренера
      var trainerRes = await window.sb
        .from('trainers')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (trainerRes.error) {
        console.warn('[ProfileStore] Тренер не найден:', trainerRes.error);
        return null;
      }

      var trainer = trainerRes.data;

      // 2. Загружаем средний рейтинг из trainer_reviews
      var reviewsRes = await window.sb
        .from('trainer_reviews')
        .select('rating')
        .eq('trainer_tg_id', trainer.id);

      var avgRating = 0;
      if (!reviewsRes.error && reviewsRes.data.length > 0) {
        var sum = reviewsRes.data.reduce(function(acc, r) {
          return acc + parseFloat(r.rating || 0);
        }, 0);
        avgRating = (sum / reviewsRes.data.length).toFixed(1);
      }

      // 3. Загружаем статус онлайн
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
        photoUrl: null, // Загружаем из users
        rating: parseFloat(avgRating),
        isOnline: isOnline,
        lastSeen: lastSeen,
        isPro: false // Загружаем из users
      };
    } catch (e) {
      console.error('[ProfileStore] Ошибка при загрузке тренера:', e);
      return null;
    }
  }

  // ─── Загрузить данные клиента ──────────────────────────────
  async function loadClientProfile(userId) {
    if (!window.sb) {
      console.error('[ProfileStore] Supabase не инициализирован');
      return null;
    }

    try {
      // 1. Загружаем данные клиента
      var clientRes = await window.sb
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (clientRes.error) {
        console.warn('[ProfileStore] Клиент не найден:', clientRes.error);
        return null;
      }

      var client = clientRes.data;

      // 2. Загружаем статус онлайн
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
        birthDate: client.birth_date
      };
    } catch (e) {
      console.error('[ProfileStore] Ошибка при загрузке клиента:', e);
      return null;
    }
  }

  // ─── Главная функция загрузки профиля ──────────────────────
  async function loadProfile(userTgId) {
    if (loading) return;
    
    loading = true;
    console.log('[ProfileStore] Загружаем профиль для TG ID:', userTgId);

    try {
      // 1. Определяем роль
      var roleData = await determineRole(userTgId);
      
      if (!roleData) {
        console.warn('[ProfileStore] ❌ Не удалось определить роль пользователя');
        loading = false;
        profile = null;
        notify(profile);
        return;
      }

      console.log('[ProfileStore] Роль определена:', roleData.role);

      // 2. Если роль не установлена — нужен выбор
      if (!roleData.role) {
        console.log('[ProfileStore] ⚠️ Роль не установлена — нужен выбор пользователя');
        loading = false;
        profile = { userId: roleData.userId, role: null };
        notify(profile);
        return;
      }

      // 3. Загружаем данные в зависимости от роли
      var userData = null;
      if (roleData.role === 'trainer') {
        userData = await loadTrainerProfile(roleData.userId);
      } else if (roleData.role === 'client') {
        userData = await loadClientProfile(roleData.userId);
      }

      if (!userData) {
        console.error('[ProfileStore] ❌ Не удалось загрузить данные профиля');
        loading = false;
        profile = null;
        notify(profile);
        return;
      }

      // 4. Загружаем общие данные из users
      var usersRes = await window.sb
        .from('users')
        .select('photo_url, is_pro, notifications_enabled')
        .eq('id', roleData.userId)
        .single();

      if (!usersRes.error && usersRes.data) {
        userData.photoUrl = usersRes.data.photo_url;
        userData.isPro = usersRes.data.is_pro;
        userData.notificationsEnabled = usersRes.data.notifications_enabled;
      }

      profile = userData;
      console.log('[ProfileStore] ✅ Профиль загружен:', profile);
      notify(profile);

    } catch (e) {
      console.error('[ProfileStore] ❌ Ошибка при загрузке профиля:', e);
      loading = false;
      profile = null;
      notify(profile);
    } finally {
      loading = false;
    }
  }

  // ─── API ───────────────────────────────────────────────────
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
