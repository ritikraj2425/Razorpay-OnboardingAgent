from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import admin_routes, merchant_routes, recheck_routes, review_routes
from app.db.session import Base, engine
import app.models  # noqa: F401
from app.seed.seed_merchants import seed_database

Base.metadata.create_all(bind=engine)
seed_database()

app = FastAPI(title="SentinelPay API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(merchant_routes.router, prefix="/api/merchants", tags=["merchants"])
app.include_router(admin_routes.router, prefix="/api/admin", tags=["admin"])
app.include_router(recheck_routes.router, prefix="/api/rechecks", tags=["rechecks"])
app.include_router(review_routes.router, prefix="/api/reviews", tags=["reviews"])


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "sentinelpay"}
