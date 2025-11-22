// Тестовый скрипт для симуляции выбора приложения
// Выполните этот код в консоли браузера на странице приложения

console.log('=== Тест выбора приложения ===');

// Симулируем выбор приложения Telegram из Google Play
const testApp = {
  id: "org.telegram.messenger",
  name: "Telegram",
  developer: "Telegram FZ-LLC",
  icon: "https://play-lh.googleusercontent.com/ZU9cSsyIJZo6Oy7HTHiEPwZg0m2Crep-d5ZrfajqtsH-qgUXSqKpNA2FpPDTn-7qA5Q",
  store: "google"
};

console.log('Тестовое приложение:', testApp);

// Попробуем найти и вызвать функцию parseReviews напрямую
// Это поможет понять, работает ли логика парсинга
if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
  console.log('React найден, пытаемся найти компонент App...');
  
  // Попробуем найти корневой элемент React
  const rootElement = document.getElementById('root');
  if (rootElement && rootElement._reactInternalFiber) {
    console.log('Найден корневой элемент React');
  }
} else {
  console.log('React не найден или недоступен');
}

// Альтернативный способ - попробуем вызвать API напрямую
console.log('Тестируем API напрямую...');

// Тест поиска приложений
fetch('/api/search?query=telegram')
  .then(response => response.json())
  .then(data => {
    console.log('Результат поиска:', data);
    
    if (data.success && data.data.length > 0) {
      const app = data.data[0]; // Берем первое приложение
      console.log('Тестируем парсинг для приложения:', app);
      
      // Тест парсинга отзывов
      return fetch('/api/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appId: app.id,
          store: app.store
        })
      });
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log('Результат парсинга:', data);
    
    if (data.success) {
      console.log('Парсинг успешен, найдено отзывов:', data.total);
      
      // Тест получения отзывов
      return fetch('/api/reviews?appName=Telegram&limit=10');
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log('Результат получения отзывов:', data);
    
    if (data.success) {
      console.log('Получено отзывов:', data.data.length, 'из', data.total);
      console.log('Первый отзыв:', data.data[0]);
    }
  })
  .catch(error => {
    console.error('Ошибка тестирования:', error);
  });

console.log('=== Тест запущен ===');
