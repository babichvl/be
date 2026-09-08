// ═══════════════════════════════════════════════════════════
// PROFILESTORE.JS — Управление профилем тренера/клиента
// ═══════════════════════════════════════════════════════════

var ProfileStore = (function() {
  var profile = null;
  var loading = false;
  var subscribers = [];

  function notify(data) {
    subscribers.forEach(function(cb) { cb(data); });
  }

  function subscribe(callback) {
    subscribers.push(callback);
    if (profile) callback(profile);
  }

  function getProfile() {
    return profile;
  }

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

  async function loadProfile(userTgId) {
    if (loading) return;
    loading = true;
    
    console.log('[ProfileStore] Загружаем профиль для TG ID:', userTgId);
    
    try {
      // Используем mock для тестирования
      profile = createMockProfile(userTgId);
      loading = false;
      notify(profile);
      console.log('[ProfileStore] ✅ Mock профиль загружен:', profile);
    } catch (e) {
      console.error('[ProfileStore] ❌ Ошибка:', e.message);
      loading = false;
      profile = null;
      notify(profile);
    }
  }

  return {
    init: function(userTgId) {
      loadProfile(userTgId);
    },
    subscribe: subscribe,
    getProfile: getProfile
  };
})();

console.log('[ProfileStore] ✅ Инициализирован');
