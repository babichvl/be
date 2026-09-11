/**
 * GymBro — Главный JavaScript файл приложения
 * Управляет всеми функциями: Supabase, события, навигация
 */

// ==================== КОНФИГУРАЦИЯ ==================== 

/**
 * URL и ключ Supabase
 * Нужно заполнить из вашего проекта: https://supabase.com
 */
const SUPABASE_URL = 'https://https://qhvtapqlyajkikgfacdo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodnRhcHFseWFqa2lrZ2ZhY2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxNjM3NjEsImV4cCI6MjEwMzczOTc2MX0.hr8Uiy3hvbhwfJ0At7T0TR8waK4Mt5ylFw-B-qp5Cow';

/**
 * Инициализируем клиент Supabase
 * Используем глобальный объект window.supabase, загруженный через CDN
 */
const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ==================== ИНИЦИАЛИЗАЦИЯ ==================== 

/**
 * Основная функция инициализации приложения
 * Вызывается когда DOM полностью загружен
 */
async function initializeApp() {
  console.log('Инициализация GymBro...');
  
  // Установка обработчиков для кнопок выбора роли
  setupEventHandlers();
  
  // Проверяем, авторизован ли пользователь
  await checkAuthStatus();
}

// ==================== ОБРАБОТЧИКИ СОБЫТИЙ ==================== 

/**
 * Установка обработчиков на кнопки и события
 */
function setupEventHandlers() {
  const trainerBtn = document.getElementById('trainer-btn');
  const clientBtn = document.getElementById('client-btn');

  // Кнопка "Я тренер"
  if (trainerBtn) {
    trainerBtn.addEventListener('click', () => {
      handleRoleSelect('trainer');
    });
  }

  // Кнопка "Я клиент"
  if (clientBtn) {
    clientBtn.addEventListener('click', () => {
      handleRoleSelect('client');
    });
  }
}

/**
 * Обработка выбора роли пользователем
 * @param {string} role - выбранная роль ('trainer' или 'client')
 */
function handleRoleSelect(role) {
  console.log(`Выбрана роль: ${role}`);
  
  // В будущем здесь будет переход в соответствующее приложение
  // Пока просто выводим результат
  alert(`Вы выбрали роль: ${role === 'trainer' ? 'Тренер' : 'Клиент'}`);
}

/**
 * Проверка статуса авторизации при загрузке
 * Если пользователь уже авторизован, можно перенаправить его в приложение
 */
async function checkAuthStatus() {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      console.log('Пользователь авторизован:', user.email);
      // В будущем здесь будет логика автоматического входа
    } else {
      console.log('Пользователь не авторизован');
    }
  } catch (err) {
    console.error('Ошибка при проверке авторизации:', err);
  }
}

// ==================== УТИЛИТЫ ==================== 

/**
 * Логирование сообщений с форматированием
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
  return SUPABASE_URL !== 'https://qhvtapqlyajkikgfacdo.supabase.co' &&
         SUPABASE_KEY !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodnRhcHFseWFqa2lrZ2ZhY2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxNjM3NjEsImV4cCI6MjEwMzczOTc2MX0.hr8Uiy3hvbhwfJ0At7T0TR8waK4Mt5ylFw-B-qp5Cow';
}

// ==================== ЖИЗНЕННЫЙ ЦИКЛ ==================== 

/**
 * Запуск приложения когда DOM полностью загружен
 */
document.addEventListener('DOMContentLoaded', () => {
  // Проверяем конфигурацию
  if (!isSupabaseConfigured()) {
    log('⚠️ Supabase не настроена! Заполните SUPABASE_URL и SUPABASE_KEY в app.js', 'warn');
  }
  
  // Инициализируем приложение
  initializeApp();
});

/**
 * Обработка ошибок в консоли
 */
window.addEventListener('error', (event) => {
  log(`Ошибка: ${event.message}`, 'error');
});
