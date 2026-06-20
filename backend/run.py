import threading
import uvicorn
from app.main import create_app

app = create_app()


def start_bot():
    from app.bot import run_bot
    run_bot()


if __name__ == "__main__":
    bot_thread = threading.Thread(target=start_bot, daemon=True)
    bot_thread.start()
    print("Telegram bot ishga tushdi!")

    uvicorn.run(app, host="0.0.0.0", port=5000, log_level="info")
