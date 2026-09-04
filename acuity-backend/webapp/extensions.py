from flask_socketio import SocketIO
from flask_limiter import Limiter
from flask import request

def get_real_ip():
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.remote_addr

socketio = SocketIO(cors_allowed_origins="*", async_mode="threading")
limiter = Limiter(key_func=get_real_ip)
