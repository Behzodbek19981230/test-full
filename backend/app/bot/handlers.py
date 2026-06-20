import os
import random
from datetime import datetime, timezone
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes, ConversationHandler
from app.bot.states import States


def get_app(context):
    return context.application.bot_data['flask_app']


def display_icon(icon):
    if not icon or icon.startswith('<svg') or icon.startswith('<?xml') or icon.startswith('/api/') or icon.startswith('http'):
        return '📚'
    return icon


def get_or_create_user(app, telegram_user):
    with app.app_context():
        from app import db
        from app.models import User
        user = User.query.filter_by(telegram_id=telegram_user.id).first()
        if not user:
            user = User(
                telegram_id=telegram_user.id,
                username=telegram_user.username or '',
                full_name=telegram_user.full_name or 'Foydalanuvchi',
            )
            db.session.add(user)
            db.session.commit()
        return user.id


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    app = get_app(context)
    get_or_create_user(app, update.effective_user)

    keyboard = [
        [InlineKeyboardButton("📚 Fanlar va Testlar", callback_data='subjects')],
        [InlineKeyboardButton("📝 Mening Testlarim", callback_data='my_tests')],
    ]

    await update.message.reply_text(
        "🎓 *TestFull platformasiga xush kelibsiz!*\n\n"
        "DTM va attestatsiyaga tayyorlanish uchun eng yaxshi platforma.\n\n"
        "📚 /fanlar — Fanlar ro'yxati\n"
        "📝 /testlarim — Tasdiqlangan testlar\n"
        "📊 /natijalar — Test natijalari\n"
        "❓ /help — Yordam\n",
        parse_mode='Markdown',
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "📖 *Yordam*\n\n"
        "1️⃣ /fanlar — Mavjud fanlarni ko'ring\n"
        "2️⃣ Fanni tanlang → Rejim tanlang (mavzulashtirilgan/aralash)\n"
        "3️⃣ Test sonini kiriting (masalan 30)\n"
        "4️⃣ To'lov qilib chek screenshotini yuboring\n"
        "5️⃣ Admin tasdiqlashini kuting\n"
        "6️⃣ Testni ishlang va natijani ko'ring\n\n"
        "📝 /testlarim — Tasdiqlangan testlar\n"
        "📊 /natijalar — Barcha natijalar\n"
        "🚫 /cancel — Bekor qilish",
        parse_mode='Markdown',
    )


# ========== FAN TANLASH ==========

async def subjects_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    app = get_app(context)
    with app.app_context():
        from app.models import Subject, Topic, Question
        subjects = Subject.query.filter_by(is_active=True).all()

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
            q_count = Question.query.join(Topic).filter(Topic.subject_id == s.id, Topic.is_active == True).count()
            keyboard.append([InlineKeyboardButton(
                f"{display_icon(s.icon)} {s.name} ({q_count} savol)",
                callback_data=f'subject_{s.id}'
            )])

        text = "📚 *Fanlar ro'yxati*\n\nQuyidagi fanlardan birini tanlang:"
        if update.callback_query:
            await update.callback_query.answer()
            await update.callback_query.edit_message_text(
                text, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard)
            )
        else:
            await update.message.reply_text(
                text, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard)
            )


# ========== FAN DETALI → REJIM TANLASH ==========

async def subject_detail(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    subject_id = int(query.data.split('_')[1])

    app = get_app(context)
    with app.app_context():
        from app.models import Subject, Topic, Question
        subject = Subject.query.get(subject_id)
        if not subject:
            await query.edit_message_text("❌ Fan topilmadi")
            return

        topics = Topic.query.filter_by(subject_id=subject_id, is_active=True).all()
        q_count = Question.query.join(Topic).filter(Topic.subject_id == subject_id, Topic.is_active == True).count()

        text = (
            f"{display_icon(subject.icon)} *{subject.name}*\n\n"
            f"📂 Mavzular: {len(topics)} ta\n"
            f"❓ Savollar: {q_count} ta\n"
            f"💰 Narxi: {subject.price_per_question:,} so'm / 1 test\n\n"
            f"Test rejimini tanlang:"
        )

        keyboard = [
            [InlineKeyboardButton("🔀 Aralash (barcha mavzular)", callback_data=f'mode_{subject_id}_mixed')],
            [InlineKeyboardButton("📂 Mavzulashtirilgan", callback_data=f'mode_{subject_id}_topics')],
            [InlineKeyboardButton("⬅️ Orqaga", callback_data='subjects')],
        ]

        await query.edit_message_text(
            text, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard)
        )


