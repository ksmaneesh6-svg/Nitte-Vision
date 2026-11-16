import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "NitteVision"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "nittevision"
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        # PyMySQL connection string
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"

    # Security
    JWT_SECRET_KEY: str = "nittevision_super_secret_jwt_key_2026_change_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Default Admin Seed
    ADMIN_FULL_NAME: str = "System Administrator"
    ADMIN_EMAIL: str = "admin@nitte.edu.in"
    ADMIN_PASSWORD: str = "Admin@Nitte2026"
    ADMIN_DEPARTMENT: str = "AIML"
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"

    @property
    def CORS_ORIGINS_LIST(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "allow"

settings = Settings()
