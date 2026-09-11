/**
 * GymBro — Главный JavaScript файл приложения
 * Управляет всеми функциями: Supabase, события, навигация, Telegram Web App
 */

// ==================== КОНФИГУРАЦИЯ ==================== 

/**
 * URL и ключ Supabase
 * Используем anon_key для фронтенда
 */
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_KEY = 'YOUR_ANON_KEY';

/**
 * URL бэкенда (где запущен main.py)
 * Для разработки: http://localhost:8080
 * Для продакшена: https://ваш-домен.com
 */
const BACKEND_URL = 'http://localhost:8080';

/**
 * Инициализируем клиент Supabase
 * Используем глобальный объект window.supabase, загруженный через CDN
 */
const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Получаем Telegram Web App (если приложение запущено в Telegram)
 * window.Telegram.WebApp предоставляет информацию о пользователе
 */
const tg = window.Telegram?.WebApp;

// ==================== ИНИЦИАЛИЗАЦИЯ ==================== 

/**
 * Основная функция инициализации приложения
 * Вызывается когда DOM полностью загружен
 */
async function initializeApp() {
  log('Инициализация GymBro...');
  
  // Устанавливаем обработчики событий
  setupEventHandlers();
  
  // Проверяем, выбрал ли пользователь роль при первом запуске
  await checkRoleSelection();
}

/**
 * Проверка выбора роли пользователем
 * Если роль не выбрана — показываем модальное окно
 * Если роль выбрана — скрываем модальное окно
 */
async function checkRoleSelection() {
  // Пытаемся получить данные пользователя из Telegram или localStorage
  const userId = tg?.initDataUnsafe?.user?.id || localStorage.getItem('user_id');
  
  if (!userId) {
    log('Не удалось получить ID пользователя', 'warn');
    return;
  }
  
  try {
    // Запрашиваем у Supabase, есть ли уже роль у пользователя
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('telegram_id', userId)
      .single();
    
    if (error) {
      // Пользователь не найден или это первый запуск
      log('Это первый запуск — показываем модальное окно');
      showModal();
    } else if (!data?.role) {
      // Пользователь есть, но роль не выбрана
      log('Роль не выбрана — показываем модальное окно');
      showModal();
    } else {
      // Роль уже выбрана — скрываем модальное окно
      log(`Роль пользователя: ${data.role}`);
      hideModal();
    }
  } catch (err) {
    log(`Ошибка при проверке роли: ${err.message}`, 'error');
    showModal();
  }
}

// ==================== МОДАЛЬНОЕ ОКНО ==================== 

/**
 * Показать модальное окно выбора роли
 */
function showModal() {
  const modal = document.getElementById('role-modal');
  if (modal) {
    modal.classList.remove('hidden');
  }
}

/**
 * Скрыть модальное окно выбора роли
 */
function hideModal() {
  const modal = document.getElementById('role-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// ==================== ОБРАБОТЧИКИ СОБЫТИЙ ==================== 

/**
 * Установка обработчиков на все интерактивные элементы
 */
function setupEventHandlers() {
  // Кнопки выбора роли в модальном окне
  const modalTrainerBtn = document.getElementById('modal-trainer-btn');
  const modalClientBtn = document.getElementById('modal-client-btn');
  
  // Кнопки выбора роли на главной странице
  const trainerBtn = document.getElementById('trainer-btn');
  const clientBtn = document.getElementById('client-btn');

  // Модальное окно — кнопка "Я тренер"
  if (modalTrainerBtn) {
    modalTrainerBtn.addEventListener('click', () => {
      handleRoleSelect('trainer');
    });
  }

  // Модальное окно — кнопка "Я клиент"
  if (modalClientBtn) {
    modalClientBtn.addEventListener('click', () => {
      handleRoleSelect('client');
    });
  }
  
  // Главная страница — кнопка "Я тренер"
  if (trainerBtn) {
    trainerBtn.addEventListener('click', () => {
      handleRoleSelect('trainer');
    });
  }

  // Главная страница — кнопка "Я клиент"
  if (clientBtn) {
    clientBtn.addEventListener('click', () => {
      handleRoleSelect('client');
    });
  }
}

/**
 * Обработка выбора роли пользователем
 * Отправляем выбор на бэкенд через Telegram Bot API
 * @param {string} role - выбранная роль ('trainer' или 'client')
 */
async function handleRoleSelect(role) {
  log(`Выбрана роль: ${role}`);
  
  try {
    // Получаем информацию о пользователе из Telegram Web App
    const userData = tg?.initDataUnsafe?.user;
    
    if (!userData || !userData.id) {
      log('Ошибка: не удалось получить данные пользователя Telegram', 'error');
      alert('Ошибка: приложение должно быть открыто через Telegram');
      return;
    }
    
    // Сохраняем ID пользователя в localStorage для отладки
    localStorage.setItem('user_id', userData.id);
    localStorage.setItem('user_role', role);
    
    // Отправляем выбор роли на бэкенд
    log(`Отправляем запрос на бэкенд для сохранения роли...`);
    
    const response = await fetch(`${BACKEND_URL}/api/user/role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        telegram_id: userData.id,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        username: userData.username || '',
        language_code: userData.language_code || 'ru',
        role: role
      })
    });
    
    if (!response.ok) {
      throw new Error(`Ошибка при сохранении роли: ${response.statusText}`);
    }
    
    const result = await response.json();
    log(`Роль успешно сохранена: ${result.message}`);
    
    // Скрываем модальное окно после успешного сохранения
    hideModal();
    
    // Показываем уведомление
    alert(`✅ Вы выбрали роль: ${role === 'trainer' ? 'Тренер' : 'Клиент'}`);
    
  } catch (err) {
    log(`Ошибка при обработке выбора роли: ${err.message}`, 'error');
    alert(`❌ Ошибка: ${err.message}`);
  }
}

// ==================== УТИЛИТЫ ==================== 

/**
 * Логирование сообщений с форматированием и временными метками
 * @param {string} message - сообщение для логирования
 * @param {string} level - уровень логирования ('info', 'warn', 'error')
 */
function log(message, level = 'info') {
  const timestamp = new Date().toLocaleTimeString('ru-RU');
  const prefix = `[${timestamp}]`;
  
  if (level === 'error') {
    console.error(`${prefix} ❌ ${message}`);
  } else if (level === 'warn') {
    console.warn(`${prefix} ⚠️ ${message}`);
  } else {
    console.log(`${prefix} ℹ️ ${message}`);
  }
}

/**
 * Проверка, заполнены ли ключи Supabase
 * @returns {boolean} true если ключи заполнены, false иначе
 */
function isSupabaseConfigured() {
  return SUPABASE_URL !== 'https://YOUR_PROJECT.supabase.co' &&
         SUPABASE_KEY !== 'YOUR_ANON_KEY';
}

// ==================== ЖИЗНЕННЫЙ ЦИКЛ ==================== 

/**
 * Запуск приложения когда DOM полностью загружен
 * Проверяем конфигурацию, инициализируем слушатели событий
 */
document.addEventListener('DOMContentLoaded', () => {
  // Проверяем конфигурацию Supabase
  if (!isSupabaseConfigured()) {
    log('⚠️ Supabase не настроена! Заполните SUPABASE_URL и SUPABASE_KEY в app.js', 'warn');
  }
  
  // Инициализируем приложение
  initializeApp();
});

/**
 * Глобальная обработка ошибок JavaScript
 * Логирует ошибки для отладки
 */
window.addEventListener('error', (event) => {
  log(`Ошибка: ${event.message}`, 'error');
});
