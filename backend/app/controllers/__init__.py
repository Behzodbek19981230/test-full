from fastapi import APIRouter
from app.controllers import auth, subjects, topics, payments, stats, users, audit, uploads, quiz, user_auth

api_router = APIRouter(prefix="/api")

api_router.include_router(auth.router)
api_router.include_router(subjects.router)
api_router.include_router(topics.router)
api_router.include_router(payments.router)
api_router.include_router(stats.router)
api_router.include_router(users.router)
api_router.include_router(audit.router)
api_router.include_router(uploads.router)
api_router.include_router(quiz.router)
api_router.include_router(user_auth.router)
