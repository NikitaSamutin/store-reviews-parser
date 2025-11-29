# План по тестированию и логированию

> **Дата:** 30.11.2025  
> **Проект:** store-reviews-parser  
> **Цель:** Автоматизация проверки исправлений безопасности

---

## Текущее состояние

### Логирование

| Компонент | Статус | Проблемы |
|-----------|--------|----------|
| Request logging | ⚠️ Частичное | Только в debug-режиме (`DEBUG=1`) |
| Error logging | ⚠️ Базовое | `console.error` без структуры |
| Request ID | ✅ Есть | Генерируется и возвращается в заголовках |
| Response time | ✅ Есть | В заголовке `X-Response-Time` |
| Structured logs | ❌ Нет | Нет JSON-формата для агрегации |
| Log levels | ❌ Нет | Всё через console.* |
| Sensitive data | ⚠️ Риск | Полные error objects в логах |

### Тестирование

| Компонент | Статус |
|-----------|--------|
| Unit-тесты | ❌ Отсутствуют |
| Integration-тесты | ❌ Отсутствуют |
| E2E-тесты | ❌ Отсутствуют |
| Test framework | ❌ Не настроен |
| CI pipeline | ⚠️ Только smoke-тест |

---

## План по логированию

### Фаза 1: Базовое структурированное логирование

**Цель:** Все логи в JSON-формате с уровнями

```typescript
// Пример структуры лога
{
  "timestamp": "2025-11-30T00:00:00.000Z",
  "level": "info|warn|error",
  "reqId": "uuid",
  "message": "Request completed",
  "data": {
    "method": "GET",
    "path": "/api/reviews",
    "status": 200,
    "durationMs": 45
  }
}
```

**Задачи:**
- [ ] Создать `packages/api/src/utils/logger.ts`
- [ ] Определить уровни: `debug`, `info`, `warn`, `error`
- [ ] Заменить все `console.*` на logger
- [ ] Добавить JSON-формат для production

### Фаза 2: Расширенное логирование

**Задачи:**
- [ ] Логировать входящие параметры (без sensitive data)
- [ ] Логировать rate-limit события
- [ ] Логировать upstream-запросы (Apple/Google) с таймингами
- [ ] Добавить correlation ID для цепочки запросов

### Фаза 3: Безопасность логов

**Задачи:**
- [ ] Создать whitelist безопасных заголовков
- [ ] Редактировать sensitive данные (tokens, passwords)
- [ ] Ограничить размер логируемых данных
- [ ] Не логировать полные stack traces в production

---

## План по тестированию

### Выбор инструментов

| Инструмент | Назначение | Почему |
|------------|------------|--------|
| **vitest** | Test runner | Быстрый, ESM-native, совместим с Vite |
| **supertest** | HTTP-тесты | Стандарт для Express API |
| **msw** | Mock HTTP | Мокирование Apple/Google API |

### Структура тестов

```
packages/api/
├── src/
│   └── ...
├── tests/
│   ├── setup.ts              # Глобальная настройка
│   ├── unit/
│   │   ├── database.test.ts  # Тесты Database класса
│   │   ├── export.test.ts    # Тесты CSV/JSON экспорта
│   │   └── validation.test.ts # Тесты валидации
│   ├── integration/
│   │   ├── api.health.test.ts
│   │   ├── api.search.test.ts
│   │   ├── api.reviews.test.ts
│   │   ├── api.export.test.ts
│   │   └── api.parse.test.ts
│   └── security/
│       ├── ratelimit.test.ts
│       ├── cors.test.ts
│       ├── csv-injection.test.ts
│       └── input-validation.test.ts
└── vitest.config.ts
```

### Критичные тесты (P0/P1)

#### 1. Database tests (`database.test.ts`)

```typescript
describe('Database', () => {
  // P0: SQLite загрузка
  it('should load sqlite3 when available')
  it('should fallback to in-memory when sqlite3 unavailable')
  
  // P0: Лимиты памяти
  it('should limit memReviews size to MAX_REVIEWS')
  it('should evict oldest reviews when limit exceeded')
  
  // P1: Пагинация без копирования
  it('should not copy entire array for pagination')
})
```

#### 2. Input validation tests (`validation.test.ts`)