# ========== REJIM TANLASH → SON KIRITISH ==========

async def select_mode(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    parts = query.data.split('_')
    subject_id = int(parts[1])
    mode = parts[2]

    context.user_data['subject_id'] = subject_id
    context.user_data['mode'] = mode

    app = get_app(context)
    with app.app_context():
        from app.models import Subject
        subject = Subject.query.get(subject_id)
        price = subject.price_per_question

        context.user_data['price_per_q'] = price
        context.user_data['subject_name'] = subject.name

    keyboard = []
    for n in [10, 20, 30, 50]:
        total = n * price
        keyboard.append([InlineKeyboardButton(
            f"{n} ta test — {total:,} so'm",
            callback_data=f'count_{n}'
        )])

    mode_text = "🔀 Aralash" if mode == 'mixed' else "📂 Mavzulashtirilgan"
    await query.edit_message_text(
        f"📝 *{context.user_data['subject_name']}*\n"
        f"Rejim: {mode_text}\n\n"
        f"Test sonini tanlang yoki yozing:\n"
        f"💰 1 ta test = {price:,} so'm",
        parse_mode='Markdown',
        reply_markup=InlineKeyboardMarkup(keyboard),
    )

    return States.WAITING_COUNT


async def handle_count_button(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    count = int(query.data.split('_')[1])
    context.user_data['question_count'] = count
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
    price = context.user_data['price_per_q']
    total = count * price
    context.user_data['total_price'] = total

    card = os.getenv('TELEGRAM_PAYMENT_CARD', '8600-XXXX-XXXX-XXXX')
    holder = os.getenv('TELEGRAM_CARD_HOLDER', 'ISM FAMILIYA')
    mode_text = "🔀 Aralash" if context.user_data['mode'] == 'mixed' else "📂 Mavzulashtirilgan"

    text = (
        f"💳 *To'lov ma'lumotlari*\n\n"
        f"📚 Fan: {context.user_data['subject_name']}\n"
        f"📋 Rejim: {mode_text}\n"
        f"❓ Test soni: {count} ta\n"
        f"💰 Summa: *{total:,} so'm*\n\n"
        f"💳 Karta raqami:\n`{card}`\n"
        f"👤 Karta egasi: {holder}\n\n"
        f"✅ To'lov qilganingizdan so'ng, *chek screenshotini* yuboring.\n"
        f"🚫 Bekor qilish: /cancel"
    )

    if hasattr(msg, 'edit_message_text'):
        await msg.edit_message_text(text, parse_mode='Markdown')
    else:
        await msg.reply_text(text, parse_mode='Markdown')

    return States.WAITING_SCREENSHOT


# ========== SCREENSHOT ==========

async def handle_screenshot(update: Update, context: ContextTypes.DEFAULT_TYPE):
    subject_id = context.user_data.get('subject_id')
    count = context.user_data.get('question_count')
    mode = context.user_data.get('mode')
    total = context.user_data.get('total_price')

    if not subject_id:
        await update.message.reply_text("❌ Xatolik. Qaytadan /fanlar buyrug'ini yuboring.")
        return ConversationHandler.END

    photo = update.message.photo[-1]
    file_id = photo.file_id

    app = get_app(context)
    with app.app_context():
        from app import db
        from app.models import User, Payment, Notification

        user = User.query.filter_by(telegram_id=update.effective_user.id).first()
        if not user:
            await update.message.reply_text("❌ Avval /start buyrug'ini yuboring.")
            return ConversationHandler.END

        payment = Payment(
            user_id=user.id,
            subject_id=subject_id,
            question_count=count,
            mode=mode,
            amount=total,
            screenshot_file_id=file_id,
            status='pending',
        )
        db.session.add(payment)

        notification = Notification(
            admin_id=1,
            title='Yangi to\'lov so\'rovi',
            message=f'{user.full_name} — {context.user_data["subject_name"]} ({count} ta, {total:,} so\'m)',
            type='payment',
        )
        db.session.add(notification)
        db.session.commit()

    await update.message.reply_text(
        "✅ *To'lov cheki qabul qilindi!*\n\n"
        "⏳ Admin tekshirib, tasdiqlagandan so'ng test sizga ochiladi.\n"
        "📝 /testlarim — Testlaringizni ko'rish",
        parse_mode='Markdown',
    )

    context.user_data.clear()
    return ConversationHandler.END


# ========== MENING TESTLARIM ==========

async def my_tests(update: Update, context: ContextTypes.DEFAULT_TYPE):
    app = get_app(context)
    with app.app_context():
        from app.models import User, Payment

        user = User.query.filter_by(telegram_id=update.effective_user.id).first()
        if not user:
            text = "❌ Avval /start buyrug'ini yuboring"
            if update.callback_query:
                await update.callback_query.answer()
                await update.callback_query.edit_message_text(text)
            else:
                await update.message.reply_text(text)
            return

        approved = Payment.query.filter_by(user_id=user.id, status='approved').all()
        pending = Payment.query.filter_by(user_id=user.id, status='pending').all()

        text = "📝 *Mening Testlarim*\n\n"
        keyboard = []

        if approved:
            text += "✅ *Mavjud testlar:*\n"
            for p in approved:
                mode_t = "aralash" if p.mode == 'mixed' else "mavzulashtirilgan"
                text += f"• {p.subject.name} — {p.question_count} ta ({mode_t})\n"
                keyboard.append([InlineKeyboardButton(
                    f"🚀 {p.subject.name} ({p.question_count} ta)",
                    callback_data=f'start_test_{p.id}'
                )])
        else:
            text += "📭 Hozircha tasdiqlangan testlar yo'q.\n"

        if pending:
            text += f"\n⏳ *Kutilmoqda:* {len(pending)} ta to'lov\n"
            for p in pending:
                text += f"• {p.subject.name} — {p.question_count} ta — {p.amount:,} so'm\n"

        keyboard.append([InlineKeyboardButton("📚 Testlar do'koni", callback_data='subjects')])

        if update.callback_query:
            await update.callback_query.answer()
            await update.callback_query.edit_message_text(
                text, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard)
            )
        else:
            await update.message.reply_text(
                text, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard)
            )


