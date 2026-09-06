// ═══════════════════════════════════════════════════════════
// TRIGGERS STORE — загрузка триггеров из Supabase + realtime
// ═══════════════════════════════════════════════════════════

var TriggersStore = (function() {
  var items = [];
  var trainerId = null;
  var channel = null;
  var listeners = [];

  // 12 триггеров с метаданными
  var TRIGGER_DEFINITIONS = [
    {
      key: 'birthday',
      icon: '🎂',
      title: 'День рождения',
      description: 'Поздравление + скидка 10%',
      defaultBonus: { type: 'discount_percent', value: 10 },
      defaultMessage: 'С днём рождения! 🎉 Специально для вас скидка 10% на следующую тренировку!'
    },
    {
      key: 'inactive_14d',
      icon: '⏰',
      title: 'Давно не посещал',
      description: 'Не был 14+ дней → скидка 15%',
      defaultBonus: { type: 'discount_percent', value: 15 },
      defaultMessage: 'Мы скучаем! Возвращайтесь в течение 48 часов и получите скидку 15%'
    },
    {
      key: 'subscription_ending',
      icon: '📅',
      title: 'Абонемент заканчивается',
      description: '1-2 тренировки осталось → скидка 20%',
      defaultBonus: { type: 'discount_percent', value: 20 },
      defaultMessage: 'Ваш абонемент заканчивается! Продлите сейчас со скидкой 20% + 50 баллов'
    },
    {
      key: 'streak_5',
      icon: '🔥',
      title: 'Серия 5 тренировок',
      description: '100 баллов + запрос отзыва',
      defaultBonus: { type: 'points', value: 100 },
      defaultMessage: 'Отличная работа! 5 тренировок подряд — вот ваши 100 баллов! Оставьте отзыв?'
    },
    {
      key: 'streak_10',
      icon: '⭐',
      title: 'Серия 10 тренировок',
      description: 'Скидка 10% + 150 баллов',
      defaultBonus: { type: 'discount_percent', value: 10 },
      defaultMessage: '10 тренировок! Вы супер! Скидка 10% на следующий месяц + 150 баллов'
    },
    {
      key: 'streak_15',
      icon: '💎',
      title: 'Серия 15 тренировок',
      description: 'Скидка 15% + 150 баллов',
      defaultBonus: { type: 'discount_percent', value: 15 },
      defaultMessage: '15 тренировок подряд! Вы чемпион! Скидка 15% + 150 баллов'
    },
    {
      key: 'streak_20',
      icon: '👑',
      title: 'Серия 20 тренировок',
      description: 'Скидка 25% + 150 баллов',
      defaultBonus: { type: 'discount_percent', value: 25 },
      defaultMessage: '20 тренировок! Легенда! Скидка 25% на месяц + 150 баллов'
    },
    {
      key: 'activity_decreased',
      icon: '📉',
      title: 'Снизил активность',
      description: 'Мотивационное сообщение',
      defaultBonus: { type: 'none', value: 0 },
      defaultMessage: 'Заметили, что активность снизилась. Мини-задача на неделю: 3 тренировки!'
    },
    {
      key: 'new_lead',
      icon: '👤',
      title: 'Новый лид',
      description: 'Уведомление тренеру + 50 баллов',
      defaultBonus: { type: 'points', value: 50 },
      defaultMessage: 'Добро пожаловать! После первой тренировки вы получите 50 баллов'
    },
    {
      key: 'referral',
      icon: '🤝',
      title: 'Пригласил друга',
      description: '200 баллов + бесплатная тренировка другу',
      defaultBonus: { type: 'points', value: 200 },
      defaultMessage: 'Спасибо за друга! Вам 200 баллов, другу — бесплатная тренировка + 100 баллов'
    },
    {
      key: 'review_left',
      icon: '⭐',
      title: 'Оставил отзыв',
      description: '50 баллов',
      defaultBonus: { type: 'points', value: 50 },
      defaultMessage: 'Спасибо за отзыв! Вот ваши 50 баллов'
    },
    {
      key: 'unpaid_workout',
      icon: '💳',
      title: 'Неоплаченная тренировка',
      description: 'Вежливое напоминание',
      defaultBonus: { type: 'none', value: 0 },
      defaultMessage: 'Напоминаем об оплате тренировки. Спасибо!'
    }
  ];

  function notify() {
    listeners.forEach(function(fn) {
      try { fn(items); } catch(e) {}
    });
  }

  function subscribe(fn) {
    listeners.push(fn);
    if (items.length) fn(items);
    return function() {
      var idx = listeners.indexOf(fn);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }

  function loadAll() {
    if (!trainerId || !sb) return Promise.resolve([]);

    return sb.from('trigger_settings')
      .select('*')
      .eq('trainer_id', trainerId)
      .then(function(result) {
        if (result.error) {
          console.error('[TriggersStore] Ошибка загрузки:', result.error);
          return items;
        }

        var dbTriggers = result.data || [];
        var triggerMap = {};
        
        dbTriggers.forEach(function(t) {
          triggerMap[t.trigger_key] = t;
        });

        // Объединяем определения с данными из БД
        items = TRIGGER_DEFINITIONS.map(function(def) {
          var dbData = triggerMap[def.key];
          if (dbData) {
            return {
              id: dbData.id,
              key: def.key,
              icon: def.icon,
              title: def.title,
              description: def.description,
              is_enabled: dbData.is_enabled,
              bonus_type: dbData.bonus_type,
              bonus_value: dbData.bonus_value,
              message_text: dbData.message_text
            };
          } else {
            // Триггер ещё не создан в БД
            return {
              id: null,
              key: def.key,
              icon: def.icon,
              title: def.title,
              description: def.description,
              is_enabled: false,
              bonus_type: def.defaultBonus.type,
              bonus_value: def.defaultBonus.value,
              message_text: def.defaultMessage
            };
          }
        });

        notify();
        return items;
      });
  }

  function getAll() {
    return items.slice();
  }

  function getByKey(key) {
    return items.find(function(t) { return t.key === key; });
  }

  function update(key, data) {
    if (!sb || !trainerId) return Promise.reject('No Supabase or trainer');

    var trigger = getByKey(key);
    
    if (trigger && trigger.id) {
      // Обновляем существующий
      return sb.from('trigger_settings')
        .update({
          is_enabled: data.is_enabled !== undefined ? data.is_enabled : trigger.is_enabled,
          bonus_type: data.bonus_type || trigger.bonus_type,
          bonus_value: data.bonus_value !== undefined ? data.bonus_value : trigger.bonus_value,
          message_text: data.message_text || trigger.message_text
        })
        .eq('id', trigger.id)
        .select()
        .single()
        .then(function(result) {
          if (result.error) {
            console.error('[TriggersStore] Ошибка обновления:', result.error);
            return Promise.reject(result.error);
          }
          return loadAll();
        });
    } else {
      // Создаём новый
      return sb.from('trigger_settings')
        .insert({
          trainer_id: trainerId,
          trigger_key: key,
          is_enabled: data.is_enabled !== undefined ? data.is_enabled : false,
          bonus_type: data.bonus_type || trigger.bonus_type,
          bonus_value: data.bonus_value !== undefined ? data.bonus_value : trigger.bonus_value,
          message_text: data.message_text || trigger.message_text
        })
        .select()
        .single()
        .then(function(result) {
          if (result.error) {
            console.error('[TriggersStore] Ошибка создания:', result.error);
            return Promise.reject(result.error);
          }
          return loadAll();
        });
    }
  }

  function startRealtime() {
    if (!sb || channel || !trainerId) return;

    channel = sb.channel('triggers-' + trainerId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trigger_settings',
        filter: 'trainer_id=eq.' + trainerId
      }, function() {
        loadAll();
      })
      .subscribe();
  }

  function init(tgId) {
    trainerId = tgId;
    return loadAll().then(function() {
      startRealtime();

      document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') loadAll();
      });

      return items;
    });
  }

  return {
    init: init,
    subscribe: subscribe,
    getAll: getAll,
    getByKey: getByKey,
    update: update,
    refresh: loadAll
  };
})();

window.TriggersStore = TriggersStore;
