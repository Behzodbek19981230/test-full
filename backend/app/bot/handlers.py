from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes, ConversationHandler
from app.bot.states import States
from app.database import SessionLocal
from app.config import get_settings


def get_db():
    return SessionLocal()


def display_icon(icon):
    if not icon or icon.startswith('<svg') or icon.startswith('<?xml') or icon.startswith('/api/') or icon.startswith('http'):
        return '📚'
    return icon


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
        [InlineKeyboardButton("📚 Fanlar va Testlar", callback_data='subjects')],
    ]
    await update.message.reply_text(
        "🎓 *Test Market platformasiga xush kelibsiz!*\n\n"
        "📚 /fanlar — Fanlar ro'yxati\n"
        "❓ /help — Yordam\n\n"
        "✅ To'lov tasdiqlanishi bilan test PDF shaklida yuboriladi!",
        parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard),
    )


async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "📖 *Yordam*\n\n"
        "1️⃣ /fanlar — Fanlarni ko'ring\n"
        "2️⃣ Fanni tanlang → Rejim → Test soni → To'lov\n"
        "3️⃣ Admin tasdiqlashini kuting\n"
        "4️⃣ Test PDF shaklida yuboriladi!\n\n"
        "🚫 /cancel — Bekor qilish",
        parse_mode='Markdown',
    )


async def subjects_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    from app.models.subject import Subject
    from app.models.topic import Topic
    from app.models.question import Question
    from sqlalchemy import func

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
            q_count = db.query(func.count(Question.id)).join(Topic).filter(Topic.subject_id == s.id, Topic.is_active == True).scalar()
            keyboard.append([InlineKeyboardButton(
                f"{display_icon(s.icon)} {s.name} ({q_count} savol)",
                callback_data=f'subject_{s.id}'
            )])

        text = "📚 *Fanlar ro'yxati*\n\nQuyidagi fanlardan birini tanlang:"
        if update.callback_query:
            await update.callback_query.answer()
            await update.callback_query.edit_message_text(text, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard))
        else:
            await update.message.reply_text(text, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard))
    finally:
        db.close()


async def subject_detail(update: Update, context: ContextTypes.DEFAULT_TYPE):
    from app.models.subject import Subject
    from app.models.topic import Topic
    from app.models.question import Question
    from sqlalchemy import func

    query = update.callback_query
    await query.answer()
    subject_id = int(query.data.split('_')[1])

    db = get_db()
    try:
        subject = db.query(Subject).filter(Subject.id == subject_id).first()
        if not subject:
            await query.edit_message_text("❌ Fan topilmadi")
            return

        topic_count = db.query(func.count(Topic.id)).filter(Topic.subject_id == subject_id, Topic.is_active == True).scalar()
        q_count = db.query(func.count(Question.id)).join(Topic).filter(Topic.subject_id == subject_id, Topic.is_active == True).scalar()

        keyboard = [
            [InlineKeyboardButton("🔀 Aralash (barcha mavzular)", callback_data=f'mode_{subject_id}_mixed')],
            [InlineKeyboardButton("📂 Mavzulashtirilgan", callback_data=f'mode_{subject_id}_topics')],
            [InlineKeyboardButton("⬅️ Orqaga", callback_data='subjects')],
        ]
        await query.edit_message_text(
            f"{display_icon(subject.icon)} *{subject.name}*\n\n"
            f"📂 Mavzular: {topic_count} ta\n❓ Savollar: {q_count} ta\n"
            f"Test rejimini tanlang:",
            parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard),
        )
    finally:
        db.close()


