from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int
    full_name: str
    email: str

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None

# User Login & Registration
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class StudentRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    usn: str = Field(..., min_length=4, max_length=20)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    branch: str = Field(..., pattern="^(AIML|CSE|ISE|ECE|ME|CE|EEE)$")
    semester: int = Field(..., ge=1, le=8)
    consent_given: bool = True

class FacultyCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    department: str

# Responses
class StudentProfile(BaseModel):
    student_id: int
    user_id: int
    full_name: str
    usn: str
    email: str
    branch: str
    semester: int
    academic_year: str
    consent_given: bool
    created_at: datetime

    class Config:
        from_attributes = True

class FacultyProfile(BaseModel):
    faculty_id: int
    user_id: int
    full_name: str
    email: str
    department: str
    created_at: datetime

    class Config:
        from_attributes = True

class UserProfile(BaseModel):
    user_id: int
    email: str
    role: str
    student: Optional[StudentProfile] = None
    faculty: Optional[FacultyProfile] = None

    class Config:
        from_attributes = True

# Face Registration & Validation
class ValidationResult(BaseModel):
    is_valid: bool
    message: str
    face_count: int
    bounding_box: Optional[Dict[str, int]] = None
    confidence: Optional[float] = None
    landmarks: Optional[Dict[str, Any]] = None
    pose_metrics: Optional[Dict[str, Any]] = None

class SingleCaptureSubmission(BaseModel):
    orientation: str = Field(..., pattern="^(forward|left|right|up|down)$")
    image_base64: str

class DatasetSubmission(BaseModel):
    captures: List[SingleCaptureSubmission]

class DatasetImageInfo(BaseModel):
    image_id: int
    image_type: str
    orientation: str
    transformation_type: Optional[str] = None
    transformation_parameters: Optional[str] = None
    width: int
    height: int
    created_at: datetime

    class Config:
        from_attributes = True

class DatasetSummaryResponse(BaseModel):
    session_id: Optional[int] = None
    capture_status: str
    total_original_images: int
    total_augmented_images: int
    total_images: int
    completed_at: Optional[datetime] = None
    images: List[DatasetImageInfo] = []

# Dashboards
class StudentDashboardStats(BaseModel):
    full_name: str
    usn: str
    branch: str
    semester: int
    academic_year: str
    face_registration_status: str  # "COMPLETED", "IN_PROGRESS", "NOT_STARTED"
    dataset_completion_status: str
    total_dataset_images: int
    attendance_percentage: float
    total_classes: int
    present_classes: int
    recent_activity: List[Dict[str, Any]] = []

class AdminDashboardStats(BaseModel):
    total_students: int
    total_faculty: int
    registered_face_datasets: int
    pending_face_registrations: int
    total_attendance_records: int
    average_attendance: float
    branch_distribution: Dict[str, int] = {}

class FacultyDashboardStats(BaseModel):
    faculty_name: str
    department: str
    assigned_classes_count: int
    total_students_enrolled: int
    today_attendance_marked: bool
    average_attendance_percentage: float

# Attendance
class AttendanceMarkItem(BaseModel):
    student_id: int
    status: str = Field(..., pattern="^(present|absent)$")

class AttendanceSubmit(BaseModel):
    class_id: int
    attendance_date: date
    records: List[AttendanceMarkItem]

class ClassInfo(BaseModel):
    class_id: int
    class_name: str
    branch: str
    semester: int
    academic_year: str
    enrolled_count: int = 0

    class Config:
        from_attributes = True
