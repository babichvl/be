/**
 * GymBro Trainer App — приложение для тренера
 * Работает с Supabase и управляет тренировками, клиентами, программами
 */

// ==================== Инициализация ====================

/**
 * Основная функция инициализации приложения тренера
 * Загружает данные, устанавливает обработчики событий
 */
async function initTrainerApp() {
  // Проверяем авторизацию
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    window.location.href = '/';
    return;
  }

  // Загружаем данные тренера
  await loadTrainerData(user.id);

  // Установим обработчики событий
  setupEventHandlers();

  // Загружаем начальные данные (тренировки, клиентов, программы)
  await loadTodayWorkouts(user.id);
  await loadActiveTriggers(user.id);
}

// ==================== Загрузка данных ====================

/**
 * Загружает данные тренера из базы данных
 * @param {string} userId - ID тренера
 */
async function loadTrainerData(userId) {
  try {
    const { data, error } = await supabase
      .from('trainers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    if (data) {
      document.getElementById('trainer-name').textContent = data.name || 'Тренер';
      setCurrentDate();
    }
  } catch (err) {
    console.error('Ошибка при загрузке данных тренера:', err);
  }
}

/**
 * Загружает тренировки на сегодня
 * @param {string} userId - ID тренера
 */
async function loadTodayWorkouts(userId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('workouts')
      .select(`
        id,
        client_id,
        type,
        status,
        start_time,
        end_time,
        clients (name)
      `)
      .eq('trainer_id', userId)
      .gte('start_time', `${today}T00:00:00`)
      .lt('start_time', `${today}T23:59:59`)
      .order('start_time', { ascending: true });

    if (error) throw error;

    const list = document.getElementById('workouts-list');
    
    if (!data || data.length === 0) {
      list.innerHTML = '<p>На сегодня тренировок нет</p>';
      return;
    }

    list.innerHTML = data.map(workout => `
      <div class="workout-card">
        <div class="workout-card-header">
          <div>
            <div class="workout-client">${workout.clients?.name || 'Клиент'}</div>
            <span class="workout-type">${getWorkoutTypeLabel(workout.type)}</span>
          </div>
          <span class="workout-status status-${workout.status}">
            ${getStatusLabel(workout.status)}
          </span>
        </div>
        <p>${formatTime(workout.start_time)} - ${formatTime(workout.end_time)}</p>
        <button class="btn btn-sm" onclick="markWorkoutComplete('${workout.id}')">
          ✓ Отметить выполненной
        </button>
      </div>
    `).join('');
  } catch (err) {
    console.error('Ошибка при загрузке тренировок:', err);
  }
}

/**
 * Загружает активные триггеры (уведомления)
 * @param {string} userId - ID тренера
 */
