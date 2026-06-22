from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes, ConversationHandler
from app.bot.states import States
from app.database import SessionLocal
from app.config import get_settings


def get_db():
    return SessionLocal()


def get_or_create_user(telegram_user):
    from app.models.user import User
    db = get_db()
    try:
        user = db.query(User).filter(User.telegram_id == telegram_user.id).first()
        if not user:
            user = User(telegram_id=telegram_user.id, username=telegram_user.username or '', full_name=telegram_user.full_name or 'Foydalanuvchi')
            db.add(user)
            db.commit()
            db.refresh(user)
        return user.id
    finally:
        db.close()


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    get_or_create_user(update.effective_user)
    keyboard = [
        [InlineKeyboardButton("📚 Fanlar", callback_data='subjects')],
    ]
    await update.message.reply_text(
        "🎓 *Test Market platformasiga xush kelibsiz!*\n\n"
        "Fanni tanlang, to'lov chekini yuboring — 30 savollik test PDF shaklida yuboriladi!\n\n"
        "📚 /fanlar — Boshlash",
        parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard),
    )


async def subjects_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    from app.models.subject import Subject

    db = get_db()
    try:
        subjects = db.query(Subject).filter(Subject.is_active == True).all()
        if not subjects:
            text = "😔 Hozircha fanlar mavjud emas."
            if update.callback_query:
                await update.callback_query.answer()
                await update.callback_query.edit_message_text(text)
            else:
                await update.message.reply_text(text)
            return

        keyboard = []
        for s in subjects:
            icon = s.icon if s.icon and not s.icon.startswith(('<', '/', 'h')) else '📚'
            keyboard.append([InlineKeyboardButton(
                f"{icon} {s.name}",
                callback_data=f'buy_{s.id}'
            )])

        text = "📚 *Fanni tanlang:*"
        if update.callback_query:
            await update.callback_query.answer()
            await update.callback_query.edit_message_text(text, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard))
        else:
            await update.message.reply_text(text, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard))
    finally:
        db.close()


async def select_subject(update: Update, context: ContextTypes.DEFAULT_TYPE):
    from app.models.subject import Subject

    query = update.callback_query
    await query.answer()
    subject_id = int(query.data.split('_')[1])

    db = get_db()
    try:
        subject = db.query(Subject).filter(Subject.id == subject_id).first()
        if not subject:
            await query.edit_message_text("❌ Fan topilmadi")
            return ConversationHandler.END

        context.user_data['subject_id'] = subject_id
        context.user_data['subject_name'] = subject.name
    finally:
        db.close()

    settings = get_settings()
    card = settings.TELEGRAM_PAYMENT_CARD
    holder = settings.TELEGRAM_CARD_HOLDER

    text = (
        f"📚 *{context.user_data['subject_name']}* — 30 ta savol\n\n"
        f"💳 Karta raqami:\n`{card}`\n"
        f"👤 {holder}\n\n"
        f"✅ To'lov qilib *chek screenshotini* yuboring.\n"
        f"🚫 /cancel — Bekor qilish"
    )
    await query.edit_message_text(text, parse_mode='Markdown')
    return States.WAITING_SCREENSHOT


async def handle_screenshot(update: Update, context: ContextTypes.DEFAULT_TYPE):
    from app.models.user import User
    from app.models.payment import Payment
    from app.models.notification import Notification

    ud = context.user_data
    if not ud.get('subject_id'):
        await update.message.reply_text("❌ Avval fanni tanlang: /fanlar")
        return ConversationHandler.END

    import os, uuid
    photo = update.message.photo[-1]
    tg_file = await photo.get_file()

    upload_dir = get_settings().UPLOAD_DIR
    os.makedirs(os.path.join(upload_dir, "screenshots"), exist_ok=True)
    filename = f"screenshots/{uuid.uuid4().hex}.jpg"
    await tg_file.download_to_drive(os.path.join(upload_dir, filename))

    db = get_db()
    try:
        user = db.query(User).filter(User.telegram_id == update.effective_user.id).first()
        if not user:
            await update.message.reply_text("❌ Avval /start yuboring.")
            return ConversationHandler.END

        payment = Payment(user_id=user.id, subject_id=ud['subject_id'], question_count=30,
                          mode='mixed', amount=0, screenshot_file_id=filename, status='pending')
        db.add(payment)
        notif = Notification(admin_id=1, title="Yangi to'lov",
                             message=f"{user.full_name} — {ud['subject_name']}", type='payment')
        db.add(notif)
        db.commit()
    finally:
        db.close()

    await update.message.reply_text(
        "✅ *Chek qabul qilindi!*\n\n"
        "⏳ Admin tasdiqlagandan so'ng test PDF yuboriladi.",
        parse_mode='Markdown',
    )
    context.user_data.clear()
    return ConversationHandler.END


async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data.clear()
    await update.message.reply_text("🚫 Bekor qilindi.\n/start — Bosh menyu")
    return ConversationHandler.END
