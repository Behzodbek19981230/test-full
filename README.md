# Test Market — DTM va Attestatsiyaga Tayyorlanish Platformasi

Abituriyent, o'qituvchi va o'quvchilar uchun DTM va attestatsiyaga tayyorlanish uchun sinov va blok testlar platformasi.

## Arxitektura

| Komponent | Texnologiya | Port |
|-----------|-------------|------|
| Backend API | Python Flask + PostgreSQL | 5000 |
| Telegram Bot | python-telegram-bot | — |
| Landing Page | Next.js | 3000 |
| Admin Panel | React + Vite | 5173 |

## Tezkor Boshlash

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt

# .env faylini sozlang
copy .env.example .env
# .env ichida TELEGRAM_BOT_TOKEN va boshqa sozlamalarni kiriting

# PostgreSQL bazani yarating
createdb test_market

# Ishga tushiring
python run.py
```

### 2. Landing Page (Next.js)

```bash
cd frontend
npm install
npm run dev
```

### 3. Admin Panel (React)

```bash
cd admin
npm install
npm run dev
```

### 4. Docker bilan

```bash
# .env faylini loyiha ildizida yarating
docker-compose up --build
```

## Asosiy Oqim

1. Foydalanuvchi Landing sahifaga kiradi, fanlar va narxlarni ko'radi
2. "Sotib olish" tugmasi Telegram botga yo'naltiradi
3. Bot plastik karta raqamini yuboradi
4. Foydalanuvchi to'lov qilib, screenshot yuboradi
5. Admin panelda to'lov screenshotini ko'rib tasdiqlaydi
6. Foydalanuvchi botda testni ishlaydi
7. Javoblar real-vaqtda tekshiriladi va natija ko'rsatiladi

## Admin Panel

- **Dashboard**: Real-time statistikalar, grafiklar
- **Fanlar**: CRUD operatsiyalar
- **Testlar**: Savollar bilan test yaratish/tahrirlash
- **To'lovlar**: Screenshot ko'rish, tasdiqlash/rad etish
- **Foydalanuvchilar**: Qidirish, bloklash
- **Bildirishnomalar**: Real-time notifikatsiyalar
- **Audit Log**: Barcha amallar tarixi

Admin login: `admin` / `admin123` (birinchi ishga tushirishda)

## Telegram Bot Buyruqlari

- `/start` — Botni boshlash
- `/fanlar` — Fanlar ro'yxati
- `/testlarim` — Sotib olingan testlar
- `/natijalar` — Test natijalari
- `/help` — Yordam
- `/cancel` — Jarayonni bekor qilish

## Muhit O'zgaruvchilari

| O'zgaruvchi | Tavsif |
|-------------|--------|
| `DATABASE_URL` | PostgreSQL ulanish |
| `SECRET_KEY` | Flask secret key |
| `JWT_SECRET_KEY` | JWT token uchun secret |
| `TELEGRAM_BOT_TOKEN` | Telegram bot tokeni |
| `TELEGRAM_PAYMENT_CARD` | To'lov kartasi raqami |
| `TELEGRAM_CARD_HOLDER` | Karta egasi ismi |