# ========== TESTNI BOSHLASH ==========

async def start_test(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    payment_id = int(query.data.split('_')[2])

    app = get_app(context)
    with app.app_context():
        from app import db
        from app.models import User, Payment, TestAttempt, Question, Topic

        user = User.query.filter_by(telegram_id=update.effective_user.id).first()
        payment = Payment.query.get(payment_id)

        if not user or not payment or payment.user_id != user.id or payment.status != 'approved':
            await query.edit_message_text("❌ Test topilmadi yoki ruxsat yo'q.")
            return ConversationHandler.END

        q_query = Question.query.join(Topic).filter(
            Topic.subject_id == payment.subject_id,
            Topic.is_active == True
        )
        all_questions = q_query.all()

        if len(all_questions) == 0:
            await query.edit_message_text("❌ Bu fan bo'yicha savollar mavjud emas.")
            return ConversationHandler.END

        count = min(payment.question_count, len(all_questions))
        selected = random.sample(all_questions, count)

        attempt = TestAttempt(
            user_id=user.id,
            subject_id=payment.subject_id,
            payment_id=payment.id,
            mode=payment.mode,
            total_questions=count,
        )
        db.session.add(attempt)
        db.session.commit()

        context.user_data['attempt_id'] = attempt.id
        context.user_data['questions'] = [q.id for q in selected]
        context.user_data['current_q'] = 0
        context.user_data['subject_name'] = payment.subject.name

    await send_question(query, context)
    return States.ANSWERING


async def send_question(query_or_message, context: ContextTypes.DEFAULT_TYPE):
    current = context.user_data['current_q']
    question_ids = context.user_data['questions']

    if current >= len(question_ids):
        await finish_test(query_or_message, context)
        return ConversationHandler.END

    app = get_app(context)
    with app.app_context():
        from app.models import Question
        q = Question.query.get(question_ids[current])
        total = len(question_ids)

        text = (
            f"📝 *{context.user_data['subject_name']}*\n"
            f"Savol {current + 1}/{total}\n\n"
            f"❓ {q.question_text}\n\n"
            f"A) {q.option_a}\n"
            f"B) {q.option_b}\n"
            f"C) {q.option_c}\n"
            f"D) {q.option_d}"
        )

        keyboard = [
            [
                InlineKeyboardButton("A", callback_data=f'answer_{q.id}_A'),
                InlineKeyboardButton("B", callback_data=f'answer_{q.id}_B'),
            ],
            [
                InlineKeyboardButton("C", callback_data=f'answer_{q.id}_C'),
                InlineKeyboardButton("D", callback_data=f'answer_{q.id}_D'),
            ],
        ]

        if hasattr(query_or_message, 'edit_message_text'):
            await query_or_message.edit_message_text(
                text, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard)
            )
        else:
            await query_or_message.reply_text(
                text, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard)
            )


