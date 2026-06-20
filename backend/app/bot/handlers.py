import os
import random
from datetime import datetime, timezone
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes, ConversationHandler
from app.bot.states import States
from app.database import SessionLocal


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
        [InlineKeyboardButton("📝 Mening Testlarim", callback_data='my_tests')],
    ]
    await update.message.reply_text(
        "🎓 *TestFull platformasiga xush kelibsiz!*\n\n"
        "📚 /fanlar — Fanlar ro'yxati\n"
        "📝 /testlarim — Tasdiqlangan testlar\n"
        "📊 /natijalar — Test natijalari\n"
        "❓ /help — Yordam\n",
        parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard),
    )


async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "📖 *Yordam*\n\n"
        "1️⃣ /fanlar — Fanlarni ko'ring\n"
        "2️⃣ Fanni tanlang → Rejim → Test soni → To'lov\n"
        "3️⃣ Admin tasdiqlashini kuting\n"
        "4️⃣ Testni ishlang va natijani ko'ring\n\n"
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
            f"💰 Narxi: {subject.price_per_question:,} so'm / 1 test\n\n"
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

    price = context.user_data['price_per_q']
    keyboard = [[InlineKeyboardButton(f"{n} ta test — {n * price:,} so'm", callback_data=f'count_{n}')] for n in [10, 20, 30, 50]]
    mode_text = "🔀 Aralash" if mode == 'mixed' else "📂 Mavzulashtirilgan"
    await query.edit_message_text(
        f"📝 *{context.user_data['subject_name']}*\nRejim: {mode_text}\n\n"
        f"Test sonini tanlang yoki yozing:\n💰 1 ta test = {price:,} so'm",
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
    total = count * context.user_data['price_per_q']
    context.user_data['total_price'] = total
    card = os.getenv('TELEGRAM_PAYMENT_CARD', '8600-XXXX-XXXX-XXXX')
    holder = os.getenv('TELEGRAM_CARD_HOLDER', 'ISM FAMILIYA')
    mode_text = "🔀 Aralash" if context.user_data['mode'] == 'mixed' else "📂 Mavzulashtirilgan"

    text = (
        f"💳 *To'lov ma'lumotlari*\n\n"
        f"📚 Fan: {context.user_data['subject_name']}\n📋 Rejim: {mode_text}\n"
        f"❓ Test soni: {count} ta\n💰 Summa: *{total:,} so'm*\n\n"
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

    await update.message.reply_text("✅ *To'lov cheki qabul qilindi!*\n\n⏳ Admin tasdiqlagandan so'ng test ochiladi.\n📝 /testlarim", parse_mode='Markdown')
    context.user_data.clear()
    return ConversationHandler.END


async def my_tests(update: Update, context: ContextTypes.DEFAULT_TYPE):
    from app.models.user import User
    from app.models.payment import Payment

    db = get_db()
    try:
        user = db.query(User).filter(User.telegram_id == update.effective_user.id).first()
        if not user:
            text = "❌ Avval /start yuboring"
            if update.callback_query:
                await update.callback_query.answer()
                await update.callback_query.edit_message_text(text)
            else:
                await update.message.reply_text(text)
            return

        approved = db.query(Payment).filter(Payment.user_id == user.id, Payment.status == 'approved').all()
        pending = db.query(Payment).filter(Payment.user_id == user.id, Payment.status == 'pending').all()

        text = "📝 *Mening Testlarim*\n\n"
        keyboard = []
        if approved:
            text += "✅ *Mavjud testlar:*\n"
            for p in approved:
                mode_t = "aralash" if p.mode == 'mixed' else "mavzuli"
                text += f"• {p.subject.name} — {p.question_count} ta ({mode_t})\n"
                keyboard.append([InlineKeyboardButton(f"🚀 {p.subject.name} ({p.question_count} ta)", callback_data=f'start_test_{p.id}')])
        else:
            text += "📭 Tasdiqlangan testlar yo'q.\n"
        if pending:
            text += f"\n⏳ *Kutilmoqda:* {len(pending)} ta\n"
            for p in pending:
                text += f"• {p.subject.name} — {p.question_count} ta — {p.amount:,} so'm\n"
        keyboard.append([InlineKeyboardButton("📚 Testlar do'koni", callback_data='subjects')])

        if update.callback_query:
            await update.callback_query.answer()
            await update.callback_query.edit_message_text(text, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard))
        else:
            await update.message.reply_text(text, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard))
    finally:
        db.close()


async def start_test(update: Update, context: ContextTypes.DEFAULT_TYPE):
    from app.models.user import User
    from app.models.payment import Payment
    from app.models.attempt import TestAttempt
    from app.models.question import Question
    from app.models.topic import Topic

    query = update.callback_query
    await query.answer()
    payment_id = int(query.data.split('_')[2])

    db = get_db()
    try:
        user = db.query(User).filter(User.telegram_id == update.effective_user.id).first()
        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if not user or not payment or payment.user_id != user.id or payment.status != 'approved':
            await query.edit_message_text("❌ Test topilmadi yoki ruxsat yo'q.")
            return ConversationHandler.END

        all_questions = db.query(Question).join(Topic).filter(Topic.subject_id == payment.subject_id, Topic.is_active == True).all()
        if not all_questions:
            await query.edit_message_text("❌ Savollar mavjud emas.")
            return ConversationHandler.END

        count = min(payment.question_count, len(all_questions))
        selected = random.sample(all_questions, count)

        attempt = TestAttempt(user_id=user.id, subject_id=payment.subject_id, payment_id=payment.id, mode=payment.mode, total_questions=count)
        db.add(attempt)
        db.commit()
        db.refresh(attempt)

        context.user_data.update({
            'attempt_id': attempt.id, 'questions': [q.id for q in selected],
            'current_q': 0, 'subject_name': payment.subject.name,
        })
    finally:
        db.close()

    await send_question(query, context)
    return States.ANSWERING


