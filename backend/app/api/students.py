from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.deps import require_student
from app.models.models import User, Student, CaptureSession, FaceImage, Attendance
from app.schemas.schemas import StudentDashboardStats, DatasetSummaryResponse, DatasetImageInfo, StudentProfile

router = APIRouter(prefix="/students", tags=["Students"])

@router.get("/dashboard-stats", response_model=StudentDashboardStats)
def get_student_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    student = current_user.student
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student record not found")

    # Face registration status
    completed_session = db.query(CaptureSession).filter(
        CaptureSession.student_id == student.student_id,
        CaptureSession.capture_status == "COMPLETED"
    ).order_by(CaptureSession.created_at.desc()).first()

    reg_status = "COMPLETED" if completed_session else "NOT_STARTED"
    total_imgs = completed_session.total_images if completed_session else 0

    # Attendance statistics
    attendance_records = db.query(Attendance).filter(
        Attendance.student_id == student.student_id
    ).all()

    total_classes = len(attendance_records)
    present_classes = sum(1 for r in attendance_records if r.status == "present")
    attendance_pct = round((present_classes / total_classes * 100.0), 1) if total_classes > 0 else 0.0

    # Recent activity
    recent_activity = []
    if completed_session:
        recent_activity.append({
            "title": "Face Dataset Registered",
            "description": f"Successfully captured and stored 30 images (5 original + 25 augmented)",
            "timestamp": completed_session.completed_at.isoformat() if completed_session.completed_at else completed_session.created_at.isoformat(),
            "type": "success"
        })

    # Add last 3 attendance activities
    sorted_att = sorted(attendance_records, key=lambda x: x.attendance_date, reverse=True)[:3]
    for att in sorted_att:
        recent_activity.append({
            "title": f"Attendance Marked - {att.status.capitalize()}",
            "description": f"Class recorded for date {att.attendance_date.strftime('%d %b %Y')}",
            "timestamp": att.created_at.isoformat() if att.created_at else str(att.attendance_date),
            "type": "info" if att.status == "present" else "warning"
        })

    return {
        "full_name": student.full_name,
        "usn": student.usn,
        "branch": student.branch,
        "semester": student.semester,
        "academic_year": student.academic_year,
        "face_registration_status": reg_status,
        "dataset_completion_status": "Complete (30/30 Images)" if reg_status == "COMPLETED" else "Pending Registration",
        "total_dataset_images": total_imgs,
        "attendance_percentage": attendance_pct,
        "total_classes": total_classes,
        "present_classes": present_classes,
        "recent_activity": recent_activity
    }

@router.get("/my-dataset", response_model=DatasetSummaryResponse)
def get_my_dataset(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """
    Returns student's dataset summary and image metadata.
    Enforces privacy: students can only access their own dataset.
    """
    student = current_user.student
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student record not found")

    session_record = db.query(CaptureSession).filter(
        CaptureSession.student_id == student.student_id,
        CaptureSession.capture_status == "COMPLETED"
    ).order_by(CaptureSession.created_at.desc()).first()

    if not session_record:
        return {
            "session_id": None,
            "capture_status": "NOT_STARTED",
            "total_original_images": 0,
            "total_augmented_images": 0,
            "total_images": 0,
            "completed_at": None,
            "images": []
        }

    images = db.query(FaceImage).filter(
        FaceImage.session_id == session_record.session_id
    ).order_by(FaceImage.image_type.desc(), FaceImage.orientation.asc()).all()

    image_infos = [
        DatasetImageInfo(
            image_id=img.image_id,
            image_type=img.image_type,
            orientation=img.orientation,
            transformation_type=img.transformation_type,
            transformation_parameters=img.transformation_parameters,
            width=img.image_width,
            height=img.image_height,
            created_at=img.created_at
        )
        for img in images
    ]

    return {
        "session_id": session_record.session_id,
        "capture_status": session_record.capture_status,
        "total_original_images": session_record.total_original_images,
        "total_augmented_images": session_record.total_augmented_images,
        "total_images": session_record.total_images,
        "completed_at": session_record.completed_at,
        "images": image_infos
    }

@router.get("/profile", response_model=StudentProfile)
def get_student_profile(
    current_user: User = Depends(require_student)
):
    if not current_user.student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")
    return current_user.student
