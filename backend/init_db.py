import pymysql
from app.core.config import settings
from app.database.session import engine, Base, SessionLocal
from app.models.models import User, Faculty, ClassModel
from app.core.security import get_password_hash

def init_database():
    print(f"Connecting to MySQL server at {settings.DB_HOST}:{settings.DB_PORT} as {settings.DB_USER}...")
    
    # 1. Connect without db name to create database if not exists
    connection = pymysql.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        charset="utf8mb4"
    )
    try:
        with connection.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{settings.DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            print(f"Database '{settings.DB_NAME}' created or already exists.")
        connection.commit()
    finally:
        connection.close()

    # 2. Create tables using SQLAlchemy
    print("Creating relational tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables verified and created successfully.")

    # 3. Seed Initial Administrator Account
    db = SessionLocal()
    try:
        admin_email = settings.ADMIN_EMAIL.strip().lower()
        existing_admin = db.query(User).filter(User.email == admin_email).first()
        if not existing_admin:
            print(f"Seeding initial Admin user: {admin_email}")
            admin_user = User(
                email=admin_email,
                password_hash=get_password_hash(settings.ADMIN_PASSWORD),
                role="admin",
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("Initial Admin user created successfully.")
        else:
            print(f"Admin user ({admin_email}) already exists.")

        # Seed Faculty Account for testing
        faculty_email = "faculty@nitte.edu.in"
        existing_fac = db.query(User).filter(User.email == faculty_email).first()
        if not existing_fac:
            print(f"Seeding demo Faculty user: {faculty_email}")
            fac_user = User(
                email=faculty_email,
                password_hash=get_password_hash("Faculty@Nitte2026"),
                role="faculty",
                is_active=True
            )
            db.add(fac_user)
            db.flush()
            fac_prof = Faculty(
                user_id=fac_user.user_id,
                full_name="Prof. Rajesh K",
                email=faculty_email,
                department="AIML"
            )
            db.add(fac_prof)
            db.commit()
            print("Demo Faculty created successfully.")

        # 4. Seed Standard Classes for Nitte Departments
        branches = ["AIML", "CSE", "ISE", "ECE", "ME", "CE", "EEE"]
        semesters = [1, 2, 3, 4, 5, 6, 7, 8]
        
        existing_classes_count = db.query(ClassModel).count()
        if existing_classes_count == 0:
            print("Seeding academic classes...")
            for branch in branches:
                for sem in semesters:
                    if sem in (1, 2):
                        yr = "1st Year"
                    elif sem in (3, 4):
                        yr = "2nd Year"
                    elif sem in (5, 6):
                        yr = "3rd Year"
                    else:
                        yr = "4th Year"
                    c = ClassModel(
                        class_name=f"{branch} - Semester {sem}",
                        branch=branch,
                        semester=sem,
                        academic_year=yr
                    )
                    db.add(c)
            db.commit()
            print("Academic classes seeded.")
        else:
            print(f"{existing_classes_count} classes already exist.")

    finally:
        db.close()

    print("Database initialization finished successfully!")

if __name__ == "__main__":
    init_database()