async def send_question(msg, context: ContextTypes.DEFAULT_TYPE):
    from app.models.question import Question

    current = context.user_data['current_q']
    q_ids = context.user_data['questions']
    if current >= len(q_ids):
        await finish_test(msg, context)
        return ConversationHandler.END

    db = get_db()
    try:
        q = db.query(Question).filter(Question.id == q_ids[current]).first()
        total = len(q_ids)
        text = f"📝 *{context.user_data['subject_name']}*\nSavol {current + 1}/{total}\n\n❓ {q.question_text}\n\nA) {q.option_a}\nB) {q.option_b}\nC) {q.option_c}\nD) {q.option_d}"
        keyboard = [
            [InlineKeyboardButton("A", callback_data=f'answer_{q.id}_A'), InlineKeyboardButton("B", callback_data=f'answer_{q.id}_B')],
            [InlineKeyboardButton("C", callback_data=f'answer_{q.id}_C'), InlineKeyboardButton("D", callback_data=f'answer_{q.id}_D')],
        ]
    finally:
        db.close()

    if hasattr(msg, 'edit_message_text'):
        await msg.edit_message_text(text, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard))
    else:
        await msg.reply_text(text, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard))


async def handle_answer(update: Update, context: ContextTypes.DEFAULT_TYPE):
    from app.models.question import Question
    from app.models.attempt import AttemptAnswer

    query = update.callback_query
    await query.answer()
    parts = query.data.split('_')
    question_id, selected = int(parts[1]), parts[2]

    db = get_db()
    try:
        q = db.query(Question).filter(Question.id == question_id).first()
        is_correct = q.correct_option.upper() == selected.upper()
        answer = AttemptAnswer(attempt_id=context.user_data['attempt_id'], question_id=question_id, selected_option=selected, is_correct=is_correct)
        db.add(answer)
        db.commit()
    finally:
        db.close()

    context.user_data['current_q'] += 1
    if context.user_data['current_q'] >= len(context.user_data['questions']):
        await finish_test(query, context)
        return ConversationHandler.END
    await send_question(query, context)
    return States.ANSWERING


async def finish_test(query, context: ContextTypes.DEFAULT_TYPE):
    from app.models.attempt import TestAttempt, AttemptAnswer

    db = get_db()
    try:
        attempt = db.query(TestAttempt).filter(TestAttempt.id == context.user_data['attempt_id']).first()
        answers = db.query(AttemptAnswer).filter(AttemptAnswer.attempt_id == attempt.id).all()
        correct = sum(1 for a in answers if a.is_correct)
        total = len(answers)
        score = (correct / total * 100) if total > 0 else 0
        attempt.correct_answers = correct
        attempt.score = round(score, 1)
        attempt.finished_at = datetime.now(timezone.utc)
        db.commit()

        text = f"🏁 *Test yakunlandi!*\n\n📚 {context.user_data['subject_name']}\n\n✅ To'g'ri: {correct}/{total}\n📊 Ball: {score:.1f}%\n\n"
        if score >= 86: text += "🏆 A'lo!"
        elif score >= 71: text += "👍 Yaxshi!"
        elif score >= 56: text += "📖 Qoniqarli."
        else: text += "📚 Ko'proq tayyorlaning."

        text += "\n\n*Javoblar:*\n"
        for i, a in enumerate(answers):
            e = "✅" if a.is_correct else "❌"
            text += f"{e} {i+1}. {a.selected_option}"
            if not a.is_correct:
                text += f" (to'g'ri: {a.question.correct_option})"
            text += "\n"
    finally:
        db.close()

    keyboard = [
        [InlineKeyboardButton("📚 Yana test", callback_data='subjects')],
        [InlineKeyboardButton("📋 Testlarim", callback_data='my_tests')],
    ]
    await query.edit_message_text(text, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard))
    for k in ['attempt_id', 'questions', 'current_q', 'subject_name']:
        context.user_data.pop(k, None)


async def my_results(update: Update, context: ContextTypes.DEFAULT_TYPE):
    from app.models.user import User
    from app.models.attempt import TestAttempt

    db = get_db()
    try:
        user = db.query(User).filter(User.telegram_id == update.effective_user.id).first()
        if not user:
            await update.message.reply_text("❌ Avval /start yuboring")
            return
        attempts = db.query(TestAttempt).filter(TestAttempt.user_id == user.id).order_by(TestAttempt.started_at.desc()).limit(20).all()
        if not attempts:
            await update.message.reply_text("📭 Hali test ishlamagansiz.")
            return
        text = "📊 *Natijalarim*\n\n"
        for a in attempts:
            d = a.started_at.strftime('%d.%m.%Y') if a.started_at else '—'
            s = "✅" if a.finished_at else "⏳"
            text += f"{s} {a.subject.name}\n   📅 {d} | ✅ {a.correct_answers}/{a.total_questions} | 📊 {a.score:.1f}%\n\n"
        await update.message.reply_text(text, parse_mode='Markdown')
    finally:
        db.close()


async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data.clear()
    await update.message.reply_text("🚫 Bekor qilindi.\n/start — Bosh menyu")
    return ConversationHandler.END
