import asyncio
from telegram.ext import (
    Application, CommandHandler, CallbackQueryHandler,
    MessageHandler, ConversationHandler, filters,
)
from app.bot.handlers import (
    start, help_cmd, subjects_menu, subject_detail, select_mode,
    handle_count_button, handle_count_text, handle_screenshot,
    my_tests, start_test, handle_answer, my_results, cancel,
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

    test_conv = ConversationHandler(
        entry_points=[CallbackQueryHandler(start_test, pattern=r'^start_test_\d+$')],
        states={States.ANSWERING: [CallbackQueryHandler(handle_answer, pattern=r'^answer_')]},
        fallbacks=[CommandHandler('cancel', cancel)],
        per_message=False,
    )

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
    application.add_handler(CommandHandler('testlarim', my_tests))
    application.add_handler(CommandHandler('natijalar', my_results))
    application.add_handler(buy_conv)
    application.add_handler(test_conv)
    application.add_handler(CallbackQueryHandler(subjects_menu, pattern='^subjects$'))
    application.add_handler(CallbackQueryHandler(subject_detail, pattern=r'^subject_\d+$'))
    application.add_handler(CallbackQueryHandler(my_tests, pattern='^my_tests$'))

    application.run_polling(drop_pending_updates=True)
