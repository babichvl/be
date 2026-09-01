const SUPABASE_URL = 'https://qhvtapqlyajkikgfacdo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodnRhcHFseWFqa2lrZ2ZhY2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxNjM3NjEsImV4cCI6MjEwMzczOTc2MX0.hr8Uiy3hvbhwfJ0At7T0TR8waK4Mt5ylFw-B-qp5Cow';
// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();
tg.enableClosingConfirmation();

// Применение темы Telegram
if (tg.colorScheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
}

// Получение данных пользователя
const user = tg.initDataUnsafe?.user;
const telegramId = user?.id;

// Навигация между вкладками
const navBtns = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        
        navBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(t => t.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(targetTab).classList.add('active');
        
        tg.HapticFeedback.impactOccurred('light');
    });
});

// Кнопка добавления
document.getElementById('addBtn').addEventListener('click', () => {
    tg.HapticFeedback.impactOccurred('medium');
    tg.showAlert('Функция добавления в разработке');
});

// Меню
document.getElementById('menuBtn').addEventListener('click', () => {
    tg.HapticFeedback.impactOccurred('light');
    tg.showAlert('Меню в разработке');
});

// Профиль
document.getElementById('profileAvatar').addEventListener('click', () => {
    tg.HapticFeedback.impactOccurred('light');
    const userName = user?.first_name || 'Гость';
    tg.showAlert(`Профиль: ${userName}`);
});

// Календарь
const dateItems = document.querySelectorAll('.date-item');
dateItems.forEach(item => {
    item.addEventListener('click', () => {
        dateItems.forEach(d => d.classList.remove('active'));
        item.classList.add('active');
        tg.HapticFeedback.impactOccurred('light');
    });
});

console.log('FitnessPro Mini App загружен');
console.log('Telegram User ID:', telegramId);
