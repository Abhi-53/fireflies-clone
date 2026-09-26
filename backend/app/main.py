import logging
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.models import *  # Ensure all models are loaded
from app.db.seed import seed_if_empty
from app.utils.exceptions import AppException
from app.routers import (
    meetings_router,
    transcripts_router,
    summaries_router,
    action_items_router,
    search_router,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("fireflies-api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and seed initial fixtures if DB is empty
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)

    logger.info("Checking seed data status...")
    db = SessionLocal()
    try:
        seed_if_empty(db)
    except Exception as e:
        logger.error(f"Error during seeding: {e}", exc_info=True)
    finally:
        db.close()

    yield
    # Shutdown
    logger.info("Application shutting down...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Backend API for Meeting Notes & Transcription Platform (Fireflies Clone)",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Custom Exception Handlers matching blueprint standard error shape
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
            }
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_messages = []
    for err in exc.errors():
        loc = " -> ".join(str(l) for l in err.get("loc", []))
        msg = err.get("msg", "Invalid value")
        error_messages.append(f"{loc}: {msg}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "; ".join(error_messages) if error_messages else "Request validation failed.",
            }
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred. Please try again later.",
            }
        },
    )


# Health check endpoint
@app.get("/health", tags=["system"])
def health_check():
    return {"status": "ok", "service": settings.PROJECT_NAME, "version": "1.0.0"}


# Mount API routers under /api/v1
api_v1_prefix = settings.API_V1_STR
app.include_router(meetings_router, prefix=api_v1_prefix)
app.include_router(transcripts_router, prefix=api_v1_prefix)
app.include_router(summaries_router, prefix=api_v1_prefix)
app.include_router(action_items_router, prefix=api_v1_prefix)
app.include_router(search_router, prefix=api_v1_prefix)

# Mount media static directory if present
media_dir = Path(__file__).parent.parent / "static"
media_dir.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=str(media_dir)), name="media")


@app.get("/", tags=["system"])
def root():
    return {
        "message": "Welcome to Fireflies Clone API",
        "documentation": "/docs",
        "api_v1": api_v1_prefix,
    }
