from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Date, ForeignKey, Boolean, Enum
)
from sqlalchemy.dialects.mysql import LONGBLOB
from sqlalchemy.orm import relationship
from app.database.session import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(191), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum("student", "faculty", "admin", name="user_roles"), nullable=False, default="student")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="user", uselist=False, cascade="all, delete-orphan")
    faculty = relationship("Faculty", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Student(Base):
    __tablename__ = "students"

    student_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    usn = Column(String(20), unique=True, index=True, nullable=False)
    email = Column(String(191), unique=True, index=True, nullable=False)
    branch = Column(String(50), nullable=False)
    semester = Column(Integer, nullable=False)
    academic_year = Column(String(50), nullable=False)
    consent_given = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="student")
    sessions = relationship("CaptureSession", back_populates="student", cascade="all, delete-orphan")
    face_images = relationship("FaceImage", back_populates="student", cascade="all, delete-orphan")
    class_enrollments = relationship("ClassStudent", back_populates="student", cascade="all, delete-orphan")
    attendance_records = relationship("Attendance", back_populates="student", cascade="all, delete-orphan")


class Faculty(Base):
    __tablename__ = "faculty"

    faculty_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    email = Column(String(191), unique=True, index=True, nullable=False)
    department = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="faculty")
    assigned_classes = relationship("FacultyClass", back_populates="faculty", cascade="all, delete-orphan")


class ClassModel(Base):
    __tablename__ = "classes"

    class_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    class_name = Column(String(100), nullable=False)
    branch = Column(String(50), nullable=False)
    semester = Column(Integer, nullable=False)
    academic_year = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    students = relationship("ClassStudent", back_populates="class_obj", cascade="all, delete-orphan")
    faculty_assignments = relationship("FacultyClass", back_populates="class_obj", cascade="all, delete-orphan")
    attendance_records = relationship("Attendance", back_populates="class_obj", cascade="all, delete-orphan")


class ClassStudent(Base):
    __tablename__ = "class_students"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    class_id = Column(Integer, ForeignKey("classes.class_id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.student_id", ondelete="CASCADE"), nullable=False)

    class_obj = relationship("ClassModel", back_populates="students")
    student = relationship("Student", back_populates="class_enrollments")


class FacultyClass(Base):
    __tablename__ = "faculty_classes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    faculty_id = Column(Integer, ForeignKey("faculty.faculty_id", ondelete="CASCADE"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.class_id", ondelete="CASCADE"), nullable=False)

    faculty = relationship("Faculty", back_populates="assigned_classes")
    class_obj = relationship("ClassModel", back_populates="faculty_assignments")


class CaptureSession(Base):
    __tablename__ = "capture_sessions"

    session_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.student_id", ondelete="CASCADE"), nullable=False)
    capture_status = Column(Enum("IN_PROGRESS", "COMPLETED", "FAILED", name="session_statuses"), default="IN_PROGRESS", nullable=False)
    total_original_images = Column(Integer, default=0, nullable=False)
    total_augmented_images = Column(Integer, default=0, nullable=False)
    total_images = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    student = relationship("Student", back_populates="sessions")
    face_images = relationship("FaceImage", back_populates="session", cascade="all, delete-orphan")


class FaceImage(Base):
    __tablename__ = "face_images"

    image_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.student_id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(Integer, ForeignKey("capture_sessions.session_id", ondelete="CASCADE"), nullable=False, index=True)
    image_type = Column(Enum("original", "augmented", name="image_types"), nullable=False)
    original_image_id = Column(Integer, ForeignKey("face_images.image_id", ondelete="SET NULL"), nullable=True)
    orientation = Column(Enum("forward", "left", "right", "up", "down", name="orientations"), nullable=False)
    transformation_type = Column(String(50), nullable=True)
    transformation_parameters = Column(Text, nullable=True)
    image_data = Column(LONGBLOB, nullable=False)
    image_format = Column(String(20), default="image/jpeg", nullable=False)
    image_width = Column(Integer, nullable=False)
    image_height = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="face_images")
    session = relationship("CaptureSession", back_populates="face_images")
    augmented_copies = relationship("FaceImage", backref="original_image", remote_side=[image_id])


class Attendance(Base):
    __tablename__ = "attendance"

    attendance_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.student_id", ondelete="CASCADE"), nullable=False, index=True)
    class_id = Column(Integer, ForeignKey("classes.class_id", ondelete="CASCADE"), nullable=False, index=True)
    attendance_date = Column(Date, nullable=False, index=True)
    status = Column(Enum("present", "absent", name="attendance_statuses"), nullable=False)
    marked_by = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="attendance_records")
    class_obj = relationship("ClassModel", back_populates="attendance_records")
