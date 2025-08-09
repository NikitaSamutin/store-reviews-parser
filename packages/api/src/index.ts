import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📱 Парсер отзывов готов к работе`);
  console.log(`🌐 API доступен по адресу: http://localhost:${PORT}/api`);
});
