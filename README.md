# NitteVision
### Full-Stack AI-Based Student Face Registration, Dataset Management & Attendance Platform
**Nitte Meenakshi Institute of Technology (NMIT)**

---

## 📌 Features

1. **Split-Screen Authentication & Role-Based Access Control**:
   - Students, Faculty, and Administrators with strict JWT security and bcrypt hashing.
   - Institutional Nitte purple/lavender styling with 5 showcase cards.
2. **Interactive 3-Column Webcam Face Registration**:
   - Real-time `navigator.mediaDevices.getUserMedia()` video capture.
   - Circular face positioning guide overlay and corner framing brackets.
   - Dynamic step guidance across 5 orientations: Forward, Left, Right, Up, and Down.
3. **RetinaFace Computer Vision Validation**:
   - Backend Python RetinaFace detection powered by ONNX Runtime.
   - Bounding-box detection, single-person validation, distance/size checks, and facial centering.
4. **5-Fold Independent OpenCV Augmentation**:
   - 1. Horizontal Flip
   - 2. $\pm15^\circ$ Random Rotation
   - 3. Brightness & Contrast scaling
   - 4. Centered Crop & Resize
   - 5. Gaussian Blur / Gaussian Noise
   - $5 \text{ originals} + 25 \text{ augmented} = 30 \text{ images per student}$.
5. **Direct MySQL LONGBLOB Storage**:
   - Raw image binary preservation directly in relational tables.
   - Atomicity: Datasets are marked `COMPLETED` only after verifying all 30 database records.
6. **Role-Specific Dashboards**:
   - **Student Dashboard**: Face registration status, dataset summary, attendance percentage, recent activity.
   - **My Dataset Gallery**: Multi-pose inspection with transformation parameters.
   - **Faculty Dashboard**: Assigned class attendance marking, student directory, CSV attendance report export.
   - **Admin Console**: Real-time KPI analytics, student/faculty directories, dataset audit log, and full audit CSV export.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Axios, Canvas Confetti
- **Backend**: Python 3.11, FastAPI, SQLAlchemy 2.0, PyMySQL, Cryptography, Bcrypt
- **Computer Vision**: RetinaFace (ONNX Runtime), OpenCV 5.0
- **Database**: MySQL Server 8.0 (InnoDB, LONGBLOB image storage)

---

## 🚀 Quickstart & Setup Guide (Windows)

### 1. Database & Environment Configuration
Ensure `.env` exists in the project root:
```env
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=
DB_NAME=nittevision

JWT_SECRET_KEY=nittevision_super_secret_jwt_key_2026_change_in_production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

ADMIN_EMAIL=admin@nitte.edu.in
ADMIN_PASSWORD=Admin@Nitte2026
```

### 2. Backend Server
Activate the Python virtual environment and run database migrations:
```powershell
# Activate venv
.\backend\venv\Scripts\Activate.ps1

# Run database setup & seeding
python backend\init_db.py

# Start FastAPI backend server
uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be available at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 3. Frontend Development Server
From the `frontend` directory:
```powershell
cd frontend
npm run dev
```
Access the application at: [http://localhost:5173](http://localhost:5173)

---

## 👤 Default Accounts

- **Administrator**: `admin@nitte.edu.in` / `Admin@Nitte2026`
- **Faculty**: `faculty@nitte.edu.in` / `Faculty@Nitte2026`
- **Student**: Register a new student account via the `/register` tab.

---

## 🧪 Integration Testing
Run the comprehensive end-to-end verification suite:
```powershell
.\backend\venv\Scripts\python.exe backend\test_pipeline.py
```
Outputs 100% verification for authentication, OpenCV augmentation, RetinaFace capture validation, MySQL LONGBLOB verification, and dashboard analytics.
