from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import router
from sqlalchemy import  text
from app.db.session import engine
from fastapi.staticfiles import StaticFiles


app = FastAPI(
    title="ZURI",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"

)

app.include_router(
    router,
    prefix="/api/v1"
)

@app.get("/")
async def root():
    return {
        "message": "ZURI-AI is running"
    }

@app.get("/test-db")
def test_database():
    with engine.connect() as connection:
        result = connection.execute(
            text("SELECT 1")
        )

        return {
            "database": "connected",
            "result": result.scalar()
        }

