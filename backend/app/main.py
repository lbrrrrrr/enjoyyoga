from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import classes, teachers, yoga_types, registrations

app = FastAPI(title="enjoyyoga API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(classes.router)
app.include_router(teachers.router)
app.include_router(yoga_types.router)
app.include_router(registrations.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
