from fastapi import APIRouter
from app.controllers import auth, admins, subjects, topics, payments, variants, stats, users, audit, uploads, quiz, user_auth, materials, ai, attempts, chat

api_router = APIRouter(prefix="/api")

api_router.include_router(auth.router)
api_router.include_router(admins.router)
api_router.include_router(subjects.router)
api_router.include_router(topics.router)
api_router.include_router(payments.router)
api_router.include_router(variants.router)
api_router.include_router(stats.router)
api_router.include_router(users.router)
api_router.include_router(audit.router)
api_router.include_router(uploads.router)
api_router.include_router(quiz.router)
api_router.include_router(user_auth.router)
api_router.include_router(materials.router)
api_router.include_router(ai.router)
api_router.include_router(attempts.router)
api_router.include_router(chat.router)
