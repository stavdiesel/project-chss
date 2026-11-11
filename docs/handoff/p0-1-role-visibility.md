# Handoff: P0-1 — Ролевая видимость тренера

## Задача
Тренер должен видеть только своих клиентов и свои занятия (сессии), а не все данные студии. Администратор сохраняет полный доступ. Клиент — только свои данные (уже реализовано через /me).

## Входные данные
- Бэкенд: FastAPI + SQLAlchemy, модели User/Client/Trainer/Session/Booking.
- Тренер связан с пользователем через Trainer.user_id.
- Текущее поведение: list_clients и list_sessions возвращают всё всем ролям admin/trainer.

## Ожидаемый результат
- `GET /api/v1/clients` для trainer: только клиенты, у которых есть бронирование на сессию этого тренера (или иным образом привязанные к тренеру).
- `GET /api/v1/sessions` для trainer: только сессии, где trainer_id == его trainer.id.
- `GET /api/v1/bookings/session/{sid}` для trainer: 403 если сессия не его.
- `POST /api/v1/bookings/{bid}/attend` для trainer: только свои сессии.
- Тесты: минимум 2 (trainer видит только своё; admin видит всё).
- Коммит + push (после Security/DevOps).

## Статус
- [x] Superagent: задача поставлена
- [x] Dev
- [x] QA
- [x] Security
- [x] DevOps
