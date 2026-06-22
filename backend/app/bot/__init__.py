from telegram.ext import (
    Application, CommandHandler, CallbackQueryHandler,
    MessageHandler, ConversationHandler, filters,
)
from app.bot.handlers import (
    start, subjects_menu, select_subject, handle_screenshot, cancel,
    check_answers,
)
from app.bot.states import States
from app.config import get_settings


def create_bot():
    token = get_settings().TELEGRAM_BOT_TOKEN
    if not token:
        print('TELEGRAM_BOT_TOKEN topilmadi! Bot ishga tushmaydi.')
        return None

    application = Application.builder().token(token).build()

    buy_conv = ConversationHandler(
        entry_points=[
            CommandHandler('start', start),
            CallbackQueryHandler(select_subject, pattern=r'^buy_\d+$'),
        ],
        states={
            States.WAITING_SCREENSHOT: [MessageHandler(filters.PHOTO, handle_screenshot)],
        },
        fallbacks=[CommandHandler('cancel', cancel)],
        per_message=False,
    )
    application.add_handler(CommandHandler('fanlar', subjects_menu))
    application.add_handler(buy_conv)
    application.add_handler(CallbackQueryHandler(subjects_menu, pattern='^subjects$'))
    application.add_handler(MessageHandler(filters.Regex(r'^\d+:[A-Da-d]+$'), check_answers))

    return application
