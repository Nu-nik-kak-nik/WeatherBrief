# 🌤️ Weather Service API

Сервис погоды с возможностью управления избранными городами, кэшированием запросов и авторизацией пользователей.

## 🛠 Технологический стек

- **Framework:** FastAPI
- **Auth:** AuthX (JWT)
- **Database:** SQLite (AIOSQLite)
- **Cache:** Redis
- **External API:** OpenWeatherMap
- **Deployment:** Docker (в планах)

## 🚀 Функционал (MVP)

- [x] Регистрация и авторизация пользователей.
- [x] Поиск погоды по названию города или координатам.
- [x] Кэширование ответов от погодного API в Redis.
- [x] Добавление городов в "Избранное" для пользователя.
- [x] Подробная информация о погоде в конкретном городе.
- [ ] Frontend (в планах).

## 📦 Установка и запуск

### 🔄 Шаг 0: Клонирование репозитория (для обоих способов)
```bash
git clone https://github.com/Nu-nik-kak-nik/TypeFast.git
cd TypeFast
```

### Способ 1: Локальный запуск (без Docker)

1. **Создайте и активируйте виртуальное окружение**:

- Для создания виртуального окружения выполните команду:

```bash
python -m venv venv
```

- Активируйте виртуальное окружение:

	На Windows:

	```bash
	venv\Scripts\activate
	```

	На macOS и Linux:

	```bash
	source venv/bin/activate
	```

2. **Установите зависимости**:

```bash
pip install -r requirements.txt
```

3. **Настройка переменных окружения**

Создайте файл `.env` в корне проекта и добавьте в него следующие переменные:

```
OPENWEATHER_API_KEY=need-API-KEY # openweathermap.org

SECRET_KEY=generate-secret-key
FERNET_ENCRYPTION_KEY=generate-fernet-key
SESSION_SECRET_KEY=generate-session-secret-key

GITHUB_CLIENT_ID=client-id # если не нужен оставте так
GITHUB_CLIENT_SECRET=need-client-secret # если не нужен оставте так

GOOGLE_CLIENT_ID=need-client-id # если не нужен оставте так
GOOGLE_CLIENT_SECRET=need-client-secret # если не нужен оставте так

LOG_LEVEL=INFO
```

4. **Запустите приложение**:

Либо через uvicorn напрямую:

```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

Либо через main.py:

```bash
python backend/app/main.py
```

## 📚 Документация API

После запуска документация Swagger доступна по адресу:
[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

## 🗺️ Roadmap

- [ ] Написание простого Frontend (React/Vue).
- [ ] Docker контейнеризация.

## 📄 Лицензия
MIT
```
