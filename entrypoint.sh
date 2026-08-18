#!/bin/bash
set -e

ENV_FILE=${ENV_FILE:-/app/.env}

mkdir -p /app/logs
chmod 777 /app/logs

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Файл $ENV_FILE не найден."
    echo "Создайте .env из .env.example:"
    echo "  cp .env.example .env"
    echo "Затем отредактируйте .env и повторите запуск."
    exit 1
fi

echo "✅ Используется конфигурация $ENV_FILE"

echo "🗄️ Применяем миграции базы данных..."
alembic -c /app/alembic.ini upgrade head

echo "✅ Миграции применены"

exec uvicorn app.main:app --host 0.0.0.0 --port 8000