async def select_mode(update: Update, context: ContextTypes.DEFAULT_TYPE):
    from app.models.subject import Subject

    query = update.callback_query
    await query.answer()
    parts = query.data.split('_')
    subject_id, mode = int(parts[1]), parts[2]

    db = get_db()
    try:
        subject = db.query(Subject).filter(Subject.id == subject_id).first()
        context.user_data.update({
            'subject_id': subject_id, 'mode': mode,
            'price_per_q': subject.price_per_question, 'subject_name': subject.name,
        })
    finally:
        db.close()

    keyboard = [[InlineKeyboardButton(f"{n} ta test", callback_data=f'count_{n}')] for n in [10, 20, 30, 50]]
    mode_text = "🔀 Aralash" if mode == 'mixed' else "📂 Mavzulashtirilgan"
    await query.edit_message_text(
        f"📝 *{context.user_data['subject_name']}*\nRejim: {mode_text}\n\n"
        f"Test sonini tanlang yoki yozing:",
        parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard),
    )
    return States.WAITING_COUNT


async def handle_count_button(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    context.user_data['question_count'] = int(query.data.split('_')[1])
    return await show_payment(query, context)


async def handle_count_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        count = int(update.message.text.strip())
        if count < 5 or count > 200:
            await update.message.reply_text("❌ 5 dan 200 gacha son kiriting.")
            return States.WAITING_COUNT
    except ValueError:
        await update.message.reply_text("❌ Iltimos, son kiriting (masalan: 30)")
        return States.WAITING_COUNT
    context.user_data['question_count'] = count
    return await show_payment(update.message, context)


async def show_payment(msg, context: ContextTypes.DEFAULT_TYPE):
    count = context.user_data['question_count']
    settings = get_settings()
    card = settings.TELEGRAM_PAYMENT_CARD
    holder = settings.TELEGRAM_CARD_HOLDER
    mode_text = "🔀 Aralash" if context.user_data['mode'] == 'mixed' else "📂 Mavzulashtirilgan"

    text = (
        f"💳 *To'lov ma'lumotlari*\n\n"
        f"📚 Fan: {context.user_data['subject_name']}\n📋 Rejim: {mode_text}\n"
        f"❓ Test soni: {count} ta\n\n"
        f"💳 Karta raqami:\n`{card}`\n👤 Karta egasi: {holder}\n\n"
        f"✅ To'lov qilib *chek screenshotini* yuboring.\n🚫 /cancel"
    )
    if hasattr(msg, 'edit_message_text'):
        await msg.edit_message_text(text, parse_mode='Markdown')
    else:
        await msg.reply_text(text, parse_mode='Markdown')
    return States.WAITING_SCREENSHOT


async def handle_screenshot(update: Update, context: ContextTypes.DEFAULT_TYPE):
    from app.models.user import User
    from app.models.payment import Payment
    from app.models.notification import Notification

    ud = context.user_data
    if not ud.get('subject_id'):
        await update.message.reply_text("❌ Xatolik. /fanlar buyrug'ini yuboring.")
        return ConversationHandler.END

    file_id = update.message.photo[-1].file_id
    db = get_db()
    try:
        user = db.query(User).filter(User.telegram_id == update.effective_user.id).first()
        if not user:
            await update.message.reply_text("❌ Avval /start yuboring.")
            return ConversationHandler.END

        payment = Payment(user_id=user.id, subject_id=ud['subject_id'], question_count=ud['question_count'],
                          mode=ud['mode'], amount=ud['total_price'], screenshot_file_id=file_id, status='pending')
        db.add(payment)
        notif = Notification(admin_id=1, title="Yangi to'lov so'rovi",
                             message=f'{user.full_name} — {ud["subject_name"]} ({ud["question_count"]} ta, {ud["total_price"]:,} so\'m)', type='payment')
        db.add(notif)
        db.commit()
    finally:
        db.close()

    await update.message.reply_text("✅ *To'lov cheki qabul qilindi!*\n\n⏳ Admin tasdiqlagandan so'ng test PDF shaklida yuboriladi.", parse_mode='Markdown')
    context.user_data.clear()
    return ConversationHandler.END


async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data.clear()
    await update.message.reply_text("🚫 Bekor qilindi.\n/start — Bosh menyu")
    return ConversationHandler.END
