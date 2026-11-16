# NitteVision Architecture & Technical Design

## 1. System Overview
**NitteVision** is a specialized student face registration, dataset management, and attendance supervision platform built for Nitte Meenakshi Institute of Technology (NMIT). It provides the first data acquisition and validation pipeline for a high-accuracy CNN-based automated classroom attendance platform.

```
                           +------------------------------+
                           |  React + Vite Frontend (UI)  |
                           |  - Tailwind CSS              |
                           |  - Lucide React              |
                           |  - Webcam (getUserMedia)     |
                           +--------------+---------------+
                                          |
                                          | JSON / Base64 / JWT
                                          v
                           +------------------------------+
                           |     FastAPI Backend (v1)     |
                           |  - Auth & Role Guards        |
                           |  - RetinaFace Service (ONNX) |
                           |  - OpenCV Augmentation (5x)  |
                           |  - SQLAlchemy 2.0 ORM        |
                           +--------------+---------------+
                                          |
                                          | SQL / LONGBLOB
                                          v
                           +------------------------------+
                           |   MySQL Server 8.0 (InnoDB)  |
                           |  - 30 images / student       |
                           |  - Multi-pose dataset        |
                           |  - Attendance records        |
                           +------------------------------+
```

---

## 2. Face Detection & Validation (RetinaFace)
Face detection is powered by pre-trained **RetinaFace** running via ONNX Runtime for high speed and accuracy:
1. **Face Presence**: Detects face bounding boxes and landmark locations (`left_eye`, `right_eye`, `nose`, `mouth_left`, `mouth_right`).
2. **Single Person Enforcement**: Rejects any capture with multiple faces (`face_count > 1`) to ensure pure student datasets.
3. **Bounding-Box Sizing**: Rejects faces occupying `< 15%` (too small/far) or `> 85%` (too close).
4. **Centering Overlay Validation**: Confirms the face centroid lies within 30% tolerance of the camera frame center.
5. **Pose Guidance & Feedback**: Provides landmark-derived orientation indications for:
   - `forward`: 0° frontal
   - `left`: ~45° yaw left
   - `right`: ~45° yaw right
   - `up`: ~35° pitch upward
   - `down`: ~35° pitch downward

---

## 3. 5-Fold Independent Image Augmentation Pipeline
Each original image undergoes 5 independent transformations implemented in `AugmentationService` via OpenCV:
1. **Horizontal Flip**: `cv2.flip(img, 1)` for pose invariance.
2. **Rotation**: Affine transformation matrix rotated by random angle $\theta \in [-15^\circ, +15^\circ]$ with reflect padding.
3. **Brightness & Contrast**: Scaled contrast ($\alpha \in [0.8, 1.25]$) and additive brightness ($\beta \in [-25, +25]$).
4. **Crop & Resize**: 85% to 95% centered bounding-box crop resized back to original resolution.
5. **Blur & Noise**: Controlled Gaussian blur ($k=3, 5$) or additive zero-mean Gaussian noise ($\sigma \in [10, 20]$).

**Dataset Expansion Formula:**
$$\text{5 Originals} \times 5 \text{ Augmentations} = 25 \text{ Augmented Images}$$
$$\text{5 Originals} + 25 \text{ Augmented} = 30 \text{ Verified Images / Student}$$

---

## 4. MySQL Relational Schema
All images are preserved directly inside MySQL using `LONGBLOB` binary fields:
- `users`: Core authentication, bcrypt password hashes, role enum (`student`, `faculty`, `admin`).
- `students`: Profile, USN (unique), department, semester, academic year.
- `faculty`: Profile, department, assigned classes.
- `classes`: Standard branch/semester combinations (56 academic classes).
- `class_students`: Enrolled students per class.
- `capture_sessions`: Session status (`IN_PROGRESS`, `COMPLETED`, `FAILED`), image counters (5, 25, 30), completion timestamp.
- `face_images`: `LONGBLOB` data, image format, dimensions, orientation enum, transformation type, and JSON parameters.
- `attendance`: Class ID, Student ID, date, status (`present`, `absent`), marked_by user ID.
