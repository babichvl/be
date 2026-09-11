/**
 * GymBro - основной скрипт фронтенда
 * Использует supabase-js для работы с базой данных
 */

// ==================== Инициализация Supabase ====================

/**
 * Получаем URL и ключ Supabase из переменных окружения
 * Эти значения нужно заполнить из вашего проекта Supabase
 */
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_KEY = 'YOUR_ANON_KEY';

/**
 * Инициализируем клиент Supabase
 * supabase-js загружается через CDN в index.html
 */
const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ==================== Обработчики событий ====================

/**
 * Инициализация приложения
 * Добавляет обработчики к кнопкам выбора роли
 */
function initializeApp() {
  const trainerBtn = document.getElementById('trainer-btn');
  const clientBtn = document.getElementById('client-btn');

  if (trainerBtn) {
    trainerBtn.addEventListener('click', () => handleRoleSelect('trainer'));
  }

  if (clientBtn) {
    clientBtn.addEventListener('click', () => handleRoleSelect('client'));
  }

  // Проверяем авторизацию при загрузке
  checkAuthStatus();
}

/**
 * Обработка выбора роли
 * @param {string} role - роль пользователя ('trainer' или 'client')
 */
function handleRoleSelect(role) {
  console.log(`Выбрана роль: ${role}`);

  // Перенаправляем в соответствующее приложение
  if (role === 'trainer') {
    window.location.href = '/trainer/';
  } else if (role === 'client') {
    window.location.href = '/client/';
  }
}

/**
 * Проверка статуса аутентификации
 * Если пользователь уже авторизован, перенаправляем его в соответствующее приложение
 */
async function checkAuthStatus() {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      console.log('Пользователь уже авторизован:', user);

      // Получаем роль пользователя из профиля
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (data && data.role) {
        // Перенаправляем в соответствующее приложение
        if (data.role === 'trainer') {
          window.location.href = '/trainer/';
        } else if (data.role === 'client') {
          window.location.href = '/client/';
        }
      }
    }
  } catch (err) {
    console.error('Ошибка при проверке аутентификации:', err);
  }
}

/**
 * Логирование ошибок с понятным сообщением
 * @param {string} context - контекст ошибки
 * @param {Error} error - объект ошибки
 */
function handleError(context, error) {
  console.error(`${context}:`, error);
  // Позже здесь будет вывод ошибки пользователю в UI
}

// ==================== Жизненный цикл приложения ====================

// Инициализируем приложение при загрузке страницы
document.addEventListener('DOMContentLoaded', initializeApp);
