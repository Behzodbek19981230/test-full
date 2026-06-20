import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import engine, Base, SessionLocal
from app.controllers import api_router
from app.services.auth_service import ensure_default_admin
import app.models  # noqa: F401 — register all models


def create_app() -> FastAPI:
    settings = get_settings()

    application = FastAPI(title="TestFull API", docs_url="/api/docs", redoc_url=None)

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(api_router)

    @application.on_event("startup")
    def startup():
        Base.metadata.create_all(bind=engine)
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

        db = SessionLocal()
        try:
            ensure_default_admin(db, settings.ADMIN_USERNAME, settings.ADMIN_PASSWORD)
        finally:
            db.close()

    return application