async def handle_answer(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    parts = query.data.split('_')
    question_id = int(parts[1])
    selected = parts[2]

    app = get_app(context)
    with app.app_context():
        from app import db
        from app.models import Question, AttemptAnswer
        q = Question.query.get(question_id)
        is_correct = q.correct_option.upper() == selected.upper()

        answer = AttemptAnswer(
            attempt_id=context.user_data['attempt_id'],
            question_id=question_id,
            selected_option=selected,
            is_correct=is_correct,
        )
        db.session.add(answer)
        db.session.commit()

    context.user_data['current_q'] += 1

    if context.user_data['current_q'] >= len(context.user_data['questions']):
        await finish_test(query, context)
        return ConversationHandler.END

    await send_question(query, context)
    return States.ANSWERING


async def finish_test(query, context: ContextTypes.DEFAULT_TYPE):
    app = get_app(context)
    with app.app_context():
        from app import db
        from app.models import TestAttempt, AttemptAnswer

        attempt = TestAttempt.query.get(context.user_data['attempt_id'])
        answers = AttemptAnswer.query.filter_by(attempt_id=attempt.id).all()

        correct = sum(1 for a in answers if a.is_correct)
        total = len(answers)
        score = (correct / total * 100) if total > 0 else 0

        attempt.correct_answers = correct
        attempt.score = round(score, 1)
        attempt.finished_at = datetime.now(timezone.utc)
        db.session.commit()

        text = (
            f"🏁 *Test yakunlandi!*\n\n"
            f"📚 {context.user_data['subject_name']}\n\n"
            f"✅ To'g'ri javoblar: {correct}/{total}\n"
            f"📊 Ball: {score:.1f}%\n\n"
        )

        if score >= 86:
            text += "🏆 A'lo natija! Tabriklaymiz!"
        elif score >= 71:
            text += "👍 Yaxshi natija!"
        elif score >= 56:
            text += "📖 Qoniqarli. Yana mashq qiling!"
        else:
            text += "📚 Ko'proq tayyorlanish kerak."

        text += "\n\n*Javoblar tahlili:*\n"
        for i, a in enumerate(answers):
            emoji = "✅" if a.is_correct else "❌"
            text += f"{emoji} {i+1}. {a.selected_option}"
            if not a.is_correct:
                text += f" (to'g'ri: {a.question.correct_option})"
            text += "\n"

        keyboard = [
            [InlineKeyboardButton("📚 Yana test", callback_data='subjects')],
            [InlineKeyboardButton("📋 Mening testlarim", callback_data='my_tests')],
        ]

        await query.edit_message_text(
            text, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard)
        )

    for key in ['attempt_id', 'questions', 'current_q', 'subject_name']:
        context.user_data.pop(key, None)


# ========== NATIJALAR ==========

async def my_results(update: Update, context: ContextTypes.DEFAULT_TYPE):
    app = get_app(context)
    with app.app_context():
        from app.models import User, TestAttempt

        user = User.query.filter_by(telegram_id=update.effective_user.id).first()
        if not user:
            await update.message.reply_text("❌ Avval /start buyrug'ini yuboring")
            return

        attempts = TestAttempt.query.filter_by(user_id=user.id).order_by(
            TestAttempt.started_at.desc()
        ).limit(20).all()

        if not attempts:
            await update.message.reply_text("📭 Siz hali birorta test ishlamagansiz.")
            return

        text = "📊 *Mening Natijalarim*\n\n"
        for a in attempts:
            date = a.started_at.strftime('%d.%m.%Y') if a.started_at else '—'
            status = "✅" if a.finished_at else "⏳"
            text += f"{status} {a.subject.name}\n"
            text += f"   📅 {date} | ✅ {a.correct_answers}/{a.total_questions} | 📊 {a.score:.1f}%\n\n"

        await update.message.reply_text(text, parse_mode='Markdown')


async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data.clear()
    await update.message.reply_text(
        "🚫 Bekor qilindi.\n/start — Bosh menyu",
        parse_mode='Markdown',
    )
    return ConversationHandler.END
