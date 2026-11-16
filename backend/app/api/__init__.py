from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.students import router as students_router
from app.api.face_registration import router as face_reg_router
from app.api.faculty import router as faculty_router
from app.api.admin import router as admin_router
from app.api.images import router as images_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(students_router)
api_router.include_router(face_reg_router)
api_router.include_router(faculty_router)
api_router.include_router(admin_router)
api_router.include_router(images_router)
