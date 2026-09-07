// ════════════════════════════════════════════════════════════════════════════
// HOME TRIGGERS - Триггеры на главной вкладке
// ════════════════════════════════════════════════════════════════════════════

var HomeTriggers = (function() {
  var scrollContainer = null;
  var carousel = null;
  var modalOverlay = null;
  var currentTriggerId = null;
  var triggersData = [];

  /**
   * TRIGGER CONDITIONS - Логика для проверки когда показывать триггер
   * Каждая функция возвращает true если триггер должен быть активен
   */
  var TriggerConditions = {
    /**
     * INACTIVE_7D - Последняя тренировка более 7 дней назад
     */
    inactive_7d: function() {
      const clients = ClientsStore.getAll();
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Проверяем каждого клиента
      for (let client of clients) {
        const workouts = WorkoutsStore.forClient(client.id);
        
        // Если нет тренировок - клиент точно неактивен
        if (workouts.length === 0) {
          console.log(`[TriggerConditions] Клиент ${client.name} без тренировок`);
          return true;
        }

        // Берем последнюю тренировку
        const lastWorkout = workouts[workouts.length - 1];
        const lastWorkoutDate = new Date(lastWorkout.workout_date);

        // Если последняя тренировка > 7 дней назад
        if (lastWorkoutDate < sevenDaysAgo) {
          console.log(`[TriggerConditions] Клиент ${client.name} неактивен с ${lastWorkout.workout_date}`);
          return true;
        }
      }

      return false;
    },

    /**
     * BIRTHDAY - День рождения сегодня или ±7 дней
     */
    birthday: function() {
      const clients = ClientsStore.getAll();
      const today = new Date();
      const todayMonth = today.getMonth();
      const todayDate = today.getDate();

      // Вычисляем диапазон (±7 дней для проверки)
      const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      for (let client of clients) {
        // Пропускаем если нет даты рождения
        if (!client.birth_date) {
          continue;
        }

        const birthDate = new Date(client.birth_date);
        const birthMonth = birthDate.getMonth();
        const birthDate_day = birthDate.getDate();

        // Проверяем дату рождения
        // 1. Точно сегодня
        if (birthMonth === todayMonth && birthDate_day === todayDate) {
          console.log(`[TriggerConditions] ДЕНЬ РОЖДЕНИЯ: ${client.name} - СЕГОДНЯ!`);
          return true;
        }

        // 2. В течение 7 дней (учитывая переход месяца/года)
        const upcomingBirthday = new Date(today.getFullYear(), birthMonth, birthDate_day);
        
        // Если дата уже прошла в этом году - берем следующий год
        if (upcomingBirthday < today) {
          upcomingBirthday.setFullYear(today.getFullYear() + 1);
        }

        // Если дата рождения в ближайшие 7 дней
        if (upcomingBirthday >= today && upcomingBirthday <= sevenDaysLater) {
          const daysLeft = Math.ceil((upcomingBirthday - today) / (1000 * 60 * 60 * 24));
          console.log(`[TriggerConditions] День рождения ${client.name} через ${daysLeft} дней (${upcomingBirthday.toLocaleDateString()})`);
          return true;
        }
      }

      return false;
    },

    // Placeholder для остальных триггеров (добавим позже)
    subscription_ending: () => false,
    streak_5: () => false,
    streak_10: () => false,
    streak_15: () => false,
    streak_20: () => false,
    activity_decreased: () => false,
    new_lead: () => false,
    referral: () => false,
    review_left: () => false,
    unpaid_workout: () => false,
  };

  /**
   * Проверка должен ли триггер быть показан
   */
  function shouldShowTrigger(trigger) {
    const condition = TriggerConditions[trigger.key];
    if (!condition) {
      console.warn(`[HomeTriggers] Нет условия для триггера: ${trigger.key}`);
      return false;
    }

    try {
      return condition();
    } catch (error) {
      console.error(`[HomeTriggers] Ошибка при проверке триггера ${trigger.key}:`, error);
      return false;
    }
  }

  /**
   * Инициализация компонента
   */
  function init() {
    console.log('[HomeTriggers] Инициализация...');

    scrollContainer = document.getElementById('home-triggers-scroll');
    carousel = document.getElementById('home-triggers-carousel');

    if (!scrollContainer || !carousel) {
      console.warn('[HomeTriggers] Контейнер не найден');
      return;
    }

    console.log('[HomeTriggers] ✅ Инициализация успешна');

    // Подписываемся на изменения триггеров
    TriggersStore.subscribe((triggers) => {
      onTriggersUpdate(triggers);
    });

    // Также подписываемся на изменения клиентов и тренировок (для обновления условий)
    if (ClientsStore && ClientsStore.subscribe) {
      ClientsStore.subscribe(() => {
        console.log('[HomeTriggers] Клиенты обновились - перепроверяем условия');
        render();
      });
    }

    if (WorkoutsStore && WorkoutsStore.subscribe) {
      WorkoutsStore.subscribe(() => {
        console.log('[HomeTriggers] Тренировки обновились - перепроверяем условия');
        render();
      });
    }

    // Создаём модальное окно
    createModal();
  }

  /**
   * Обновление при изменении триггеров
   */
  function onTriggersUpdate(triggers) {
    console.log('[HomeTriggers] Получены триггеры:', triggers.length);
    triggersData = triggers;
    render();
  }

  /**
   * Рендеринг карусели с фильтрацией по условиям
   */
  function render() {
    if (!scrollContainer) return;

    scrollContainer.innerHTML = '';
    let visibleCount = 0;

    // Отображаем только триггеры, которые прошли проверку условий
    triggersData.forEach((trigger) => {
      // Проверяем должен ли триггер быть показан
      if (!shouldShowTrigger(trigger)) {
        console.log(`[HomeTriggers] Триггер ${trigger.key} скрыт (условие не выполнено)`);
        return; // Пропускаем этот триггер
      }

      console.log(`[HomeTriggers] ✅ Триггер ${trigger.key} активен - показываем`);
      const card = createTriggerCard(trigger);
      scrollContainer.appendChild(card);
      visibleCount++;
    });

    console.log(`[HomeTriggers] Отрендерено активных карточек: ${visibleCount} из ${triggersData.length}`);
  }

  /**
   * Создание карточки триггера
   */
  function createTriggerCard(trigger) {
    const card = document.createElement('div');
    card.className = `home-trigger-card trigger-${trigger.key}`;
    card.id = `home-trigger-${trigger.id}`;

    const icon = document.createElement('div');
    icon.className = 'home-trigger-icon';
    icon.textContent = trigger.icon || '📌';

    const name = document.createElement('h3');
    name.className = 'home-trigger-name';
    name.textContent = trigger.title || 'Триггер';

    const subtitle = document.createElement('p');
    subtitle.className = 'home-trigger-subtitle';
    subtitle.textContent = trigger.description || '';

    const button = document.createElement('button');
    button.className = 'home-trigger-button';
    button.textContent = 'View';

    // Обработчик клика на кнопку
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal(trigger);
    });

    // Обработчик клика на карточку
    card.addEventListener('click', () => {
      openModal(trigger);
    });

    card.appendChild(icon);
    card.appendChild(name);
    card.appendChild(subtitle);
    card.appendChild(button);

    return card;
  }

  /**
   * Создание модального окна
   */
  function createModal() {
    modalOverlay = document.createElement('div');
    modalOverlay.className = 'home-trigger-modal';
    modalOverlay.id = 'home-trigger-modal';

    // Закрывающий крестик
    const closeBtn = document.createElement('button');
    closeBtn.className = 'home-trigger-modal-close';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', closeModal);

    // Контент модали
    const content = document.createElement('div');
    content.className = 'home-trigger-modal-content';
    content.id = 'home-trigger-modal-content';

    modalOverlay.appendChild(closeBtn);
    modalOverlay.appendChild(content);

    // Добавляем на страницу
    document.body.appendChild(modalOverlay);

    // Закрытие по клику на фон
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });
  }

  /**
   * Открытие модального окна с деталями триггера
   */
  function openModal(trigger) {
    if (!modalOverlay) return;

    currentTriggerId = trigger.id;
    const content = document.getElementById('home-trigger-modal-content');

    if (!content) return;

    // Заголовок
    const header = document.createElement('div');
    header.className = 'home-trigger-modal-header';
    const headerIcon = document.createElement('div');
    headerIcon.className = 'home-trigger-modal-icon';
    headerIcon.textContent = trigger.icon || '📌';
    const headerTitle = document.createElement('h2');
    headerTitle.className = 'home-trigger-modal-title';
    headerTitle.textContent = trigger.title || 'Триггер';
    header.appendChild(headerIcon);
    header.appendChild(headerTitle);

    // Описание
    const description = document.createElement('p');
    description.className = 'home-trigger-modal-description';
    description.textContent = trigger.description || '';

    // Секция "Описание"
    const descSection = document.createElement('div');
    descSection.className = 'home-trigger-modal-section';
    const descLabel = document.createElement('span');
    descLabel.className = 'home-trigger-modal-label';
    descLabel.textContent = 'Описание';
    descSection.appendChild(descLabel);
    descSection.appendChild(description);

    // Секция "Бонус"
    const bonusSection = document.createElement('div');
    bonusSection.className = 'home-trigger-modal-section';
    const bonusLabel = document.createElement('span');
    bonusLabel.className = 'home-trigger-modal-label';
    bonusLabel.textContent = 'Бонус';
    const bonusValue = document.createElement('div');
    bonusValue.className = 'home-trigger-modal-value';
    bonusValue.textContent = formatBonus(trigger.bonus_type, trigger.bonus_value);
    bonusSection.appendChild(bonusLabel);
    bonusSection.appendChild(bonusValue);

    // Секция "Сообщение"
    const messageSection = document.createElement('div');
    messageSection.className = 'home-trigger-modal-section';
    const messageLabel = document.createElement('span');
    messageLabel.className = 'home-trigger-modal-label';
    messageLabel.textContent = 'Сообщение';
    const messageValue = document.createElement('div');
    messageValue.className = 'home-trigger-modal-value';
    messageValue.textContent = trigger.message_text || 'Не указано';
    messageSection.appendChild(messageLabel);
    messageSection.appendChild(messageValue);

    // Секция "Статус"
    const statusSection = document.createElement('div');
    statusSection.className = 'home-trigger-modal-section';
    const statusLabel = document.createElement('span');
    statusLabel.className = 'home-trigger-modal-label';
    statusLabel.textContent = 'Статус';
    const statusValue = document.createElement('div');
    statusValue.className = 'home-trigger-modal-value';
    statusValue.textContent = trigger.is_enabled ? '🟢 Включен' : '🔴 Отключен';
    statusSection.appendChild(statusLabel);
    statusSection.appendChild(statusValue);

    // Очищаем и наполняем контент
    content.innerHTML = '';
    content.appendChild(header);
    content.appendChild(descSection);
    content.appendChild(bonusSection);
    content.appendChild(messageSection);
    content.appendChild(statusSection);

    // Показываем модаль
    modalOverlay.classList.add('active');
    console.log('[HomeTriggers] Открыта модаль для:', trigger.title);
  }

  /**
   * Закрытие модального окна
   */
  function closeModal() {
    if (modalOverlay) {
      modalOverlay.classList.remove('active');
      currentTriggerId = null;
      console.log('[HomeTriggers] Модаль закрыта');
    }
  }

  /**
   * Форматирование бонуса
   */
  function formatBonus(bonusType, bonusValue) {
    if (!bonusType || bonusType === 'none') {
      return 'Нет бонуса';
    }

    switch (bonusType) {
      case 'discount_percent':
        return `Скидка ${bonusValue || 0}%`;
      case 'discount_sum':
        return `Скидка ${bonusValue || 0} ₽`;
      case 'points':
        return `${bonusValue || 0} баллов`;
      default:
        return `${bonusType}: ${bonusValue}`;
    }
  }

  /**
   * Методы для фильтрации (в будущем)
   */
  
  /**
   * Показать триггеры, которые требуют внимания
   * (В будущем это будет заполнено условиями от событий)
   */
  function filterByStatus(status) {
    // TODO: Реализовать фильтрацию по статусу
    // status может быть: 'all', 'active', 'inactive', 'requires_attention'
    console.log('[HomeTriggers] Фильтр по статусу:', status);
    render();
  }

  /**
   * Показать только те триггеры, которые сработали
   */
  function filterByEvent(eventKey) {
    // TODO: Реализовать фильтрацию по событиям
    // eventKey может быть: 'birthday', 'inactive_14d', 'streak_5' и т.д.
    console.log('[HomeTriggers] Фильтр по событию:', eventKey);
    render();
  }

  /**
   * Скрыть триггер (например, после просмотра)
   */
  function hideTrigger(triggerId) {
    const card = document.getElementById(`home-trigger-${triggerId}`);
    if (card) {
      card.style.display = 'none';
      console.log('[HomeTriggers] Триггер скрыт:', triggerId);
    }
  }

  /**
   * Показать все триггеры
   */
  function showAll() {
    if (scrollContainer) {
      const cards = scrollContainer.querySelectorAll('.home-trigger-card');
      cards.forEach(card => {
        card.style.display = '';
      });
    }
    console.log('[HomeTriggers] Все триггеры показаны');
  }

  return {
    init: init,
    filterByStatus: filterByStatus,
    filterByEvent: filterByEvent,
    hideTrigger: hideTrigger,
    showAll: showAll,
  };
})();

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
  HomeTriggers.init();
});

window.HomeTriggers = HomeTriggers;
