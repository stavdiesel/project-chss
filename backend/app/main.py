from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.db import Base, engine
from app.routers import auth, sessions, bookings, subscriptions, clients, refs, analytics, payments, notifications, leads, tasks, waitlist, settings

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Fitness CHS MVP")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router, prefix="/api/v1")
app.include_router(sessions.router, prefix="/api/v1")
app.include_router(bookings.router, prefix="/api/v1")
app.include_router(subscriptions.router, prefix="/api/v1")
app.include_router(clients.router, prefix="/api/v1")
app.include_router(refs.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(leads.router, prefix="/api/v1")
app.include_router(tasks.router, prefix="/api/v1")
app.include_router(waitlist.router, prefix="/api/v1")
app.include_router(settings.router, prefix="/api/v1")

@app.get("/health")
def health():
    return {"ok": True}