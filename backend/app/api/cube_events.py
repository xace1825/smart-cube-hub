from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Set

router = APIRouter()
active_connections: Set[WebSocket] = set()


@router.websocket("/ws")
async def cube_events_ws(websocket: WebSocket):
    await websocket.accept()
    active_connections.add(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # broadcast to all connected clients including sender
            for conn in list(active_connections):
                try:
                    await conn.send_json({
                        "source": "server",
                        "receivedAt": data.get("timestamp"),
                        "payload": data,
                    })
                except Exception:
                    active_connections.discard(conn)
    except WebSocketDisconnect:
        active_connections.discard(websocket)
