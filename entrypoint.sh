#!/bin/bash
set -e

ENV_FILE=${ENV_FILE:-/app/.env}

generate_secret() {
    openssl rand -hex 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_hex(32))"
}
generate_fernet() {
    python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
}

if [ ! -f "$ENV_FILE" ]; then
    echo "🔐 Создаём .env с автоматическими ключами..."
    SECRET_KEY=$(generate_secret)
    SESSION_SECRET_KEY=$(generate_secret)
    FERNET_KEY=$(generate_fernet)

    cat > "$ENV_FILE" <<EOF
SECRET_KEY=$SECRET_KEY
SESSION_SECRET_KEY=$SESSION_SECRET_KEY
FERNET_ENCRYPTION_KEY=$FERNET_KEY
OPENWEATHER_API_KEY=your-openweather-api-key
GITHUB_CLIENT_ID=client-id
GITHUB_CLIENT_SECRET=need-client-secret
GOOGLE_CLIENT_ID=need-client-id
GOOGLE_CLIENT_SECRET=need-client-secret
LOG_LEVEL=INFO
FRONTEND_OAUTH_CALLBACK_URL=http://localhost:5173/auth/oauth/callback
EOF
    echo "✅ .env создан. (Замените OPENWEATHER_API_KEY при необходимости)"
else
    echo "✅ .env уже существует, использую его."
fi

exec uvicorn app.main:app --host 0.0.0.0 --port 8000
