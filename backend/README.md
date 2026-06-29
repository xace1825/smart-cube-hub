# Smart Cube Hub Backend

FastAPI + SQLModel + SQLite.

## Запуск

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## API

- `GET /health` — проверка работы
- `POST /api/v1/users/` — создать пользователя
- `GET /api/v1/users/{id}` — получить пользователя
- `POST /api/v1/sessions/` — начать сессию
- `GET /api/v1/sessions/?user_id=...` — список сессий
- `PATCH /api/v1/sessions/{id}` — обновить сессию
- `WS /api/v1/cube-events/ws` — WebSocket для live-событий
