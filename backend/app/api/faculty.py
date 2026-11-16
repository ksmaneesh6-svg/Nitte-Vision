import csv
import io
from datetime import date
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.deps import require_faculty
from app.models.models import User, Faculty, Student, ClassModel, ClassStudent, FacultyClass, Attendance, CaptureSession
from app.schemas.schemas import FacultyDashboardStats, ClassInfo, AttendanceSubmit

router = APIRouter(prefix="/faculty", tags=["Faculty"])

@router.get("/dashboard-stats", response_model=FacultyDashboardStats)
def get_faculty_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty)
):
    faculty = current_user.faculty
    faculty_name = faculty.full_name if faculty else "Faculty Member"
    dept = faculty.department if faculty else "Engineering"

    # Assigned or available classes
    classes = db.query(ClassModel).all()
    classes_count = len(classes)

    # Total enrolled students
    total_students = db.query(Student).count()

    # Today's attendance status
    today = date.today()
    today_records = db.query(Attendance).filter(Attendance.attendance_date == today).count()

    # Overall attendance average
    all_attendance = db.query(Attendance).all()
    if all_attendance:
        p_count = sum(1 for a in all_attendance if a.status == "present")
        avg_pct = round((p_count / len(all_attendance) * 100.0), 1)
    else:
        avg_pct = 0.0

    return {
        "faculty_name": faculty_name,
        "department": dept,
        "assigned_classes_count": classes_count,
        "total_students_enrolled": total_students,
        "today_attendance_marked": today_records > 0,
        "average_attendance_percentage": avg_pct
    }

@router.get("/classes", response_model=List[ClassInfo])
def get_faculty_classes(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty)
):
    classes = db.query(ClassModel).all()
    results = []
    for c in classes:
        student_count = db.query(ClassStudent).filter(ClassStudent.class_id == c.class_id).count()
        results.append(ClassInfo(
            class_id=c.class_id,
            class_name=c.class_name,
            branch=c.branch,
            semester=c.semester,
            academic_year=c.academic_year,
            enrolled_count=student_count
        ))
    return results

@router.get("/classes/{class_id}/students")
def get_students_for_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty)
):
    class_obj = db.query(ClassModel).filter(ClassModel.class_id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")

    enrollments = db.query(ClassStudent).filter(ClassStudent.class_id == class_id).all()
    student_ids = [e.student_id for e in enrollments]

    students = db.query(Student).filter(Student.student_id.in_(student_ids)).all()

    student_data = []
    for s in students:
        # Check dataset status
        completed_session = db.query(CaptureSession).filter(
            CaptureSession.student_id == s.student_id,
            CaptureSession.capture_status == "COMPLETED"
        ).first()

        # Check attendance stats in this class
        class_att = db.query(Attendance).filter(
            Attendance.student_id == s.student_id,
            Attendance.class_id == class_id
        ).all()
        total_days = len(class_att)
        present_days = sum(1 for a in class_att if a.status == "present")
        pct = round((present_days / total_days * 100.0), 1) if total_days > 0 else 0.0

        student_data.append({
            "student_id": s.student_id,
            "full_name": s.full_name,
            "usn": s.usn,
            "branch": s.branch,
            "semester": s.semester,
            "has_face_dataset": completed_session is not None,
            "total_classes": total_days,
            "present_classes": present_days,
            "attendance_percentage": pct,
            "attendance_status": "Eligible (>=75%)" if pct >= 75 or total_days == 0 else "Shortage (<75%)"
        })

    return {
        "class_id": class_obj.class_id,
        "class_name": class_obj.class_name,
        "branch": class_obj.branch,
        "semester": class_obj.semester,
        "students": student_data
    }

@router.post("/attendance/mark")
def mark_class_attendance(
    payload: AttendanceSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty)
):
    class_obj = db.query(ClassModel).filter(ClassModel.class_id == payload.class_id).first()
    if not class_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")

    saved_count = 0
    for item in payload.records:
        # Check if record for this student on this date already exists
        existing = db.query(Attendance).filter(
            Attendance.student_id == item.student_id,
            Attendance.class_id == payload.class_id,
            Attendance.attendance_date == payload.attendance_date
        ).first()

        if existing:
            existing.status = item.status
            existing.marked_by = current_user.user_id
        else:
            new_record = Attendance(
                student_id=item.student_id,
                class_id=payload.class_id,
                attendance_date=payload.attendance_date,
                status=item.status,
                marked_by=current_user.user_id
            )
            db.add(new_record)
        saved_count += 1

    db.commit()
    return {"message": f"Successfully updated attendance for {saved_count} students on {payload.attendance_date}"}

@router.get("/attendance/export/{class_id}")
def export_class_attendance_csv(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty)
):
    class_obj = db.query(ClassModel).filter(ClassModel.class_id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")

    enrollments = db.query(ClassStudent).filter(ClassStudent.class_id == class_id).all()
    student_ids = [e.student_id for e in enrollments]
    students = db.query(Student).filter(Student.student_id.in_(student_ids)).order_by(Student.usn.asc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "USN", "Student Name", "Branch", "Semester", "Face Dataset Status",
        "Total Sessions", "Present Days", "Absent Days", "Attendance %", "Eligibility"
    ])

    for s in students:
        has_face = db.query(CaptureSession).filter(
            CaptureSession.student_id == s.student_id,
            CaptureSession.capture_status == "COMPLETED"
        ).first() is not None

        records = db.query(Attendance).filter(
            Attendance.student_id == s.student_id,
            Attendance.class_id == class_id
        ).all()

        tot = len(records)
        pres = sum(1 for r in records if r.status == "present")
        absent = tot - pres
        pct = round((pres / tot * 100.0), 1) if tot > 0 else 0.0
        eligibility = "Eligible" if pct >= 75 or tot == 0 else "Shortage"

        writer.writerow([
            s.usn, s.full_name, s.branch, s.semester,
            "Completed" if has_face else "Pending",
            tot, pres, absent, f"{pct}%", eligibility
        ])

    csv_data = output.getvalue()
    filename = f"NitteVision_Attendance_{class_obj.class_name.replace(' ', '_')}_{date.today().isoformat()}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