```typescript
describe('Input Validation', () => {
  // P1: Лимиты
  it('should cap limit to MAX_LIMIT (1000)')
  it('should cap total to MAX_EXPORT_TOTAL (10000)')
  it('should reject negative limit/offset')
  
  // P3: Даты
  it('should return 400 for invalid startDate')
  it('should return 400 for invalid endDate')
  
  // P3: Enum валидация
  it('should reject invalid store value')
  it('should reject ratings outside 1-5')
})
```

#### 3. Rate limiting tests (`ratelimit.test.ts`)

```typescript
describe('Rate Limiting', () => {
  // P0: /parse защита
  it('should limit /parse to N requests per minute')
  it('should return 429 when limit exceeded')
  it('should include Retry-After header')
  
  // P1: /export защита
  it('should limit /export to N requests per minute')
})
```

#### 4. CSV injection tests (`csv-injection.test.ts`)

```typescript
describe('CSV Export Security', () => {
  // P2: Формулы
  it('should neutralize values starting with =')
  it('should neutralize values starting with +')
  it('should neutralize values starting with -')
  it('should neutralize values starting with @')
  it('should neutralize values starting with \\t')
  it('should neutralize values starting with \\r')
})
```

#### 5. API integration tests

```typescript
describe('GET /api/health', () => {
  it('should return 200 with status OK')
  it('should include version and runtime')
})

describe('GET /api/search', () => {
  it('should return 400 without query param')
  it('should return apps array on success')
  it('should timeout after 30 seconds')
})

describe('POST /api/parse', () => {
  it('should return 400 without appId')
  it('should return 400 with invalid store')
  it('should respect rate limit')
  it('should timeout upstream requests')
})

describe('GET /api/reviews', () => {
  it('should return empty array when no reviews')
  it('should respect max limit')
  it('should validate date parameters')
})

describe('POST /api/export', () => {
  it('should return 404 when no reviews')
  it('should respect max total')
  it('should sanitize CSV content')
  it('should stream large exports')
})
```

---

## Порядок внедрения

### Этап 1: Настройка инфраструктуры ✅
- [x] Установить vitest, supertest
- [x] Создать vitest.config.ts
- [x] Создать tests/setup.ts
- [x] Добавить npm scripts: `test`, `test:watch`, `test:coverage`

### Этап 2: Написать failing-тесты для P0 ✅
- [x] database.test.ts — тесты на SQLite и лимиты
- [x] ratelimit.test.ts — тесты на rate-limiting
- [x] validation.test.ts — тесты на валидацию
- [x] csv-injection.test.ts — тесты на CSV-инъекции
- [x] api.health.test.ts — интеграционные тесты

**Текущий статус:** 20 passed, 23 failed (ожидаемо)

### Этап 3: Исправить P0, проверить тестами ✅
- [x] Исправить загрузку SQLite (динамический импорт)
- [x] Добавить rate-limiting (express-rate-limit)
- [x] Добавить лимит in-memory хранилища (10000)
- [x] Убедиться что тесты проходят

### Этап 4: Исправить P1 ✅
- [x] Валидация limit/offset/total
- [x] Валидация дат
- [x] Валидация store enum
- [x] Валидация ratings (1-5)
- [x] Валидация appId формата

### Этап 5: Исправить P2 ✅
- [x] CSV formula injection protection

**Текущий статус:** 43 passed, 0 failed ✅

### Этап 6: P3 и дополнительные улучшения
- [ ] CORS тесты
- [ ] Axios таймауты

### Этап 7: Логирование
- [ ] Создать logger
- [ ] Заменить console.*
- [ ] Добавить тесты на логирование

---

## CI интеграция

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run build
```

---

## Метрики успеха

| Метрика | Цель |
|---------|------|
| Test coverage | > 80% для критичных модулей |
| All P0 tests | ✅ Passing |
| All P1 tests | ✅ Passing |
| CI pipeline | ✅ Green on every PR |
| Structured logs | ✅ JSON в production |

---

## Зависимости для установки

```bash
npm install -D vitest @vitest/coverage-v8 supertest @types/supertest msw
```

---

## Примечания

- Тесты пишутся **до** исправлений (TDD-подход)
- Каждый failing-тест документирует ожидаемое поведение
- После исправления тест должен стать зелёным
- Это защищает от регрессий в будущем
