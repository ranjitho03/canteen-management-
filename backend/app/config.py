import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
load_dotenv()

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./canteen.db"
    SECRET_KEY: str = "supersecretkey"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    FRONTEND_URL: str = "http://localhost:5173"
    ADMIN_USERNAME: str = "owner"
    ADMIN_EMAIL: str = "owner@gmail.com"
    ADMIN_PASSWORD: str = "owner123"
    ADMIN_GMAILS: str = ""
    GOOGLE_CLIENT_ID: str = ""



settings = Settings()