#!/bin/bash
set -e

ENV_FILE=${ENV_FILE:-/app/.env}

# Функция генерации случайной строки (если openssl нет)
generate_secret() {
    if command -v openssl &> /dev/null; then
        openssl rand -hex 32
    else
        python3 -c "import secrets; print(secrets.token_hex(32))"
    fi
}

generate_fernet() {
    python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
}

if [ ! -f "$ENV_FILE" ]; then
    echo "🔐 .env не найден. Создаём с автоматически сгенерированными ключами..."

    SECRET_KEY=$(generate_secret)
    SESSION_SECRET_KEY=$(generate_secret)
    FERNET_KEY=$(generate_fernet)

    cat > "$ENV_FILE" <<EOF
# === Обязательные переменные ===
SECRET_KEY=$SECRET_KEY
SESSION_SECRET_KEY=$SESSION_SECRET_KEY
FERNET_ENCRYPTION_KEY=$FERNET_KEY
OPENWEATHER_API_KEY=your-openweather-api-key  # замените на реальный

# === OAuth (опционально) ===
GITHUB_CLIENT_ID=client-id
GITHUB_CLIENT_SECRET=need-client-secret
GOOGLE_CLIENT_ID=need-client-id
GOOGLE_CLIENT_SECRET=need-client-secret

# === Frontend (переменные для сборки) ===
VITE_API_BASE_URL=http://localhost:8000
VITE_FRONTEND_OAUTH_CALLBACK_URL=http://localhost:5173/oauth/callback

# === Прочее ===
LOG_LEVEL=INFO
FRONTEND_OAUTH_CALLBACK_URL=http://localhost:5173/auth/oauth/callback
EOF

    echo "✅ .env создан. Обязательно замените OPENWEATHER_API_KEY и настройте OAuth, если нужно."
else
    echo "✅ .env уже существует, использую его."
fi

# Запуск бэкенда
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
