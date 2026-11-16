# NitteVision Build Status

## Project Summary
- **Institution**: Nitte Meenakshi Institute of Technology (NMIT)
- **Application**: NitteVision - Student Face Registration, Dataset Management & Attendance Platform
- **Architecture**: Modular Monolith (FastAPI + React 18 Vite Tailwind + MySQL 8.0 + RetinaFace + OpenCV)

---

## 1. Environment & Live Services
- **OS**: Windows 11 / x64
- **Python**: 3.11.3 (Virtual environment in `backend/venv`)
- **Node.js**: v24.22.1 / npm 11.19.1
- **Database**: MySQL Server 8.0 Community Server (Running on port 3307, Schema: `nittevision`)
- **Backend Server**: Uvicorn running live on [http://127.0.0.1:8000](http://127.0.0.1:8000) (Interactive Swagger docs: `/docs`)
- **Frontend Server**: Vite dev server running live on [http://localhost:5173](http://localhost:5173)
- **Computer Vision**: RetinaFace (ONNX Runtime inference engine with verified weights)
- **Git**: Initialized & updated with exact reference image UI implementation

---

## 2. Completed Modules
- [x] **Exact Reference UI Implementation (Auth Page)**:
  - **Left Panel (51% Width)**: Directly utilizes the extracted exact campus photograph (`nitte-campus-left-2x.jpg`) with the 4 students on steps, "NITTE CAMPUS" building, "N NITTE (Deemed to be University)" logo, "Nitte Student Learning Platform" heading, "Learn · Practice · Collaborate · Grow" tagline, and the 5 frosted glass cards (*Courses & Resources, Coding & Labs, Peer Learning, Assignments & Progress, Events & Workshops*).
  - **Right Panel (49% Width)**: Recreated to match the reference specification:
    - Very light white/lavender background (`#fdfdff`).
    - Top-right and bottom-right decorative soft lavender curves (`#dcd8f8`).
    - Graduation-cap icon inside light purple rounded square (`#ece8ff`).
    - Heading: "Welcome to Nitte Learn" with deep purple title accent.
    - Subtitle: "Your unified learning platform for courses, practice, projects and more."
    - Horizontal segmented navigation: `Register (Create Account)` and `Login (Existing User)` with purple selected state (`#4537a9`).
    - Registration fields: Full Name, Email Address, Password (with eye toggle).
    - Institution selection: 4 selectable cards (`NMIT`, `NCOPS`, `NSOA`, `NSOM`) with radio indicators.
    - Seamless integration of NMIT student registration requirements (USN, Branch, Semester, biometric consent checkbox).
    - Large purple `Register / Sign Up` and `Login / Sign In` buttons.
    - Centered `or continue with` divider.
    - Google and Microsoft sign-up buttons with official brand SVGs.
    - Dynamic tab switching between Register and Login with role-based routing.
- [x] **Project Foundation**: Git initialized, `.gitignore` configured to safely ignore venv, node_modules, mysql_data, and secrets.
- [x] **MySQL Database**:
  - Initialized dedicated MySQL 8.0 instance running on port 3307.
  - 9 normalized relational tables: `users`, `students`, `faculty`, `classes`, `class_students`, `faculty_classes`, `capture_sessions`, `face_images`, `attendance`.
  - Stored images verified in MySQL using `LONGBLOB` binary fields.
  - Seeded initial Administrator (`admin@nitte.edu.in`), demo Faculty (`faculty@nitte.edu.in`), and 56 academic classes across all departments (AIML, CSE, ISE, ECE, ME, CE, EEE) and semesters 1–8.
- [x] **Authentication & Role-Based Access Control**:
  - Direct bcrypt password hashing and verification.
  - Secure JWT access tokens with 24-hour expiration.
  - Role-based dependencies: `require_student`, `require_faculty`, `require_admin`.
- [x] **Computer Vision (RetinaFace)**:
  - Backend `RetinaFaceService` detecting face presence, single face enforcement, size bounds (15%–85%), and centroid alignment within 30% tolerance of circle overlay.
  - Landmark-derived orientation feedback for Forward, Left, Right, Up, Down.
- [x] **5-Fold Independent Image Augmentation**:
  - `AugmentationService` generating exactly 5 independent OpenCV variations per original:
    1. Horizontal Flip (`cv2.flip`)
    2. Rotation ($\pm15^\circ$ random angle with reflect border)
    3. Brightness & Contrast scaling
    4. Centered Crop & Resize (85%–95% area)
    5. Gaussian Blur / Gaussian Noise
  - $5 \text{ originals} \times 5 \text{ augmentations} = 25 \text{ augmented images}$.
  - $5 \text{ originals} + 25 \text{ augmented} = 30 \text{ total images stored per student}$.
- [x] **Frontend Dashboards (React 18 + Vite + Tailwind CSS)**:
  - 3-column face registration page with live browser webcam (`navigator.mediaDevices.getUserMedia()`), circular guide overlay, corner brackets, dynamic capture button (`CAPTURE (1 / 5)` ... `(5 / 5)`), RetinaFace validation, and review modal.
  - Student dashboard with real attendance metrics and dataset status.
  - My Dataset gallery streaming images securely from `/api/v1/images/{id}`.
  - Faculty dashboard with attendance marking and CSV report export.
  - Admin console with real-time statistics, student directory, dataset audit, and CSV export.
- [x] **Integration Testing**:
  - `backend/test_pipeline.py` verified 100% pass across all 9 workflow stages.

---

## 3. Working API Endpoints
- `GET /` - Root health and platform metadata
- `GET /health` - Service health status
- `POST /api/v1/auth/register` - Student registration & class auto-assignment
- `POST /api/v1/auth/login` - JWT authentication
- `GET /api/v1/auth/me` - Authenticated profile
- `POST /api/v1/face-registration/validate-capture` - RetinaFace validation
- `POST /api/v1/face-registration/submit-dataset` - 5 original + 25 augmented = 30 image submission
- `GET /api/v1/face-registration/status` - Current dataset status
- `GET /api/v1/students/dashboard-stats` - Student KPI statistics
- `GET /api/v1/students/my-dataset` - Image gallery & transformation parameters
- `GET /api/v1/images/{image_id}` - Secure LONGBLOB image streaming
- `GET /api/v1/faculty/dashboard-stats` - Faculty KPI metrics
- `GET /api/v1/faculty/classes` - List of assigned classes
- `GET /api/v1/faculty/classes/{id}/students` - Enrolled students & dataset status
- `POST /api/v1/faculty/attendance/mark` - Manual attendance marking
- `GET /api/v1/faculty/attendance/export/{id}` - Attendance CSV export
- `GET /api/v1/admin/dashboard-stats` - Platform-wide statistics
- `GET /api/v1/admin/students` - Filterable student directory
- `GET /api/v1/admin/datasets` - Multi-pose dataset audit log
- `POST /api/v1/admin/faculty` - Provision faculty account
- `GET /api/v1/admin/export-audit-csv` - Platform dataset audit CSV export

---

## 4. Testing Results
- Automated End-to-End Suite (`test_pipeline.py`): **100% Passed (9/9 Stages)**
- Image Storage Count Verification: **30 records per student confirmed in MySQL LONGBLOB**
- Frontend Production Bundle: **Verified (dist build complete in 7.87s)**
