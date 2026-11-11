# Фитнес-студия «ЧС» — MVP прототип

## Запуск
```bash
cd /opt/data/profiles/manager/workspace/clients/fitness-chs/prototype
docker-compose up --build
```
Фронт: http://localhost:3000 · Бэк: http://localhost:8000 · Swagger: http://localhost:8000/docs

## Тестовые аккаунты (пароль `password123`)
- Админ: admin@chs.ru
- Тренеры: trainer1@chs.ru, trainer2@chs.ru
- Клиенты: client1@chs.ru … client5@chs.ru

## Функционал
- Auth JWT (3 роли)
- Расписание (сетка недели, слоты)
- Запись/отмена (проверка 3 ч)
- Абонементы (создание админом, остаток, автосписание при посещении)
- Админка: клиенты, расписание CRUD, абонементы
- ЛК клиента: расписание, мои записи, абонементы

## Заглушки
- MAX/касса/уведомления — не реализованы (MVP-прототип).