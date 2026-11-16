from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.models import User, FaceImage

router = APIRouter(prefix="/images", tags=["Images"])

@router.get("/{image_id}")
def get_face_image_data(
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Streams the raw image bytes stored in LONGBLOB.
    Guarantees privacy:
    - Students can only view their own image data.
    - Faculty and Admins can view for verification/attendance audit.
    """
    image_record = db.query(FaceImage).filter(FaceImage.image_id == image_id).first()
    if not image_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")

    if current_user.role == "student":
        student = current_user.student
        if not student or image_record.student_id != student.student_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this image")

    return Response(
        content=image_record.image_data,
        media_type=image_record.image_format or "image/jpeg",
        headers={
            "Cache-Control": "private, max-age=3600",
            "Content-Disposition": f"inline; filename=face_{image_record.orientation}_{image_record.image_id}.jpg"
        }
    )
