# Smart Cube Hub

Полноценная платформа для Bluetooth-умных кубиков Rubik's Cube.

## Структура

```
smart-cube-hub/
  frontend/      # React + TypeScript + Vite + TailwindCSS
  backend/       # FastAPI + SQLModel + SQLite (PostgreSQL-ready)
  shared/        # Общие TypeScript/Pydantic типы
  infra/         # Docker, nginx, CI/CD
  docs/          # Документация
  scripts/       # Вспомогательные скрипты
```

## Быстрый старт

```bash
# Установка зависимостей фронтенда
cd frontend
npm install

# Установка зависимостей бэкенда
cd ../backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Запуск
npm run dev:frontend  # в одном терминале
npm run dev:backend   # в другом терминале
```

Фронтенд: http://localhost:5173
Бэкенд: http://localhost:8000
Документация API: http://localhost:8000/docs

## Что уже работает

- Подключение куба через Web Bluetooth (GAN, Giiker, GoCube, MoYu, QiYi).
- Приём событий от куба (ходы, состояние граней, батарея).
- Визуализация куба через cubing.js.
- Таймер и список ходов.
- Бэкенд с пользователями и сессиями сборок.
- WebSocket для live-событий.

## Архитектура под расширение

- Модульная структура: куб, таймер, сессии, пользователь, статистика, тренировки.
- Абстракции для добавления новых брендов кубов и режимов тренировки.
- Миграции базы данных через Alembic (можно добавить позже).
- API версионирован /api/v1.
- WebSocket channel готов к multiplayer и трансляциям.

## Следующие шаги

- Добавить авторизацию JWT и защиту API.
- Синхронизация времени куба и хоста (cubeTimestampLinearFit).
- Сохранение сессий с фронтенда на бэкенд.
- Статистика и dashboard.
- Тренировочные режимы (OLL/PLL, F2L, XCross).
- Docker и деплой.
