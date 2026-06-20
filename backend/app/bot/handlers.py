import os
from datetime import datetime, timezone
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes, ConversationHandler
from app.bot.states import States


def get_app(context):
    return context.application.bot_data['flask_app']


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
        "📚 /fanlar — Fanlar va testlar ro'yxati\n"
        "📝 /testlarim — Sotib olingan testlar\n"
        "📊 /natijalar — Test natijalari\n"
        "❓ /help — Yordam\n",
        parse_mode='Markdown',
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "📖 *Yordam*\n\n"
        "1️⃣ /fanlar — Mavjud fanlarni ko'ring\n"
        "2️⃣ Kerakli fanni tanlang va testni ko'ring\n"
        "3️⃣ Testni sotib olish uchun to'lov qiling\n"
        "4️⃣ To'lov chekini screenshot qilib yuboring\n"
        "5️⃣ Admin tasdiqlashini kuting\n"
        "6️⃣ Testni ishlang va natijani ko'ring\n\n"
        "📝 /testlarim — Sotib olingan testlar\n"
        "📊 /natijalar — Barcha natijalar\n"
        "🚫 /cancel — Jarayonni bekor qilish",
        parse_mode='Markdown',
    )


async def subjects_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    app = get_app(context)
    with app.app_context():
        from app.models import Subject
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
            test_count = s.tests.filter_by(is_active=True).count()
            keyboard.append([InlineKeyboardButton(
                f"{s.icon} {s.name} ({test_count} ta test)",
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


async def subject_tests(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    subject_id = int(query.data.split('_')[1])

    app = get_app(context)
    with app.app_context():
        from app.models import Subject, Test
        subject = Subject.query.get(subject_id)
        if not subject:
            await query.edit_message_text("❌ Fan topilmadi")
            return

        tests = Test.query.filter_by(subject_id=subject_id, is_active=True).all()
        if not tests:
            await query.edit_message_text(
                f"😔 *{subject.name}* bo'yicha testlar hozircha mavjud emas.",
                parse_mode='Markdown',
            )
            return

        keyboard = []
        for t in tests:
            price_text = f"{t.price:,} so'm" if t.price > 0 else "Bepul"
            keyboard.append([InlineKeyboardButton(
                f"📝 {t.title} — {price_text}",
                callback_data=f'test_{t.id}'
            )])
        keyboard.append([InlineKeyboardButton("⬅️ Orqaga", callback_data='subjects')])

        await query.edit_message_text(
            f"📚 *{subject.name}* fanidagi testlar:\n\n"
            f"Test tanlang:",
            parse_mode='Markdown',
            reply_markup=InlineKeyboardMarkup(keyboard),
        )


async def test_detail(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    test_id = int(query.data.split('_')[1])

    app = get_app(context)
    with app.app_context():
        from app.models import Test, Payment, User
        test = Test.query.get(test_id)
        if not test:
            await query.edit_message_text("❌ Test topilmadi")
            return

        user = User.query.filter_by(telegram_id=update.effective_user.id).first()
        has_access = False
        if user:
            has_access = Payment.query.filter_by(
                user_id=user.id, test_id=test.id, status='approved'
            ).first() is not None

        price_text = f"{test.price:,} so'm" if test.price > 0 else "Bepul"
        text = (
            f"📝 *{test.title}*\n\n"
            f"📚 Fan: {test.subject.name}\n"
            f"❓ Savollar soni: {test.question_count}\n"
            f"⏱ Vaqt: {test.duration_minutes} daqiqa\n"
            f"💰 Narxi: {price_text}\n"
        )

        keyboard = []
        if has_access or test.price == 0:
            text += "\n✅ Sizda bu testga ruxsat bor!"
            keyboard.append([InlineKeyboardButton("🚀 Testni boshlash", callback_data=f'start_test_{test.id}')])
        else:
            text += "\n🔒 Test sotib olinmagan"
            keyboard.append([InlineKeyboardButton("💳 Sotib olish", callback_data=f'buy_{test.id}')])

        keyboard.append([InlineKeyboardButton("⬅️ Orqaga", callback_data=f'subject_{test.subject_id}')])

        await query.edit_message_text(
            text, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard),
        )


async def buy_test(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    test_id = int(query.data.split('_')[1])

    app = get_app(context)
    with app.app_context():
        from app.models import Test
        test = Test.query.get(test_id)
        if not test:
            await query.edit_message_text("❌ Test topilmadi")
            return ConversationHandler.END

        card = os.getenv('TELEGRAM_PAYMENT_CARD', '8600-XXXX-XXXX-XXXX')
        holder = os.getenv('TELEGRAM_CARD_HOLDER', 'ISM FAMILIYA')
        context.user_data['buying_test_id'] = test.id

        await query.edit_message_text(
            f"💳 *To'lov ma'lumotlari*\n\n"
            f"📝 Test: {test.title}\n"
            f"💰 Summa: *{test.price:,} so'm*\n\n"
            f"💳 Karta raqami:\n`{card}`\n"
            f"👤 Karta egasi: {holder}\n\n"
            f"✅ To'lov qilganingizdan so'ng, *chek screenshotini* yuboring.\n"
            f"🚫 Bekor qilish: /cancel",
            parse_mode='Markdown',
        )
        return States.WAITING_SCREENSHOT


async def handle_screenshot(update: Update, context: ContextTypes.DEFAULT_TYPE):
    test_id = context.user_data.get('buying_test_id')
    if not test_id:
        await update.message.reply_text("❌ Xatolik yuz berdi. Qaytadan urinib ko'ring.")
        return ConversationHandler.END

    photo = update.message.photo[-1]
    file_id = photo.file_id

    app = get_app(context)
    with app.app_context():
        from app import db
        from app.models import Test, User, Payment, Notification

        user = User.query.filter_by(telegram_id=update.effective_user.id).first()
        test = Test.query.get(test_id)
        if not user or not test:
            await update.message.reply_text("❌ Xatolik yuz berdi.")
            return ConversationHandler.END

        existing = Payment.query.filter_by(
            user_id=user.id, test_id=test.id, status='pending'
        ).first()
        if existing:
            await update.message.reply_text("⏳ Sizning oldingi to'lov so'rovingiz hali ko'rib chiqilmoqda.")
            return ConversationHandler.END

        payment = Payment(
            user_id=user.id,
            test_id=test.id,
            amount=test.price,
            screenshot_file_id=file_id,
            status='pending',
        )
        db.session.add(payment)

        notification = Notification(
            admin_id=1,
            title='Yangi to\'lov so\'rovi',
            message=f'{user.full_name} — "{test.title}" ({test.price:,} so\'m)',
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
    context.user_data.pop('buying_test_id', None)
    return ConversationHandler.END


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
                text += f"• {p.test.title}\n"
                keyboard.append([InlineKeyboardButton(
                    f"🚀 {p.test.title}",
                    callback_data=f'start_test_{p.test.id}'
                )])
        else:
            text += "📭 Hozircha sotib olingan testlar yo'q.\n"

        if pending:
            text += f"\n⏳ *Kutilmoqda:* {len(pending)} ta to'lov\n"
            for p in pending:
                text += f"• {p.test.title} — {p.amount:,} so'm\n"

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


async def start_test(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    test_id = int(query.data.split('_')[2])

    app = get_app(context)
    with app.app_context():
        from app import db
        from app.models import Test, User, Payment, TestAttempt, Question

        user = User.query.filter_by(telegram_id=update.effective_user.id).first()
        test = Test.query.get(test_id)
        if not user or not test:
            await query.edit_message_text("❌ Xatolik")
            return ConversationHandler.END

        if test.price > 0:
            has_access = Payment.query.filter_by(
                user_id=user.id, test_id=test.id, status='approved'
            ).first() is not None
            if not has_access:
                await query.edit_message_text("🔒 Bu testni sotib olishingiz kerak.")
                return ConversationHandler.END

        questions = Question.query.filter_by(test_id=test.id).order_by(Question.order_num).all()
        if not questions:
            await query.edit_message_text("❌ Bu testda savollar mavjud emas.")
            return ConversationHandler.END

        attempt = TestAttempt(
            user_id=user.id,
            test_id=test.id,
            total_questions=len(questions),
        )
        db.session.add(attempt)
        db.session.commit()

        context.user_data['attempt_id'] = attempt.id
        context.user_data['questions'] = [q.id for q in questions]
        context.user_data['current_q'] = 0
        context.user_data['test_title'] = test.title

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
            f"📝 *{context.user_data['test_title']}*\n"
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
        attempt.finished_at = __import__('datetime').datetime.now(__import__('datetime').timezone.utc)
        db.session.commit()

        text = (
            f"🏁 *Test yakunlandi!*\n\n"
            f"📝 {context.user_data['test_title']}\n\n"
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
        for a in answers:
            emoji = "✅" if a.is_correct else "❌"
            text += f"{emoji} Savol {a.question.order_num}: {a.selected_option}"
            if not a.is_correct:
                text += f" (to'g'ri: {a.question.correct_option})"
            text += "\n"

        keyboard = [
            [InlineKeyboardButton("📝 Boshqa testlar", callback_data='subjects')],
            [InlineKeyboardButton("📋 Mening testlarim", callback_data='my_tests')],
        ]

        await query.edit_message_text(
            text, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard)
        )

    for key in ['attempt_id', 'questions', 'current_q', 'test_title']:
        context.user_data.pop(key, None)


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
            text += f"{status} {a.test.title}\n"
            text += f"   📅 {date} | ✅ {a.correct_answers}/{a.total_questions} | 📊 {a.score:.1f}%\n\n"

        await update.message.reply_text(text, parse_mode='Markdown')


async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data.clear()
    await update.message.reply_text(
        "🚫 Bekor qilindi.\n/start — Bosh menyu",
        parse_mode='Markdown',
    )
    return ConversationHandler.END
