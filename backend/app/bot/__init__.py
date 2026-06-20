from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    MessageHandler,
    ConversationHandler,
    filters,
)
from app.bot.handlers import (
    start, help_cmd,
    subjects_menu, subject_tests, test_detail,
    buy_test, handle_screenshot,
    my_tests, start_test, handle_answer,
    my_results,
    cancel,
)
from app.bot.states import States


def run_bot(flask_app):
    import os
    import asyncio
    token = os.getenv('TELEGRAM_BOT_TOKEN', '')
    if not token:
        print('TELEGRAM_BOT_TOKEN topilmadi! Bot ishga tushmaydi.')
        return

    asyncio.set_event_loop(asyncio.new_event_loop())
    application = Application.builder().token(token).build()
    application.bot_data['flask_app'] = flask_app

    test_conv = ConversationHandler(
        entry_points=[CallbackQueryHandler(start_test, pattern=r'^start_test_\d+$')],
        states={
            States.ANSWERING: [CallbackQueryHandler(handle_answer, pattern=r'^answer_')],
        },
        fallbacks=[CommandHandler('cancel', cancel)],
        per_message=False,
    )

    payment_conv = ConversationHandler(
        entry_points=[CallbackQueryHandler(buy_test, pattern=r'^buy_\d+$')],
        states={
            States.WAITING_SCREENSHOT: [
                MessageHandler(filters.PHOTO, handle_screenshot),
                CommandHandler('cancel', cancel),
            ],
        },
        fallbacks=[CommandHandler('cancel', cancel)],
        per_message=False,
    )

    application.add_handler(CommandHandler('start', start))
    application.add_handler(CommandHandler('help', help_cmd))
    application.add_handler(CommandHandler('fanlar', subjects_menu))
    application.add_handler(CommandHandler('testlarim', my_tests))
    application.add_handler(CommandHandler('natijalar', my_results))

    application.add_handler(payment_conv)
    application.add_handler(test_conv)

    application.add_handler(CallbackQueryHandler(subjects_menu, pattern='^subjects$'))
    application.add_handler(CallbackQueryHandler(subject_tests, pattern=r'^subject_\d+$'))
    application.add_handler(CallbackQueryHandler(test_detail, pattern=r'^test_\d+$'))
    application.add_handler(CallbackQueryHandler(my_tests, pattern='^my_tests$'))

    application.run_polling(drop_pending_updates=True)
