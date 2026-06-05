# EdTech

Веб-приложение для общения с AI через [OpenRouter](https://openrouter.ai) с историей диалогов, стримингом и управлением контекстным окном.

---

## Быстрый старт

### Локально

**Backend:**
```bash
cd backend
cp .env.example .env
# Вставить OPENROUTER_API_KEY в .env

python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

### Docker

```bash
# Убедитесь что backend/.env содержит OPENROUTER_API_KEY
docker compose up --build
```

---

## Функциональность

| Фича | Описание |
|------|----------|
| История диалогов | Список чатов в сайдбаре, сортировка по дате |
| Автозаголовок | LLM генерирует название из первого сообщения |
| Стриминг | Ответ появляется токен за токеном через SSE |
| Управление контекстом | При превышении ~6000 токенов старые сообщения сжимаются в summary через LLM |
| Suggested prompts | Подсказки на пустом чате |
| Regenerate | Перегенерация последнего ответа |
| Копирование | Кнопка Copy — копирует plain text (не markdown) |
| Цитирование | Выделить текст → ПКМ → «Quote in input» |
| Скелетоны | Загрузочные состояния при получении данных |
| Модалка удаления | Кастомный диалог вместо `window.confirm` |
| Коллапс сайдбара | Кнопка сворачивания, состояние сохраняется в localStorage |

---

## Стек и выбор технологий

### Backend: FastAPI (Python)

**Почему FastAPI, а не Flask/Django:**
- Нативная поддержка `async/await` — критично для SSE стриминга LLM-ответов
- Автоматическая OpenAPI документация из типов без дополнительного кода
- Dependency Injection через `Depends()` — чистое разделение слоёв без магии Django
- Pydantic v2 — валидация и сериализация одним объявлением, с нормальными ошибками

**Почему SQLite + SQLAlchemy:**
- Авторизация не требуется → нет смысла поднимать Postgres для одного пользователя
- SQLAlchemy 2.0 с typed `Mapped[]` — полная типизация без бойлерплейта
- Лёгкая замена на Postgres: меняется только `DATABASE_URL`

**Решение проблемы контекстного окна:**

Алгоритм в [`app/services/context.py`](backend/app/services/context.py):
1. После каждого ответа считается приблизительный размер в токенах (`len(text) // 4`)
2. При превышении 6000 токенов старая половина сообщений отправляется LLM с просьбой написать краткое summary
3. Summary сохраняется в поле `Chat.context_summary`, старые сообщения удаляются
4. При повторном превышении — новое summary мёрджится со старым через отдельный LLM-вызов
5. При построении контекста для LLM: `system` содержит summary + последние сообщения

Это сохраняет связность длинного разговора без бесконечного роста контекста.

**Почему генератор создаёт свою DB сессию:**

FastAPI закрывает `Depends(get_db)` сессию при возврате из endpoint-функции. `StreamingResponse` начинает читать генератор **после** возврата, поэтому генератор использует `SessionLocal()` напрямую и закрывает её в `finally`.

### Frontend: Next.js 15 (App Router)

**Почему Next.js, а не Vite + React:**
- App Router позволяет миксовать server и client компоненты — страницы рендерятся на сервере, интерактивность на клиенте
- `next/font` — загрузка Inter без layout shift
- `output: "standalone"` — Docker-образ без node_modules

**Почему TanStack Query, а не SWR/Zustand:**
- Автоматическая инвалидация кэша (`invalidateQueries`) — после получения ответа обновляются и список чатов, и сообщения
- `staleTime` — не делает лишних запросов при переключении между чатами
- Встроенные `isPending`, `isLoading` — нет ручного управления состоянием загрузки

**Почему нет UI-библиотеки (MUI/shadcn):**
- Все компоненты простые, кастомные стили быстрее чем оверрайды
- Tailwind покрывает 100% потребностей
- `lucide-react` для иконок — единственная зависимость на UI

### LLM: OpenRouter

**Почему OpenRouter, а не прямой вызов Anthropic/OpenAI:**
- Единое API для всех провайдеров
- Бесплатные модели для тестирования
- Fallback-цепочка моделей встроена в [`app/services/llm.py`](backend/app/services/llm.py) — если одна упала, автоматически берётся следующая

**Активные модели (на момент сдачи):**
- `google/gemma-4-31b-it:free` — основная
- `moonshotai/kimi-k2.6:free`
- `google/gemma-4-26b-a4b-it:free`
- `nvidia/nemotron-3-super-120b-a12b:free`
- `qwen/qwen3-next-80b-a3b-instruct:free`

> Если появится `"All models unavailable"` — откройте [openrouter.ai/models](https://openrouter.ai/models?q=:free) и обновите список в `backend/app/config.py`.

---

## Тесты

```bash
cd backend
pip install -r requirements-dev.txt
OPENROUTER_API_KEY=test pytest tests/ -v
```

15 тестов: CRUD чатов, валидация сообщений, стриминг с мок-LLM, проверка сохранения в БД.

---

## Переменные окружения

**Backend** (`backend/.env`):
```env
OPENROUTER_API_KEY=sk-or-v1-...
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```