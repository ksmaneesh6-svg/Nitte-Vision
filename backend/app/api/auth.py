from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import User, Student, Faculty, ClassModel, ClassStudent
from app.schemas.schemas import StudentRegister, UserLogin, Token, UserProfile, StudentProfile, FacultyProfile
from app.core.security import verify_password, get_password_hash, create_access_token
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

def get_academic_year(semester: int) -> str:
    if semester in (1, 2):
        return "1st Year"
    elif semester in (3, 4):
        return "2nd Year"
    elif semester in (5, 6):
        return "3rd Year"
    else:
        return "4th Year"

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_student(reg_data: StudentRegister, db: Session = Depends(get_db)):
    # 1. Check duplicate email in users
    existing_user = db.query(User).filter(User.email == reg_data.email.strip().lower()).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="An account with this email address already exists")

    # 2. Check duplicate USN in students
    normalized_usn = reg_data.usn.strip().upper()
    existing_usn = db.query(Student).filter(Student.usn == normalized_usn).first()
    if existing_usn:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A student with this USN already exists")

    academic_yr = get_academic_year(reg_data.semester)

    # 3. Create User record
    hashed_pwd = get_password_hash(reg_data.password)
    new_user = User(
        email=reg_data.email.strip().lower(),
        password_hash=hashed_pwd,
        role="student",
        is_active=True,
    )
    db.add(new_user)
    db.flush()

    # 4. Create Student record
    new_student = Student(
        user_id=new_user.user_id,
        full_name=reg_data.full_name.strip(),
        usn=normalized_usn,
        email=new_user.email,
        branch=reg_data.branch.strip().upper(),
        semester=reg_data.semester,
        academic_year=academic_yr,
        consent_given=reg_data.consent_given,
    )
    db.add(new_student)
    db.flush()

    # 5. Automatically link to appropriate Class or create default class for branch & semester
    default_class_name = f"{new_student.branch} - Sem {new_student.semester}"
    class_obj = db.query(ClassModel).filter(
        ClassModel.branch == new_student.branch,
        ClassModel.semester == new_student.semester
    ).first()
    if not class_obj:
        class_obj = ClassModel(
            class_name=default_class_name,
            branch=new_student.branch,
            semester=new_student.semester,
            academic_year=academic_yr,
        )
        db.add(class_obj)
        db.flush()

    enrollment = ClassStudent(class_id=class_obj.class_id, student_id=new_student.student_id)
    db.add(enrollment)

    db.commit()
    db.refresh(new_user)
    db.refresh(new_student)

    # 6. Generate access token
    access_token = create_access_token(subject=new_user.user_id, role=new_user.role)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": new_user.role,
        "user_id": new_user.user_id,
        "full_name": new_student.full_name,
        "email": new_user.email,
    }

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email.strip().lower()).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account is disabled")

    # Retrieve display name
    full_name = "User"
    if user.role == "student" and user.student:
        full_name = user.student.full_name
    elif user.role == "faculty" and user.faculty:
        full_name = user.faculty.full_name
    elif user.role == "admin":
        full_name = "Administrator"

    access_token = create_access_token(subject=user.user_id, role=user.role)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.user_id,
        "full_name": full_name,
        "email": user.email,
    }

@router.get("/me", response_model=UserProfile)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user
