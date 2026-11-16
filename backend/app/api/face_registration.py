import base64
from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.deps import require_student
from app.models.models import User, Student, CaptureSession, FaceImage
from app.schemas.schemas import (
    SingleCaptureSubmission, DatasetSubmission, ValidationResult,
    DatasetSummaryResponse, DatasetImageInfo
)
from app.services.retinaface_service import RetinaFaceService
from app.services.augmentation_service import AugmentationService

router = APIRouter(prefix="/face-registration", tags=["Face Registration"])

REQUIRED_ORIENTATIONS = ["forward", "left", "right", "up", "down"]

@router.post("/validate-capture", response_model=ValidationResult)
def validate_single_capture(
    capture: SingleCaptureSubmission,
    current_user: User = Depends(require_student)
):
    """
    Validates a single webcam frame against RetinaFace criteria:
    - Face presence
    - Single person in frame
    - Appropriate distance & size
    - Centered within guidance overlay
    - Orientation landmark advisory
    """
    result = RetinaFaceService.validate_face_capture(
        image_input=capture.image_base64,
        requested_orientation=capture.orientation
    )
    return result

@router.post("/submit-dataset")
def submit_complete_dataset(
    submission: DatasetSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """
    Final dataset submission for 5 captured orientations:
    1. Validates all 5 images exist (forward, left, right, up, down).
    2. Runs RetinaFace face detection on each.
    3. Saves 5 originals to MySQL LONGBLOB.
    4. Generates 5 independent augmentations per original (25 augmented images).
    5. Saves 25 augmented images with metadata to MySQL LONGBLOB.
    6. Verifies exact count of 30 images in the database.
    7. Atomically commits and marks session COMPLETED.
    """
    student = current_user.student
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")

    # 1. Check all 5 orientations
    submitted_orientations = [c.orientation.lower() for c in submission.captures]
    if len(submission.captures) != 5 or set(submitted_orientations) != set(REQUIRED_ORIENTATIONS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Exactly 5 distinct orientations are required: {REQUIRED_ORIENTATIONS}"
        )

    # 2. Start database transaction
    # Check if existing completed session exists - remove or archive previous to prevent duplicates
    existing_session = db.query(CaptureSession).filter(
        CaptureSession.student_id == student.student_id,
        CaptureSession.capture_status == "COMPLETED"
    ).first()
    if existing_session:
        # We clean up previous session to allow complete retake without duplicate collisions
        db.delete(existing_session)
        db.flush()

    session_record = CaptureSession(
        student_id=student.student_id,
        capture_status="IN_PROGRESS",
        total_original_images=0,
        total_augmented_images=0,
        total_images=0,
    )
    db.add(session_record)
    db.flush()

    try:
        saved_originals: List[FaceImage] = []

        # 3. Process each original capture
        for capture in submission.captures:
            # Decode base64
            img_cv = RetinaFaceService.decode_base64_or_bytes(capture.image_base64)
            h, w = img_cv.shape[:2]
            img_bytes = AugmentationService.encode_image(img_cv)

            # Re-verify with RetinaFace
            val = RetinaFaceService.validate_face_capture(img_bytes, requested_orientation=capture.orientation)
            if not val["is_valid"]:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Validation failed for orientation '{capture.orientation}': {val['message']}"
                )

            # Store original in LONGBLOB
            original_record = FaceImage(
                student_id=student.student_id,
                session_id=session_record.session_id,
                image_type="original",
                original_image_id=None,
                orientation=capture.orientation.lower(),
                transformation_type="none",
                transformation_parameters=None,
                image_data=img_bytes,
                image_format="image/jpeg",
                image_width=w,
                image_height=h,
            )
            db.add(original_record)
            db.flush()
            saved_originals.append(original_record)

        # 4. Generate and save 5 independent augmentations per original (5 x 5 = 25)
        augmented_records_count = 0
        for original in saved_originals:
            aug_list = AugmentationService.generate_augmentations(original.image_data)
            if len(aug_list) != 5:
                raise ValueError(f"Expected 5 augmentations for original {original.image_id}, got {len(aug_list)}")

            for aug_data in aug_list:
                aug_record = FaceImage(
                    student_id=student.student_id,
                    session_id=session_record.session_id,
                    image_type="augmented",
                    original_image_id=original.image_id,
                    orientation=original.orientation,
                    transformation_type=aug_data["type"],
                    transformation_parameters=aug_data["parameters"],
                    image_data=aug_data["image_bytes"],
                    image_format="image/jpeg",
                    image_width=aug_data["width"],
                    image_height=aug_data["height"],
                )
                db.add(aug_record)
                augmented_records_count += 1

        db.flush()

        # 5. Verify database records: 5 originals + 25 augmented = 30 total
        total_in_db = db.query(FaceImage).filter(
            FaceImage.session_id == session_record.session_id
        ).count()

        if total_in_db != 30 or augmented_records_count != 25 or len(saved_originals) != 5:
            raise ValueError(f"Database verification failed: expected 30 images, got {total_in_db}")

        # 6. Mark session COMPLETED
        session_record.total_original_images = len(saved_originals)
        session_record.total_augmented_images = augmented_records_count
        session_record.total_images = total_in_db
        session_record.capture_status = "COMPLETED"
        session_record.completed_at = datetime.utcnow()

        db.commit()
        db.refresh(session_record)

        return {
            "status": "success",
            "message": "FACE DATASET REGISTERED SUCCESSFULLY!",
            "student_name": student.full_name,
            "usn": student.usn,
            "session_id": session_record.session_id,
            "original_images": 5,
            "augmented_images": 25,
            "total_images": 30,
            "completed_at": session_record.completed_at,
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Dataset registration failed: {str(e)}"
        )

@router.get("/status")
def get_registration_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    student = current_user.student
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")

    session_record = db.query(CaptureSession).filter(
        CaptureSession.student_id == student.student_id,
        CaptureSession.capture_status == "COMPLETED"
    ).order_by(CaptureSession.created_at.desc()).first()

    if not session_record:
        return {
            "is_registered": False,
            "status": "NOT_STARTED",
            "total_images": 0,
            "original_images": 0,
            "augmented_images": 0,
        }

    return {
        "is_registered": True,
        "status": session_record.capture_status,
        "session_id": session_record.session_id,
        "total_images": session_record.total_images,
        "original_images": session_record.total_original_images,
        "augmented_images": session_record.total_augmented_images,
        "completed_at": session_record.completed_at,
    }
