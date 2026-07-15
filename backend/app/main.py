import sys
import os

# Ensure backend folder is in sys.path when starting uvicorn from project root
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.db.database import engine, Base
from app.api.endpoints import interactions, hcps, chat, followups, analytics, products

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database schemas on startup
    try:
        Base.metadata.create_all(bind=engine)
        print("[Database] SQLAlchemy tables initialized successfully.")
    except Exception as e:
        print(f"[Database] Error initializing tables: {e}")
    yield
    print("[Database] Shutdown complete.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Veeva CRM / Salesforce Health Cloud grade AI-First CRM HCP Module powered by LangGraph & Groq API.",
    lifespan=lifespan
)

# CORS Middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Router Controllers
api_prefix = settings.API_V1_STR
app.include_router(interactions.router, prefix=api_prefix, tags=["Interactions"])
app.include_router(hcps.router, prefix=api_prefix, tags=["HCPs"])
app.include_router(chat.router, prefix=api_prefix, tags=["AI Conversational Agent"])
app.include_router(followups.router, prefix=api_prefix, tags=["Follow-up Strategies"])
app.include_router(analytics.router, prefix=api_prefix, tags=["Analytics & KPIs"])
app.include_router(products.router, prefix=api_prefix, tags=["Product Portfolio"])

@app.get("/", tags=["Health"])
@app.get("/api/v1/status", tags=["Health"])
def health_check():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "ai_engine": "LangGraph Active (`gemma2-9b-it` & `llama-3.3-70b-versatile`)",
        "database": "PostgreSQL / ORM Connected"
    }
