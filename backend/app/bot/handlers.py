import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes, ConversationHandler
from app.bot.states import States
from app.database import SessionLocal
from app.config import get_settings

logger = logging.getLogger(__name__)


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


def _start_free_generation(user_id: int, telegram_id: int, subject_id: int, subject_name: str, question_count: int):
    import threading
    from app.models.variant import TestVariant
    from app.services.pdf_service import generate_and_send

    db = get_db()
    try:
        variant = TestVariant(
            user_id=user_id, subject_id=subject_id,
            question_count=question_count, status="pending",
        )
        db.add(variant)
        db.commit()
        db.refresh(variant)
        vid = variant.id
    finally:
        db.close()

    threading.Thread(
        target=generate_and_send,
        args=(vid, telegram_id, subject_name, subject_id, question_count),
        daemon=True,
    ).start()


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
            subj_data = None
            try:
                subject = db.query(Subject).filter(Subject.id == subject_id, Subject.is_active == True).first()
                if subject:
                    subj_data = {
                        'id': subject.id, 'name': subject.name,
                        'is_mandatory': subject.is_mandatory or False,
                        'q_count': subject.mandatory_question_count or 10,
                    }
            finally:
                db.close()

            if subj_data and subj_data['is_mandatory']:
                await update.message.reply_text(
                    f"📚 *{subj_data['name']}* — {subj_data['q_count']} ta savol\n\n"
                    f"✅ Majburiy fan — *bepul!*\n⏳ Test tayyorlanmoqda...",
                    parse_mode='Markdown',
                )
                _start_free_generation(user_id, update.effective_user.id, subj_data['id'], subj_data['name'], subj_data['q_count'])
                context.user_data.clear()
                return ConversationHandler.END

            if subj_data:
                await update.message.reply_text(
                    f"👋 *Salom, {full_name}!*\n"
                    f"Test Market platformasiga xush kelibsiz!\n\n"
                    f"📚 Siz *{subj_data['name']}* fanini tanladingiz.",
                    parse_mode='Markdown',
                )
                context.user_data['subject_id'] = subj_data['id']
                context.user_data['subject_name'] = subj_data['name']

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

        regular = [s for s in subjects if not s.is_mandatory]
        mandatory = [s for s in subjects if s.is_mandatory]

        keyboard = []
        for s in regular:
            icon = s.icon if s.icon and not s.icon.startswith(('<', '/', 'h')) else '📚'
            keyboard.append([InlineKeyboardButton(
                f"{icon} {s.name}",
                callback_data=f'buy_{s.id}'
            )])

        if mandatory:
            for s in mandatory:
                icon = s.icon if s.icon and not s.icon.startswith(('<', '/', 'h')) else '📚'
                keyboard.append([InlineKeyboardButton(
                    f"{icon} {s.name} ✅ Bepul",
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
    from app.models.user import User

    query = update.callback_query
    await query.answer()
    subject_id = int(query.data.split('_')[1])

    db = get_db()
    try:
        subject = db.query(Subject).filter(Subject.id == subject_id).first()
        if not subject:
            await query.edit_message_text("❌ Fan topilmadi")
            return ConversationHandler.END

        if subject.is_mandatory:
            user = db.query(User).filter(User.telegram_id == update.effective_user.id).first()
            user_id = user.id if user else get_or_create_user(update.effective_user)
            q_count = subject.mandatory_question_count or 10
            subj_name = subject.name
            subj_id = subject.id
            await query.edit_message_text(
                f"📚 *{subj_name}* — {q_count} ta savol\n\n"
                f"✅ Majburiy fan — *bepul!*\n⏳ Test tayyorlanmoqda...",
                parse_mode='Markdown',
            )
            _start_free_generation(user_id, update.effective_user.id, subj_id, subj_name, q_count)
            context.user_data.clear()
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
    payment_id = None
    notify_data = None
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

        notify_data = {
            'full_name': user.full_name or 'Noma\'lum',
            'username': user.username or '',
            'telegram_id': user.telegram_id,
            'subject_name': ud['subject_name'],
            'question_count': payment.question_count,
        }

        db.commit()
        db.refresh(payment)
        payment_id = payment.id
        notify_data['payment_id'] = payment_id
        notify_data['created_at'] = payment.created_at.strftime('%d.%m.%Y %H:%M') if payment.created_at else ''
    finally:
        db.close()

    if notify_data and payment_id:
        await _notify_admin(context, notify_data, os.path.join(upload_dir, filename))

    await update.message.reply_text(
        "✅ *Chek qabul qilindi!*\n\n"
        "⏳ Admin tasdiqlagandan so'ng test linki yuboriladi.",
        parse_mode='Markdown',
    )
    context.user_data.clear()
    return ConversationHandler.END


def _escape_html(text: str) -> str:
    return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


async def _notify_admin(context: ContextTypes.DEFAULT_TYPE, data: dict, screenshot_path: str):
    import os
    settings = get_settings()
    admin_chat_id = settings.ADMIN_CHAT_ID

    name = _escape_html(data['full_name'])
    username = _escape_html(data['username'])
    subject = _escape_html(data['subject_name'])

    text = (
        f"💰 <b>Yangi to'lov #{data['payment_id']}</b>\n\n"
        f"👤 <b>Foydalanuvchi:</b> {name}\n"
        f"📱 <b>Username:</b> @{username or '—'}\n"
        f"🆔 <b>Telegram ID:</b> <code>{data['telegram_id']}</code>\n\n"
        f"📚 <b>Fan:</b> {subject}\n"
        f"📝 <b>Savollar:</b> {data['question_count']} ta\n"
        f"📅 <b>Sana:</b> {data['created_at']}\n"
    )

    keyboard = InlineKeyboardMarkup([
        [
            InlineKeyboardButton("✅ Tasdiqlash", callback_data=f"pay_approve_{data['payment_id']}"),
            InlineKeyboardButton("❌ Rad etish", callback_data=f"pay_reject_{data['payment_id']}"),
        ]
    ])

    try:
        if os.path.exists(screenshot_path):
            with open(screenshot_path, 'rb') as photo:
                await context.bot.send_photo(
                    chat_id=admin_chat_id,
                    photo=photo,
                    caption=text,
                    parse_mode='HTML',
                    reply_markup=keyboard,
                )
        else:
            await context.bot.send_message(
                chat_id=admin_chat_id,
                text=text + "\n⚠️ <i>Screenshot topilmadi</i>",
                parse_mode='HTML',
                reply_markup=keyboard,
            )
    except Exception as e:
        logger.error(f"Admin notification error: {e}")
        try:
            await context.bot.send_message(
                chat_id=admin_chat_id,
                text=f"💰 Yangi to'lov #{data['payment_id']}\n{name} — {subject}\nScreenshot yuborishda xatolik.",
                reply_markup=keyboard,
            )
        except Exception:
            logger.error(f"Admin fallback notification also failed")


async def admin_approve_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    from app.services import payment_service

    query = update.callback_query
    await query.answer()

    payment_id = int(query.data.split('_')[2])

    db = get_db()
    try:
        result = payment_service.approve(db, payment_id, admin_id=1, note="Telegram orqali tasdiqlandi", amount=5000)
    finally:
        db.close()

    if not result:
        try:
            if query.message.caption:
                await query.edit_message_caption(
                    caption=query.message.caption + "\n\n⚠️ Bu to'lov allaqachon ko'rib chiqilgan.",
                )
            else:
                await query.edit_message_text(text="⚠️ Bu to'lov allaqachon ko'rib chiqilgan.")
        except Exception:
            pass
        return

    try:
        original = query.message.caption or query.message.text or ""
        new_text = original + "\n\n✅ TASDIQLANDI"
        if query.message.caption:
            await query.edit_message_caption(caption=new_text)
        else:
            await query.edit_message_text(text=new_text)
    except Exception:
        pass


async def admin_reject_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    payment_id = int(query.data.split('_')[2])
    context.user_data['reject_payment_id'] = payment_id

    try:
        original = query.message.caption or query.message.text or ""
        new_text = original + "\n\n✏️ Rad etish sababini yozing:"
        if query.message.caption:
            await query.edit_message_caption(caption=new_text)
        else:
            await query.edit_message_text(text=new_text)
    except Exception:
        await context.bot.send_message(
            chat_id=query.message.chat_id,
            text=f"✏️ To'lov #{payment_id} uchun rad etish sababini yozing:",
        )

    return States.ADMIN_REJECT_REASON


async def admin_reject_reason(update: Update, context: ContextTypes.DEFAULT_TYPE):
    from app.models.user import User
    from app.services import payment_service
    from app.models.payment import Payment

    reason = update.message.text.strip()
    payment_id = context.user_data.get('reject_payment_id')

    if not payment_id:
        await update.message.reply_text("❌ To'lov topilmadi.")
        return ConversationHandler.END

    db = get_db()
    try:
        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment or payment.status != "pending":
            await update.message.reply_text("⚠️ Bu to'lov allaqachon ko'rib chiqilgan.")
            context.user_data.pop('reject_payment_id', None)
            return ConversationHandler.END

        user = payment.user
        user_telegram_id = user.telegram_id if user else None
        user_full_name = user.full_name if user else "Foydalanuvchi"
        subject_name = payment.subject.name if payment.subject else "Test"

        result = payment_service.reject(db, payment_id, admin_id=1, note=reason)
    finally:
        db.close()

    if result:
        await update.message.reply_text(
            f"❌ *To'lov #{payment_id} rad etildi.*\n"
            f"📝 Sabab: {reason}",
            parse_mode='Markdown',
        )

        if user_telegram_id:
            try:
                await context.bot.send_message(
                    chat_id=user_telegram_id,
                    text=(
                        f"❌ *To'lovingiz rad etildi*\n\n"
                        f"📚 *Fan:* {subject_name}\n"
                        f"📝 *Sabab:* {reason}\n\n"
                        f"Agar xatolik bo'lsa, qaytadan to'lov qiling.\n"
                        f"📚 /fanlar — Yangi test"
                    ),
                    parse_mode='Markdown',
                )
            except Exception as e:
                print(f"User notification error: {e}")
    else:
        await update.message.reply_text("⚠️ Xatolik yuz berdi.")

    context.user_data.pop('reject_payment_id', None)
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
