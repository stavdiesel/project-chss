#!/usr/bin/env bash
set -euo pipefail

# Деплой прототипа фитнес-студии «ЧС» на сервер (по SSH)
# Запускать на сервере: bash deploy.sh
# Или с макбука: ssh admin@100.69.42.76 'bash -s' < deploy.sh

APP_DIR="${APP_DIR:-$HOME/chs-prototype}"
REPO="${REPO:-}"  # если задан git-репозиторий — клонируем

echo "==> Директория: $APP_DIR"
mkdir -p "$APP_DIR"

if [ -n "$REPO" ]; then
  if [ -d "$APP_DIR/.git" ]; then
    git -C "$APP_DIR" pull --ff-only
  else
    git clone "$REPO" "$APP_DIR"
  fi
fi

cd "$APP_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker не установлен на сервере"; exit 1
fi

# compose v2 plugin или v1
if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "ERROR: docker compose не найден"; exit 1
fi

echo "==> Сборка и запуск..."
$COMPOSE up --build -d

echo "==> Статус:"
$COMPOSE ps

echo ""
echo "Готово. На макбуке открой туннель:"
echo "  ssh -N -L 3000:127.0.0.1:3000 -L 8000:127.0.0.1:8000 admin@100.69.42.76"
echo "Фронт: http://localhost:3000  |  Бэк: http://localhost:8000/docs"
echo "Аккаунты: admin@chs.ru / trainer1@chs.ru / client1@chs.ru (пароль password123)"
