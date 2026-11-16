import csv
import io
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.deps import require_admin
from app.models.models import User, Faculty, Student, ClassModel, CaptureSession, Attendance, FaceImage
from app.schemas.schemas import AdminDashboardStats, FacultyCreate, ClassInfo
from app.core.security import get_password_hash

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/dashboard-stats", response_model=AdminDashboardStats)
def get_admin_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    total_students = db.query(Student).count()
    total_faculty = db.query(Faculty).count()
    
    registered_datasets = db.query(CaptureSession).filter(
        CaptureSession.capture_status == "COMPLETED"
    ).count()
    pending_datasets = max(0, total_students - registered_datasets)

    total_attendance = db.query(Attendance).count()
    if total_attendance > 0:
        present_count = db.query(Attendance).filter(Attendance.status == "present").count()
        avg_attendance = round((present_count / total_attendance * 100.0), 1)
    else:
        avg_attendance = 0.0

    # Branch distribution
    branch_counts = {}
    for branch in ["AIML", "CSE", "ISE", "ECE", "ME", "CE", "EEE"]:
        count = db.query(Student).filter(Student.branch == branch).count()
        branch_counts[branch] = count

    return {
        "total_students": total_students,
        "total_faculty": total_faculty,
        "registered_face_datasets": registered_datasets,
        "pending_face_registrations": pending_datasets,
        "total_attendance_records": total_attendance,
        "average_attendance": avg_attendance,
        "branch_distribution": branch_counts
    }

@router.get("/students")
def list_students(
    search: Optional[str] = None,
    branch: Optional[str] = None,
    semester: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    query = db.query(Student)
    if branch:
        query = query.filter(Student.branch == branch.upper())
    if semester:
        query = query.filter(Student.semester == semester)
    if search:
        s_term = f"%{search.strip()}%"
        query = query.filter((Student.full_name.ilike(s_term)) | (Student.usn.ilike(s_term)) | (Student.email.ilike(s_term)))

    students = query.order_by(Student.usn.asc()).all()

    student_list = []
    for s in students:
        session_rec = db.query(CaptureSession).filter(
            CaptureSession.student_id == s.student_id,
            CaptureSession.capture_status == "COMPLETED"
        ).first()

        student_list.append({
            "student_id": s.student_id,
            "full_name": s.full_name,
            "usn": s.usn,
            "email": s.email,
            "branch": s.branch,
            "semester": s.semester,
            "academic_year": s.academic_year,
            "dataset_status": "COMPLETED" if session_rec else "PENDING",
            "total_images": session_rec.total_images if session_rec else 0,
            "registered_at": s.created_at
        })

    return student_list

@router.get("/datasets")
def list_all_datasets(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    sessions = db.query(CaptureSession).join(Student).order_by(CaptureSession.created_at.desc()).all()
    results = []
    for sess in sessions:
        student = sess.student
        results.append({
            "session_id": sess.session_id,
            "student_id": student.student_id,
            "student_name": student.full_name,
            "usn": student.usn,
            "branch": student.branch,
            "semester": student.semester,
            "capture_status": sess.capture_status,
            "total_original_images": sess.total_original_images,
            "total_augmented_images": sess.total_augmented_images,
            "total_images": sess.total_images,
            "created_at": sess.created_at,
            "completed_at": sess.completed_at
        })
    return results

@router.get("/faculty")
def list_faculty_members(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    faculty_list = db.query(Faculty).all()
    return [
        {
            "faculty_id": f.faculty_id,
            "full_name": f.full_name,
            "email": f.email,
            "department": f.department,
            "created_at": f.created_at
        }
        for f in faculty_list
    ]

@router.post("/faculty", status_code=status.HTTP_201_CREATED)
def create_faculty_member(
    payload: FacultyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    existing = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered")

    user = User(
        email=payload.email.strip().lower(),
        password_hash=get_password_hash(payload.password),
        role="faculty",
        is_active=True
    )
    db.add(user)
    db.flush()

    faculty = Faculty(
        user_id=user.user_id,
        full_name=payload.full_name.strip(),
        email=user.email,
        department=payload.department.strip()
    )
    db.add(faculty)
    db.commit()

    return {"message": "Faculty account created successfully", "faculty_id": faculty.faculty_id}

@router.get("/export-audit-csv")
def export_dataset_audit_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    students = db.query(Student).order_by(Student.usn.asc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Student ID", "USN", "Full Name", "Email", "Branch", "Semester",
        "Academic Year", "Face Dataset Status", "Original Images", "Augmented Images", "Total Images", "Completed At"
    ])

    for s in students:
        session_rec = db.query(CaptureSession).filter(
            CaptureSession.student_id == s.student_id,
            CaptureSession.capture_status == "COMPLETED"
        ).first()

        writer.writerow([
            s.student_id,
            s.usn,
            s.full_name,
            s.email,
            s.branch,
            s.semester,
            s.academic_year,
            "COMPLETED" if session_rec else "PENDING",
            session_rec.total_original_images if session_rec else 0,
            session_rec.total_augmented_images if session_rec else 0,
            session_rec.total_images if session_rec else 0,
            session_rec.completed_at.isoformat() if session_rec and session_rec.completed_at else "N/A"
        ])

    csv_data = output.getvalue()
    filename = f"NitteVision_Dataset_Audit_{date.today().isoformat()}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
