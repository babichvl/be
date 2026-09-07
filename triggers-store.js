// ═══════════════════════════════════════════════════════════
// TRIGGERS STORE — загрузка триггеров из Supabase + realtime
// ═══════════════════════════════════════════════════════════

var TriggersStore = (function() {
  var items = [];
  var trainerId = null;
  var channel = null;
  var listeners = [];

  var TRIGGER_DEFINITIONS = [
    { key: 'birthday', icon: '🎂', title: 'День рождения', description: 'Поздравление + скидка 10%', defaultBonus: { type: 'discount_percent', value: 10 }, defaultMessage: 'С днём рождения! 🎉 Специально для вас скидка 10% на следующую тренировку!' },
    { key: 'inactive_14d', icon: '⏰', title: 'Давно не посещал', description: 'Не был 14+ дней → скидка 15%', defaultBonus: { type: 'discount_percent', value: 15 }, defaultMessage: 'Мы скучаем! Возвращайтесь в течение 48 часов и получите скидку 15%' },
    { key: 'subscription_ending', icon: '📅', title: 'Абонемент заканчивается', description: '1-2 тренировки осталось → скидка 20%', defaultBonus: { type: 'discount_percent', value: 20 }, defaultMessage: 'Ваш абонемент заканчивается! Продлите сейчас со скидкой 20% + 50 баллов' },
    { key: 'streak_5', icon: '🔥', title: 'Серия 5 тренировок', description: '100 баллов + запрос отзыва', defaultBonus: { type: 'points', value: 100 }, defaultMessage: 'Отличная работа! 5 тренировок подряд — вот ваши 100 баллов! Оставьте отзыв?' },
    { key: 'streak_10', icon: '⭐', title: 'Серия 10 тренировок', description: 'Скидка 10% + 150 баллов', defaultBonus: { type: 'discount_percent', value: 10 }, defaultMessage: '10 тренировок! Вы супер! Скидка 10% на следующий месяц + 150 баллов' },
    { key: 'streak_15', icon: '💎', title: 'Серия 15 тренировок', description: 'Скидка 15% + 150 баллов', defaultBonus: { type: 'discount_percent', value: 15 }, defaultMessage: '15 тренировок подряд! Вы чемпион! Скидка 15% + 150 баллов' },
    { key: 'streak_20', icon: '👑', title: 'Серия 20 тренировок', description: 'Скидка 25% + 150 баллов', defaultBonus: { type: 'discount_percent', value: 25 }, defaultMessage: '20 тренировок! Легенда! Скидка 25% на месяц + 150 баллов' },
    { key: 'activity_decreased', icon: '📉', title: 'Снизил активность', description: 'Мотивационное сообщение', defaultBonus: { type: 'none', value: 0 }, defaultMessage: 'Заметили, что активность снизилась. Мини-задача на неделю: 3 тренировки!' },
    { key: 'new_lead', icon: '👤', title: 'Новый лид', description: 'Уведомление тренеру + 50 баллов', defaultBonus: { type: 'points', value: 50 }, defaultMessage: 'Добро пожаловать! После первой тренировки вы получите 50 баллов' },
    { key: 'referral', icon: '🤝', title: 'Пригласил друга', description: '200 баллов + бесплатная тренировка другу', defaultBonus: { type: 'points', value: 200 }, defaultMessage: 'Спасибо за друга! Вам 200 баллов, другу — бесплатная тренировка + 100 баллов' },
    { key: 'review_left', icon: '⭐', title: 'Оставил отзыв', description: '50 баллов', defaultBonus: { type: 'points', value: 50 }, defaultMessage: 'Спасибо за отзыв! Вот ваши 50 баллов' },
    { key: 'unpaid_workout', icon: '💳', title: 'Неоплаченная тренировка', description: 'Вежливое напоминание', defaultBonus: { type: 'none', value: 0 }, defaultMessage: 'Напоминаем об оплате тренировки. Спасибо!' }
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
  if (!trainerId || !window.sb) {
    console.warn('[TriggersStore] trainerId или sb не инициализирован');
    return;
  }

  console.log('[TriggersStore] Загружаем триггеры для trainer_id:', trainerId);

  window.sb
    .from('trigger_settings')
    .select('*')
    .eq('trainer_id', trainerId)
    .then(function(res) {
      if (res.error) {
        console.error('[TriggersStore] Ошибка загрузки:', res.error);
        items = createDefaultTriggers();
        notify();
        return;
      }

      if (!res.data) {
        items = createDefaultTriggers();
        notify();
        return;
      }

      var dbTriggers = {};
      res.data.forEach(function(row) {
        dbTriggers[row.trigger_key] = row;
      });

      var newItems = TRIGGER_DEFINITIONS.map(function(def) {
        var dbData = dbTriggers[def.key];
        if (dbData) {
          return Object.assign({}, def, dbData, { key: def.key, trigger_key: def.key });
        } else {
          return {
            key: def.key,
            trigger_key: def.key,
            trainer_id: trainerId,
            icon: def.icon,
            title: def.title,
            description: def.description,
            is_enabled: true,
            bonus_type: def.defaultBonus.type,
            bonus_value: def.defaultBonus.value,
            message_text: def.defaultMessage,
            created_at: new Date().toISOString()
          };
        }
      });

      // ✅ ВАЖНО: Проверяем, изменились ли данные перед вызовом notify()
      if (JSON.stringify(items) !== JSON.stringify(newItems)) {
        items = newItems;
        console.log('[TriggersStore] ✅ Загружены триггеры:', items.length);
        notify();
      }
    })
    .catch(function(err) {
      console.error('[TriggersStore] Ошибка при запросе:', err);
      items = createDefaultTriggers();
      notify();
    });
}

  function createDefaultTriggers() {
    return TRIGGER_DEFINITIONS.map(function(def) {
      return {
        key: def.key,
        trigger_key: def.key,
        trainer_id: trainerId,
        icon: def.icon,
        title: def.title,
        description: def.description,
        is_enabled: true,
        bonus_type: def.defaultBonus.type,
        bonus_value: def.defaultBonus.value,
        message_text: def.defaultMessage
      };
    });
  }

  function getAll() {
    return items;
  }

  function getByKey(key) {
    return items.find(function(item) { return item.key === key; });
  }

  function update(key, data) {
    return new Promise(function(resolve, reject) {
      if (!window.sb) {
        reject(new Error('Supabase не инициализирован'));
        return;
      }

      var trigger = getByKey(key);
      if (!trigger) {
        reject(new Error('Триггер не найден: ' + key));
        return;
      }

      var updateData = {};
      if (data.is_enabled !== undefined) updateData.is_enabled = data.is_enabled;
      if (data.bonus_type !== undefined) updateData.bonus_type = data.bonus_type;
      if (data.bonus_value !== undefined) updateData.bonus_value = data.bonus_value;
      if (data.message_text !== undefined) updateData.message_text = data.message_text;

      console.log('[TriggersStore] Обновляю триггер:', key, updateData);

      window.sb
        .from('trigger_settings')
        .update(updateData)
        .eq('trainer_id', trainerId)
        .eq('trigger_key', key)
        .then(function(res) {
          if (res.error) {
            console.error('[TriggersStore] Ошибка обновления:', res.error);
            reject(res.error);
            return;
          }

          items = items.map(function(item) {
            if (item.key === key) {
              return Object.assign({}, item, updateData);
            }
            return item;
          });

          console.log('[TriggersStore] ✅ Триггер обновлён');
          notify();
          resolve();
        })
        .catch(reject);
    });
  }

  function startRealtime() {
    if (!trainerId || !window.sb || channel) return;

    console.log('[TriggersStore] Подписываюсь на realtime изменения');

    channel = window.sb
      .channel('trigger_settings:trainer_id=eq.' + trainerId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trigger_settings',
          filter: 'trainer_id=eq.' + trainerId
        },
        function(payload) {
          console.log('[TriggersStore] Realtime изменение:', payload);
          loadAll();
        }
      )
      .subscribe();
  }

  function init(tgId) {
    trainerId = tgId;
    console.log('[TriggersStore] Инициализация с trainerId:', trainerId);

    var attempt = 0;
    var checkSb = setInterval(function() {
      attempt++;
      if (window.sb && window.sb.from) {
        clearInterval(checkSb);
        console.log('[TriggersStore] Supabase готов, загружаю триггеры');
        loadAll();
        startRealtime();


      } else if (attempt > 20) {
        clearInterval(checkSb);
        console.error('[TriggersStore] Supabase не загружен');
        items = createDefaultTriggers();
        notify();
      }
    }, 100);
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
