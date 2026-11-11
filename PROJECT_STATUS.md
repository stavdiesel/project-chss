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
7. **Ролевая видимость тренера** (`4299bd2` + `0b9ff20`) — `deps.py`, `clients.py`, `sessions.py`, `bookings.py`: тренер видит только своих клиентов/сессии/бронирования; админ — полный доступ. Запушен на origin/main. Тесты 7 passed (auth + 5 role-visibility), независимый reviewer passed=true. Добавлена ownership-проверка в get_client/{cid} для тренера. Осталось: booking capacity race под нагрузкой (suggestion, не блокирует MVP).
8. **Тесты эндпоинтов (P0-2)** (`dc42891`) — покрыты sessions/bookings/subscriptions (happy path + 403/404), client validation в create_sub.
9. **env-подход во фронтенде** (`9030cba`) — `NEXT_PUBLIC_API_URL` вместо хардкода.
10. **Миграция Pydantic на ConfigDict** (`f40b093`) — `config.py` и `schemas.py`: class-based `Config` → `SettingsConfigDict`/`ConfigDict`. Тесты 13 passed. Запушено, автодеплой Render/Vercel.
11. **Аналитика базовая** (`3d566a2`) — backend `/api/v1/analytics/{summary,by-trainer,by-class-type}` (admin only), frontend `/analytics` дашборд с фильтрами по датам. Build ok, push выполнен.

## 4. Проверки (на 2026-11-11)

- `pytest backend/tests` → **13 passed** (17 deprecation-предупреждений, не критично).
- `npm run build` (frontend) → **успешно**, все 6 маршрутов.
- Production backend `/health` → ok; `/api/v1/auth/login` (client1@chs.ru / password123) → возвращает access_token.
- Push на origin/main выполнен (f40b093), Render/Vercel автодеплой по push.

## 5. Известные риски / что не доделано

- Фронтенд использует `NEXT_PUBLIC_API_URL` (env), но нет `.env.local`-обработки в коде локально — ок.
- В прод-БД хэши паролей — bcrypt? Логин работает, но стоит убедиться после смены пароля.
- Booking capacity race под нагрузкой (suggestion, не блокирует MVP).
- Депрекейты Pydantic V2 (datetime.utcnow, class-based config мигрирован).
- Не реализовано по брифу: уведомления (Telegram/e-mail/MAX), аналитика, расчёт зарплаты, интеграция с кассой/терминалом, перенос YCLIENTS — требуют ответов клиента (см. §7/§9 брифа).

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

- Проверить автодеплой Render/Vercel после f40b093 (health + login в проде).
- Запросить у клиента ключевые вопросы (brief §9): правило списания, срок отмены, каналы уведомлений, формулы зарплаты, касса/терминалы, перенос YCLIENTS.
- После ответов: реализовать уведомления, аналитику, зарплату, кассу.
- Опционально: добавить тесты на остальные edge-cases, capacity race handling.

## 8. Мультиагентный цикл (ЧС)

Роли: Superagent (я) → Dev → QA → Security → DevOps. Каждая задача проходит 5-уровневую валидацию. Передача только через git + handoff-файл `docs/handoff/<task>.md`. Эскалация на владельца — через меня. После каждой крупной операции — обновить этот файл (hangout).
