import asyncio
import uvicorn
from app.main import create_app
from app.bot import create_bot
from app.config import get_settings

app = create_app()


async def main():
    settings = get_settings()

    config = uvicorn.Config(app, host="0.0.0.0", port=5000, log_level="info")
    server = uvicorn.Server(config)

    bot_app = create_bot()
    if bot_app:
        print("Telegram bot ishga tushdi!")
        await bot_app.initialize()
        await bot_app.bot.set_my_commands([
            ("start", "Botni ishga tushirish"),
            ("fanlar", "Fanlar ro'yxati"),
            ("cancel", "Bekor qilish"),
        ])
        await bot_app.start()
        await bot_app.updater.start_polling(drop_pending_updates=True)

    await server.serve()

    if bot_app:
        await bot_app.updater.stop()
        await bot_app.stop()
        await bot_app.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
