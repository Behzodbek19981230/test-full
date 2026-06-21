import asyncio
from telegram.ext import (
    Application, CommandHandler, CallbackQueryHandler,
    MessageHandler, ConversationHandler, filters,
)
from app.bot.handlers import (
    start, help_cmd, subjects_menu, subject_detail, select_mode,
    handle_count_button, handle_count_text, handle_screenshot,
    cancel,
)
from app.bot.states import States
from app.config import get_settings


def run_bot():
    token = get_settings().TELEGRAM_BOT_TOKEN
    if not token:
        print('TELEGRAM_BOT_TOKEN topilmadi! Bot ishga tushmaydi.')
        return

    asyncio.set_event_loop(asyncio.new_event_loop())
    application = Application.builder().token(token).build()

    buy_conv = ConversationHandler(
        entry_points=[CallbackQueryHandler(select_mode, pattern=r'^mode_\d+_(mixed|topics)$')],
        states={
            States.WAITING_COUNT: [
                CallbackQueryHandler(handle_count_button, pattern=r'^count_\d+$'),
                MessageHandler(filters.TEXT & ~filters.COMMAND, handle_count_text),
            ],
            States.WAITING_SCREENSHOT: [MessageHandler(filters.PHOTO, handle_screenshot)],
        },
        fallbacks=[CommandHandler('cancel', cancel)],
        per_message=False,
    )

    application.add_handler(CommandHandler('start', start))
    application.add_handler(CommandHandler('help', help_cmd))
    application.add_handler(CommandHandler('fanlar', subjects_menu))
    application.add_handler(buy_conv)
    application.add_handler(CallbackQueryHandler(subjects_menu, pattern='^subjects$'))
    application.add_handler(CallbackQueryHandler(subject_detail, pattern=r'^subject_\d+$'))

    application.run_polling(drop_pending_updates=True)
