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

      for (let client of clients) {
        const workouts = WorkoutsStore.forClient(client.id);
        
        if (workouts.length === 0) {
          console.log(`[TriggerConditions] Клиент ${client.name} без тренировок`);
          return true;
        }

        const lastWorkout = workouts[workouts.length - 1];
        const lastWorkoutDate = new Date(lastWorkout.workout_date);

        if (lastWorkoutDate < sevenDaysAgo) {
          console.log(`[TriggerConditions] Клиент ${client.name} неактивен с ${lastWorkout.workout_date}`);
          return true;
        }
      }

      return false;
    },

    /**
     * INACTIVE_14D - Последняя тренировка более 14 дней назад
     */
    inactive_14d: function() {
      const clients = ClientsStore.getAll();
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

      for (let client of clients) {
        const workouts = WorkoutsStore.forClient(client.id);
        
        if (workouts.length === 0) {
          console.log(`[TriggerConditions] Клиент ${client.name} без тренировок (14 дней)`);
          return true;
        }

        const lastWorkout = workouts[workouts.length - 1];
        const lastWorkoutDate = new Date(lastWorkout.workout_date);

        if (lastWorkoutDate < fourteenDaysAgo) {
          console.log(`[TriggerConditions] Клиент ${client.name} неактивен 14+ дней с ${lastWorkout.workout_date}`);
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
      const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      for (let client of clients) {
        if (!client.birth_date) {
          continue;
        }

        const birthDate = new Date(client.birth_date);
        const birthMonth = birthDate.getMonth();
        const birthDate_day = birthDate.getDate();

        if (birthMonth === todayMonth && birthDate_day === todayDate) {
          console.log(`[TriggerConditions] ДЕНЬ РОЖДЕНИЯ: ${client.name} - СЕГОДНЯ!`);
          return true;
        }

        const upcomingBirthday = new Date(today.getFullYear(), birthMonth, birthDate_day);
        
        if (upcomingBirthday < today) {
          upcomingBirthday.setFullYear(today.getFullYear() + 1);
        }

        if (upcomingBirthday >= today && upcomingBirthday <= sevenDaysLater) {
          const daysLeft = Math.ceil((upcomingBirthday - today) / (1000 * 60 * 60 * 24));
          console.log(`[TriggerConditions] День рождения ${client.name} через ${daysLeft} дней`);
          return true;
        }
      }

      return false;
    },

    /**
     * SUBSCRIPTION_ENDING - Подписка заканчивается в течение 7 дней
     */
    subscription_ending: function() {
      const clients = ClientsStore.getAll();
      const today = new Date();
      const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      for (let client of clients) {
        if (!client.subscription_end_date) {
          continue;
        }

        const subscriptionEnd = new Date(client.subscription_end_date);
        
        if (subscriptionEnd > today && subscriptionEnd <= sevenDaysLater) {
          const daysLeft = Math.ceil((subscriptionEnd - today) / (1000 * 60 * 60 * 24));
          console.log(`[TriggerConditions] Подписка ${client.name} заканчивается через ${daysLeft} дней`);
          return true;
        }
      }

      return false;
    },

    /**
     * STREAK_5 - У клиента серия 5+ тренировок подряд
     */
    streak_5: function() {
      const clients = ClientsStore.getAll();

      for (let client of clients) {
        const workouts = WorkoutsStore.forClient(client.id);
        if (workouts.length === 0) continue;

        const streak = calculateStreak(workouts);
        if (streak >= 5 && streak < 10) {
          console.log(`[TriggerConditions] Клиент ${client.name} имеет серию ${streak} тренировок`);
          return true;
        }
      }

      return false;
    },

    /**
     * STREAK_10 - У клиента серия 10+ тренировок подряд
     */
    streak_10: function() {
      const clients = ClientsStore.getAll();

      for (let client of clients) {
        const workouts = WorkoutsStore.forClient(client.id);
        if (workouts.length === 0) continue;

        const streak = calculateStreak(workouts);
        if (streak >= 10 && streak < 15) {
          console.log(`[TriggerConditions] Клиент ${client.name} имеет серию ${streak} тренировок`);
          return true;
        }
      }

      return false;
    },

    /**
     * STREAK_15 - У клиента серия 15+ тренировок подряд
     */
    streak_15: function() {
      const clients = ClientsStore.getAll();

      for (let client of clients) {
        const workouts = WorkoutsStore.forClient(client.id);
        if (workouts.length === 0) continue;

        const streak = calculateStreak(workouts);
        if (streak >= 15 && streak < 20) {
          console.log(`[TriggerConditions] Клиент ${client.name} имеет серию ${streak} тренировок`);
          return true;
        }
      }

      return false;
    },

    /**
     * STREAK_20 - У клиента серия 20+ тренировок подряд
     */
    streak_20: function() {
      const clients = ClientsStore.getAll();

      for (let client of clients) {
        const workouts = WorkoutsStore.forClient(client.id);
        if (workouts.length === 0) continue;

        const streak = calculateStreak(workouts);
        if (streak >= 20) {
          console.log(`[TriggerConditions] Клиент ${client.name} имеет серию ${streak} тренировок`);
          return true;
        }
      }

      return false;
    },

    /**
     * ACTIVITY_DECREASED - Активность уменьшилась на 50% за неделю
     */
    activity_decreased: function() {
      const clients = ClientsStore.getAll();
      const today = new Date();
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

      for (let client of clients) {
        const workouts = WorkoutsStore.forClient(client.id);
        
        const currentWeekWorkouts = workouts.filter(w => {
          const workoutDate = new Date(w.workout_date);
          return workoutDate >= weekAgo && workoutDate <= today;
        }).length;

        const previousWeekWorkouts = workouts.filter(w => {
          const workoutDate = new Date(w.workout_date);
          return workoutDate >= twoWeeksAgo && workoutDate < weekAgo;
        }).length;

        if (previousWeekWorkouts > 0 && currentWeekWorkouts < previousWeekWorkouts / 2) {
          console.log(`[TriggerConditions] Активность ${client.name} уменьшилась (было ${previousWeekWorkouts}, стало ${currentWeekWorkouts})`);
          return true;
        }
      }

      return false;
    },

    /**
     * NEW_LEAD - Новый потенциальный клиент добавлен за последние 24 часа
     */
    new_lead: function() {
      // Проверяем есть ли новые лиды в LeadsStore
      if (window.LeadsStore && window.LeadsStore.getNew) {
        const newLeads = LeadsStore.getNew();
        if (newLeads && newLeads.length > 0) {
          console.log(`[TriggerConditions] Найдено новых лидов: ${newLeads.length}`);
          return true;
        }
      }

      return false;
    },

    /**
     * REFERRAL - Получена реферальная ссылка / реферал
     */
    referral: function() {
      // Проверяем есть ли активные рефералы
      if (window.ReferralsStore && window.ReferralsStore.getActive) {
        const activeReferrals = ReferralsStore.getActive();
        if (activeReferrals && activeReferrals.length > 0) {
          console.log(`[TriggerConditions] Найдено активных рефералов: ${activeReferrals.length}`);
          return true;
        }
      }

      return false;
    },

    /**
     * REVIEW_LEFT - Оставлен отзыв на сервис
     */
    review_left: function() {
      // Проверяем есть ли новые отзывы
      if (window.ReviewsStore && window.ReviewsStore.getNew) {
        const newReviews = ReviewsStore.getNew();
        if (newReviews && newReviews.length > 0) {
          console.log(`[TriggerConditions] Найдено новых отзывов: ${newReviews.length}`);
          return true;
        }
      }

      return false;
    },

    /**
     * UNPAID_WORKOUT - Есть неоплаченная тренировка
     */
    unpaid_workout: function() {
      const clients = ClientsStore.getAll();

      for (let client of clients) {
        const workouts = WorkoutsStore.forClient(client.id);
        
        const unpaidWorkouts = workouts.filter(w => w.payment_status === 'unpaid' || w.payment_status === 'pending');
        
        if (unpaidWorkouts.length > 0) {
          console.log(`[TriggerConditions] Клиент ${client.name} имеет неоплаченные тренировки: ${unpaidWorkouts.length}`);
          return true;
        }
      }

      return false;
    }
  };

  /**
   * Вспомогательная функция - расчет серии тренировок
   */
  function calculateStreak(workouts) {
    if (!workouts || workouts.length === 0) return 0;

    const sortedWorkouts = workouts.sort((a, b) => 
      new Date(b.workout_date) - new Date(a.workout_date)
    );

    let streak = 0;
    let lastDate = null;

    for (let workout of sortedWorkouts) {
      const workoutDate = new Date(workout.workout_date);
      workoutDate.setHours(0, 0, 0, 0);

      if (lastDate === null) {
        lastDate = new Date(workoutDate);
        streak = 1;
        continue;
      }

      const dayDiff = (lastDate - workoutDate) / (1000 * 60 * 60 * 24);
      
      if (dayDiff === 1) {
        streak++;
        lastDate = new Date(workoutDate);
      } else {
        break;
      }
    }

    return streak;
  }

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
      if (!shouldShowTrigger(trigger)) {
        console.log(`[HomeTriggers] Триггер ${trigger.key} скрыт (условие не выполнено)`);
        return;
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

    button.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal(trigger);
    });

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

    const closeBtn = document.createElement('button');
    closeBtn.className = 'home-trigger-modal-close';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', closeModal);

    const content = document.createElement('div');
    content.className = 'home-trigger-modal-content';
    content.id = 'home-trigger-modal-content';

    modalOverlay.appendChild(closeBtn);
    modalOverlay.appendChild(content);

    document.body.appendChild(modalOverlay);

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

    const description = document.createElement('p');
    description.className = 'home-trigger-modal-description';
    description.textContent = trigger.description || '';

    const descSection = document.createElement('div');
    descSection.className = 'home-trigger-modal-section';
    const descLabel = document.createElement('span');
    descLabel.className = 'home-trigger-modal-label';
    descLabel.textContent = 'Описание';
    descSection.appendChild(descLabel);
    descSection.appendChild(description);

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

    content.innerHTML = '';
    content.appendChild(header);
    content.appendChild(descSection);
    content.appendChild(bonusSection);
    content.appendChild(messageSection);
    content.appendChild(statusSection);

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
    hideTrigger: hideTrigger,
    showAll: showAll,
  };
})();

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
  HomeTriggers.init();
});

window.HomeTriggers = HomeTriggers;
