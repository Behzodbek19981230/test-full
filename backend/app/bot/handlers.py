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
    from app.models.subject import Subject

    user_id = get_or_create_user(update.effective_user)
    full_name = update.effective_user.full_name or "Foydalanuvchi"

    args = context.args
    if args and args[0].startswith("sub_"):
        try:
            subject_id = int(args[0].split("_")[1])
        except (IndexError, ValueError):
            subject_id = None

        if subject_id:
            db = get_db()
            try:
                subject = db.query(Subject).filter(Subject.id == subject_id, Subject.is_active == True).first()
            finally:
                db.close()

            if subject:
                await update.message.reply_text(
                    f"👋 *Salom, {full_name}!*\n"
                    f"Test Market platformasiga xush kelibsiz!\n\n"
                    f"📚 Siz *{subject.name}* fanini tanladingiz.",
                    parse_mode='Markdown',
                )
                context.user_data['subject_id'] = subject.id
                context.user_data['subject_name'] = subject.name

                settings = get_settings()
                card = settings.TELEGRAM_PAYMENT_CARD
                holder = settings.TELEGRAM_CARD_HOLDER

                text = (
                    f"📚 *{subject.name}* — 30 ta savol\n\n"
                    f" Narxi: 5000 so'm\n\n"
                    f"💳 Karta raqami:\n`{card}`\n"
                    f"👤 {holder}\n\n"
                    f"✅ To'lov qilib *chek screenshotini* yuboring.\n"
                    f"🚫 /cancel — Bekor qilish"
                )
                await update.message.reply_text(text, parse_mode='Markdown')
                return States.WAITING_SCREENSHOT

    keyboard = [
        [InlineKeyboardButton("📚 Fanlar", callback_data='subjects')],
    ]
    await update.message.reply_text(
        f"👋 *Salom, {full_name}!*\n"
        f"Test Market platformasiga xush kelibsiz!\n\n"
        "Fanni tanlang, to'lov chekini yuboring — 30 savollik test linki yuboriladi!\n\n"
        "📚 /fanlar — Boshlash",
        parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard),
    )
    return ConversationHandler.END


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
        f" Narxi: 5000 so'm\n\n"
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
        "⏳ Admin tasdiqlagandan so'ng test linki yuboriladi.",
        parse_mode='Markdown',
    )
    context.user_data.clear()
    return ConversationHandler.END


async def check_answers(update: Update, context: ContextTypes.DEFAULT_TYPE):
    from app.models.variant import TestVariant
    from app.models.question import Question
    from app.models.user import User

    text = update.message.text.strip()

    parts = text.split(":")
    if len(parts) != 2:
        return
    try:
        variant_id = int(parts[0].strip())
    except ValueError:
        return
    user_answers = parts[1].strip().upper()

    if not user_answers or not all(c in "ABCD" for c in user_answers):
        await update.message.reply_text("❌ Javoblar faqat A, B, C, D harflaridan iborat bo'lishi kerak.")
        return

    db = get_db()
    try:
        user = db.query(User).filter(User.telegram_id == update.effective_user.id).first()
        if not user:
            await update.message.reply_text("❌ Avval /start yuboring.")
            return

        variant = db.query(TestVariant).filter(
            TestVariant.id == variant_id,
            TestVariant.user_id == user.id,
        ).first()
        if not variant:
            await update.message.reply_text("❌ Variant topilmadi yoki sizga tegishli emas.")
            return

        if variant.status == "checked":
            await update.message.reply_text(
                f"ℹ️ Variant #{variant_id} allaqachon tekshirilgan.\n"
                f"✅ Natija: *{variant.correct_count}* / {variant.question_count} (*{variant.score}%*)",
                parse_mode="Markdown",
            )
            return

        if variant.status != "sent":
            await update.message.reply_text("❌ Bu variant hali yuborilmagan.")
            return

        if not variant.question_ids:
            await update.message.reply_text("❌ Bu variantning savollari tizimda saqlanmagan.")
            return

        q_ids = [int(qid) for qid in variant.question_ids.split(",")]
        questions = {q.id: q for q in db.query(Question).filter(Question.id.in_(q_ids)).all()}
        ordered = [questions[qid] for qid in q_ids if qid in questions]

        if len(user_answers) != len(ordered):
            await update.message.reply_text(
                f"❌ Javoblar soni mos emas.\n"
                f"Variantda *{len(ordered)}* ta savol bor, siz *{len(user_answers)}* ta javob yubordingiz.",
                parse_mode="Markdown",
            )
            return

        correct = 0
        wrong_list = []
        for i, (q, ans) in enumerate(zip(ordered, user_answers), 1):
            if ans == q.correct_option.upper():
                correct += 1
            else:
                wrong_list.append(f"  {i}. Siz: {ans} | To'g'ri: {q.correct_option.upper()}")

        total = len(ordered)
        percent = round(correct / total * 100, 1)

        if percent >= 80:
            emoji = "🏆"
        elif percent >= 60:
            emoji = "👍"
        elif percent >= 40:
            emoji = "📖"
        else:
            emoji = "💪"

        result = (
            f"{emoji} *Variant #{variant_id} natijalari:*\n\n"
            f"✅ To'g'ri: *{correct}* / {total}\n"
            f"❌ Xato: *{total - correct}*\n"
            f"📊 Ball: *{percent}%*\n"
        )

        if wrong_list:
            result += f"\n📋 *Xato javoblar:*\n" + "\n".join(wrong_list)

        result += f"\n\n📚 /fanlar — Yangi test"

        from datetime import datetime, timezone
        variant.user_answers = user_answers
        variant.correct_count = correct
        variant.score = round(percent)
        variant.status = "checked"
        variant.checked_at = datetime.now(timezone.utc)
        db.commit()

        await update.message.reply_text(result, parse_mode="Markdown")
    finally:
        db.close()


async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data.clear()
    await update.message.reply_text("🚫 Bekor qilindi.\n/start — Bosh menyu")
    return ConversationHandler.END
