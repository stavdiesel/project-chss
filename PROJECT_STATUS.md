# Фитнес-студия «ЧС» — статус проекта и инструкции

Последнее обновление: 2026-11-11. Этот файл — опорная точка: если сессия/контекст сбросились, начинай отсюда.

## 0. Холодный старт (если сессия сбросилась)

При старте новой сессии обязательно:
1. Прочитать этот файл (`PROJECT_STATUS.md`) целиком.
2. Прочитать memory (NOTO Manager) — актуальный статус.
3. `git log --oneline -10` + `git status` в `prototype/`.
4. Если есть незавершённая задача — продолжить с последней стадии (см. раздел 3/5), не начинать заново.

## 1. Что это

MVP системы управления фитнес-студией «ЧС»: клиентская база, расписание, абонементы, бронирования, кабинеты (клиент/тренер/админ). Backend FastAPI + Postgres, frontend Next.js.

## 2. Репозиторий и деплой

- GitHub: https://github.com/stavdiesel/project-chss
- Локальная копия: `/opt/data/profiles/manager/workspace/clients/fitness-chs/prototype` (git root)
- Ветка: `main`
- Frontend: Vercel — https://frontend-khaki-alpha-c568xrzkfy.vercel.app
- Backend: Render — https://chs-backend-oc37.onrender.com (health: `/health` → `{"ok":true}`)
- БД: Postgres `dpg-dbq6urbm8hqs73c2mn3g-a` (Render)

## 3. Этапы (что сделано)

1. **Initial MVP** (`6cf54b3`) — backend + frontend, базовые модели/роуты.
2. **Фикс зависимостей** (`d9d7ae2`) — sha256_crypt, passlib.
3. **Деплой-настройки** (`317d186`, `ca479c3`, `7350607`, `a5324ba`, `36a2c02`) — PYTHON_VERSION 3.11, rootDir backend, URL бэкенда.
4. **Фикс логина** (коммит `90b8279`) — `app/core/security.py`: схемы `["bcrypt", "sha256_crypt"]`; `requirements.txt`: `passlib[bcrypt]`, `bcrypt==4.0.1`. Причина: БД хранит bcrypt `$2b$`, код проверял только sha256_crypt → 500.
5. **Тесты и CI** (коммит `90b8279`) — `backend/tests/test_auth.py` (login ok / bad password), `conftest.py`; `.github/workflows/ci.yml` (pytest на push/PR).
6. **Чистка репозитория** (коммит перед `90b8279`) — `.gitignore`, вынесены из индекса `.next/` и `*.db`.

## 4. Проверки (на 2026-11-11)

- `pytest backend/tests` → **2 passed** (9 deprecation-предупреждений, не критично).
- `npm run build` (frontend) → **успешно**, все 6 маршрутов.
- Production backend `/health` → ok; `/api/v1/auth/login` (client1@chs.ru / password123) → возвращает access_token.

## 5. Известные риски / что не доделано

- Фронтенд захардкожен на Render-URL (`https://chs-backend-oc37.onrender.com`) вместо env — ок для MVP, но при смене бэкенда править 5 файлов. `.env.example` добавлен.
- Нет `.env.local`-обработки в коде (используется хардкод).
- В прод-БД хэши паролей — bcrypt? Логин работает, но стоит убедиться после смены пароля.
- Деплой фикса логина: коммит запушен? Нужно подтвердить push на origin (Render/Vercel деплоятся по push).
- Депрекейты Pydantic V2 (class-based config) — не блокируют, но стоит мигрировать на ConfigDict.

## 6. Как запускать локально

Backend:
```
cd prototype/backend
pip install -r requirements.txt
pip install pytest httpx
uvicorn app.main:app --reload --port 8000
```
Тесты:
```
cd prototype/backend
PYTHONPATH=. pytest -q
```
Frontend:
```
cd prototype/frontend
npm install
npm run dev   # http://localhost:3000
npm run build
```

## 7. Следующие шаги (по согласованию)

- Push коммитов на origin → автодеплой Render/Vercel.
- Вернуть env-подход во фронтенде (NEXT_PUBLIC_API_URL) вместо хардкода.
- Добавить тесты на остальные эндпоинты (расписание, абонементы, бронирования).
- Мигрировать Pydantic-схемы на ConfigDict.

## 8. Мультиагентный цикл (ЧС)

Роли: Superagent (я) → Dev → QA → Security → DevOps. Каждая задача проходит 5-уровневую валидацию. Передача только через git + handoff-файл `docs/handoff/<task>.md`. Эскалация на владельца — через меня. После каждой крупной операции — обновить этот файл (hangout).
