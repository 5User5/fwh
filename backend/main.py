import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api import wechat, admin
from app.core.config import settings
from app.core.database import engine, Base
from app import models

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(title="SOLO Auto Model 微信服务号", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    logger.info("SOLO Auto Model WeChat Service started successfully")


app.include_router(wechat.router, prefix="/wechat", tags=["wechat"])
app.include_router(admin.router)


@app.get("/")
async def root():
    return {"message": "Welcome to SOLO Auto Model WeChat Service!"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