async function loadActiveTriggers(userId) {
  try {
    const { data, error } = await supabase
      .from('trigger_actions')
      .select(`
        id,
        trigger_type,
        client_id,
        clients (name)
      `)
      .eq('trainer_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const list = document.getElementById('triggers-list');
    
    if (!data || data.length === 0) {
      list.innerHTML = '<p>Нет активных уведомлений</p>';
      return;
    }

    list.innerHTML = data.map(action => `
      <div class="trigger-card">
        <div class="trigger-info">
          <div class="trigger-title">${getTriggerLabel(action.trigger_type)}</div>
          <div class="trigger-client">Клиент: ${action.clients?.name || 'Unknown'}</div>
        </div>
        <div class="trigger-actions">
          <button class="trigger-btn" onclick="completeTrigger('${action.id}')">
            Выполнено
          </button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Ошибка при загрузке триггеров:', err);
  }
}

// ==================== Обработчики событий ====================

/**
 * Установка обработчиков событий для UI элементов
 */
function setupEventHandlers() {
  // Обработка переключения вкладок
  document.querySelectorAll('.nav-btn:not(.add-btn)').forEach(btn => {
    btn.addEventListener('click', (e) => {
      switchTab(e.target.closest('.nav-btn').dataset.tab);
    });
  });

  // Кнопка ИИ-ассистента
  document.getElementById('ai-btn').addEventListener('click', toggleAIAssistant);
  document.getElementById('close-ai').addEventListener('click', toggleAIAssistant);

  // Отправка сообщения в ИИ
  document.getElementById('send-btn').addEventListener('click', sendAIMessage);
  document.getElementById('ai-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendAIMessage();
  });
}

/**
 * Переключение между вкладками
 * @param {string} tabName - имя вкладки для переключения
 */
function switchTab(tabName) {
  // Скрываем все вкладки
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });

  // Убираем активный статус со всех кнопок
  document.querySelectorAll('.nav-btn:not(.add-btn)').forEach(btn => {
    btn.classList.remove('active');
  });

  // Показываем выбранную вкладку
  document.getElementById(tabName)?.classList.add('active');

  // Подсвечиваем соответствующую кнопку
  document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
}

/**
 * Переключение видимости ИИ-ассистента
 */
function toggleAIAssistant() {
  document.getElementById('ai-modal').classList.toggle('hidden');
}

/**
 * Отправка сообщения ИИ-ассистенту
 */
async function sendAIMessage() {
  const input = document.getElementById('ai-input');
  const message = input.value.trim();

  if (!message) return;

  // Очищаем инпут
  input.value = '';

  // Добавляем сообщение пользователя в чат
  addAIMessage(message, 'user');

  // Отправляем на backend (Replit)
  try {
    const response = await fetch('https://YOUR_REPLIT_URL/api/ai-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        context: 'trainer',
      }),
    });

    const data = await response.json();
    
    if (data.reply) {
      addAIMessage(data.reply, 'assistant');
    }
  } catch (err) {
    console.error('Ошибка при отправке сообщения:', err);
    addAIMessage('Извините, произошла ошибка. Попробуйте позже.', 'assistant');
  }
}

/**
 * Добавление сообщения в чат ИИ-ассистента
 * @param {string} text - текст сообщения
 * @param {string} sender - отправитель ('user' или 'assistant')
 */
function addAIMessage(text, sender) {
  const messagesContainer = document.getElementById('ai-messages');
  const messageEl = document.createElement('div');
  messageEl.className = `ai-message ${sender}`;
  messageEl.textContent = text;
  messagesContainer.appendChild(messageEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ==================== Функции действий ====================

/**
 * Отметить тренировку как выполненную
 * @param {string} workoutId - ID тренировки
 */
async function markWorkoutComplete(workoutId) {
  try {
    const { error } = await supabase
      .from('workouts')
      .update({ status: 'completed' })
      .eq('id', workoutId);

    if (error) throw error;

    // Перезагружаем список
    const { data: { user } } = await supabase.auth.getUser();
    await loadTodayWorkouts(user.id);
  } catch (err) {
    console.error('Ошибка при отметке тренировки:', err);
  }
}

/**
 * Отметить триггер как выполненный
 * @param {string} actionId - ID действия триггера
 */
async function completeTrigger(actionId) {
  try {
    const { error } = await supabase
      .from('trigger_actions')
      .update({ status: 'completed' })
      .eq('id', actionId);

    if (error) throw error;

    // Перезагружаем список
    const { data: { user } } = await supabase.auth.getUser();
    await loadActiveTriggers(user.id);
  } catch (err) {
    console.error('Ошибка при выполнении триггера:', err);
  }
}

// ==================== Утилиты ====================

/**
 * Установка текущей даты
 */
function setCurrentDate() {
  const date = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('current-date').textContent = date.toLocaleDateString('ru-RU', options);
}

/**
 * Форматирование времени HH:MM
 * @param {string} datetime - время в ISO формате
 * @returns {string} отформатированное время
 */
function formatTime(datetime) {
  return new Date(datetime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Получить подпись типа тренировки
 * @param {string} type - тип тренировки
 * @returns {string} подпись
 */
function getWorkoutTypeLabel(type) {
  const labels = {
    'personal': 'Персональная',
    'group': 'Групповая',
    'online': 'Онлайн',
    'split': 'Сплит',
    'intro': 'Вводная',
  };
  return labels[type] || type;
}

/**
 * Получить подпись статуса
 * @param {string} status - статус
 * @returns {string} подпись
 */
function getStatusLabel(status) {
  const labels = {
    'pending': 'Ожидает',
    'confirmed': 'Подтверждена',
    'completed': 'Проведена',
    'cancelled': 'Отменена',
  };
  return labels[status] || status;
}

/**
 * Получить подпись триггера
 * @param {string} triggerType - тип триггера
 * @returns {string} подпись
 */
function getTriggerLabel(triggerType) {
  const labels = {
    'birthday': '🎂 День рождения',
    'not_visited': '📉 Давно не посещал',
    'subscription_ends': '📆 Заканчивается абонемент',
    'series_5': '🏆 Серия 5',
    'new_lead': '👤 Новый лид',
    'review': '⭐ Оставил отзыв',
  };
  return labels[triggerType] || triggerType;
}

// ==================== Жизненный цикл ====================

// Инициализируем приложение при загрузке страницы
document.addEventListener('DOMContentLoaded', initTrainerApp);
