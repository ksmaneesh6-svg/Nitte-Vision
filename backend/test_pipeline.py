import sys
import cv2
import numpy as np
import base64
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models.models import User, Student, CaptureSession, FaceImage, Attendance
from app.services.augmentation_service import AugmentationService

client = TestClient(app)

def test_full_pipeline():
    print("\n--- 1. Testing Root and Health Endpoints ---")
    res = client.get("/")
    assert res.status_code == 200
    print("Root API OK:", res.json()["platform"])

    print("\n--- 2. Testing Student Registration ---")
    test_student = {
        "full_name": "K S Maneesh",
        "usn": "1NT22AI050",
        "email": "maneesh.test@nitte.edu.in",
        "password": "Password@123",
        "branch": "AIML",
        "semester": 5,
        "consent_given": True
    }
    # Clean up if leftover from previous test run
    db = SessionLocal()
    existing_u = db.query(User).filter(User.email == test_student["email"]).first()
    if existing_u:
        db.delete(existing_u)
        db.commit()
    db.close()

    reg_res = client.post("/api/v1/auth/register", json=test_student)
    assert reg_res.status_code == 201, reg_res.text
    token_data = reg_res.json()
    student_token = token_data["access_token"]
    print("Student registered successfully! Token received.")

    # Duplicate USN check
    dup_res = client.post("/api/v1/auth/register", json=test_student)
    assert dup_res.status_code == 400
    print("Duplicate USN correctly rejected!")

    print("\n--- 3. Testing Student Login ---")
    login_res = client.post("/api/v1/auth/login", json={
        "email": test_student["email"],
        "password": test_student["password"]
    })
    assert login_res.status_code == 200
    assert login_res.json()["role"] == "student"
    print("Login authentication successful!")

    print("\n--- 4. Testing OpenCV 5-Fold Image Augmentation Service ---")
    # Create a realistic test image with face pattern
    synthetic_img = np.full((480, 480, 3), 180, dtype=np.uint8)
    # Draw face shape and features
    cv2.circle(synthetic_img, (240, 240), 120, (140, 170, 210), -1)
    cv2.circle(synthetic_img, (190, 200), 18, (40, 40, 40), -1) # left eye
    cv2.circle(synthetic_img, (290, 200), 18, (40, 40, 40), -1) # right eye
    cv2.ellipse(synthetic_img, (240, 290), (45, 20), 0, 0, 180, (50, 50, 180), -1) # mouth
    cv2.circle(synthetic_img, (240, 240), 10, (100, 100, 100), -1) # nose
    
    encoded_bytes = AugmentationService.encode_image(synthetic_img)
    aug_results = AugmentationService.generate_augmentations(encoded_bytes)
    assert len(aug_results) == 5
    aug_types = [a["type"] for a in aug_results]
    print("5 Independent Augmentations Generated:", aug_types)
    assert "horizontal_flip" in aug_types
    assert "rotation" in aug_types
    assert "brightness_contrast" in aug_types
    assert "crop_resize" in aug_types
    assert "blur_noise" in aug_types

    print("\n--- 5. Testing Face Registration Dataset Submission & SQL LONGBLOB Storage ---")
    headers = {"Authorization": f"Bearer {student_token}"}
    
    # Prepare 5 orientation captures
    b64_img = base64.b64encode(encoded_bytes).decode("utf-8")
    dataset_payload = {
        "captures": [
            {"orientation": "forward", "image_base64": b64_img},
            {"orientation": "left", "image_base64": b64_img},
            {"orientation": "right", "image_base64": b64_img},
            {"orientation": "up", "image_base64": b64_img},
            {"orientation": "down", "image_base64": b64_img},
        ]
    }

    # Bypass strict RetinaFace model inference inside unit test by mocking or submitting directly
    from unittest.mock import patch
    with patch("app.services.retinaface_service.RetinaFaceService.validate_face_capture") as mock_val:
        mock_val.return_value = {
            "is_valid": True,
            "message": "Face verified",
            "face_count": 1,
            "bounding_box": {"x": 120, "y": 120, "w": 240, "h": 240},
            "confidence": 0.98
        }
        sub_res = client.post("/api/v1/face-registration/submit-dataset", json=dataset_payload, headers=headers)
        assert sub_res.status_code == 200, sub_res.text
        sub_data = sub_res.json()
        print("Dataset Submission Result:", sub_data["message"])
        assert sub_data["original_images"] == 5
        assert sub_data["augmented_images"] == 25
        assert sub_data["total_images"] == 30

    print("\n--- 6. Verifying MySQL Database Records & LONGBLOB Storage ---")
    db = SessionLocal()
    st_rec = db.query(Student).filter(Student.usn == test_student["usn"]).first()
    sess_rec = db.query(CaptureSession).filter(CaptureSession.student_id == st_rec.student_id).first()
    assert sess_rec.capture_status == "COMPLETED"
    assert sess_rec.total_images == 30

    images_in_db = db.query(FaceImage).filter(FaceImage.session_id == sess_rec.session_id).all()
    assert len(images_in_db) == 30
    for img in images_in_db:
        assert len(img.image_data) > 0  # LONGBLOB bytes verified!
    db.close()
    print("VERIFIED: Exactly 30 images with actual LONGBLOB binary data stored in MySQL!")

    print("\n--- 7. Testing Student Dashboard Stats & Gallery ---")
    dash_res = client.get("/api/v1/students/dashboard-stats", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["face_registration_status"] == "COMPLETED"
    assert dash_data["total_dataset_images"] == 30
    print("Student dashboard confirms face_registration_status = COMPLETED (30/30 Images)!")

    # Test My Dataset gallery API
    gallery_res = client.get("/api/v1/students/my-dataset", headers=headers)
    assert gallery_res.status_code == 200
    assert len(gallery_res.json()["images"]) == 30
    print("My Dataset Gallery API returns all 30 images with metadata!")

    # Test Image Streaming endpoint
    first_img_id = gallery_res.json()["images"][0]["image_id"]
    stream_res = client.get(f"/api/v1/images/{first_img_id}", headers=headers)
    assert stream_res.status_code == 200
    assert stream_res.headers["content-type"] == "image/jpeg"
    assert len(stream_res.content) > 0
    print(f"Secure Image Streaming for #{first_img_id} verified ({len(stream_res.content)} bytes)!")

    print("\n--- 8. Testing Faculty Dashboard and Attendance Marking ---")
    fac_login = client.post("/api/v1/auth/login", json={
        "email": "faculty@nitte.edu.in",
        "password": "Faculty@Nitte2026"
    })
    assert fac_login.status_code == 200
    fac_token = fac_login.json()["access_token"]
    fac_headers = {"Authorization": f"Bearer {fac_token}"}

    fac_classes = client.get("/api/v1/faculty/classes", headers=fac_headers).json()
    assert len(fac_classes) > 0
    # Find the class the student was enrolled in (AIML Sem 5)
    student_class = next(c for c in fac_classes if c["branch"] == "AIML" and c["semester"] == 5)
    test_class_id = student_class["class_id"]

    # Mark attendance
    att_res = client.post("/api/v1/faculty/attendance/mark", json={
        "class_id": test_class_id,
        "attendance_date": "2026-11-16",
        "records": [
            {"student_id": st_rec.student_id, "status": "present"}
        ]
    }, headers=fac_headers)
    assert att_res.status_code == 200
    print("Faculty attendance marked successfully!")

    # Export CSV
    csv_res = client.get(f"/api/v1/faculty/attendance/export/{test_class_id}", headers=fac_headers)
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert "1NT22AI050" in csv_res.text
    print("Faculty Attendance CSV Export verified!")

    print("\n--- 9. Testing Admin Dashboard & Audit ---")
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@nitte.edu.in",
        "password": "Admin@Nitte2026"
    })
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    admin_stats = client.get("/api/v1/admin/dashboard-stats", headers=admin_headers).json()
    assert admin_stats["total_students"] >= 1
    assert admin_stats["registered_face_datasets"] >= 1
    print("Admin stats verified:", admin_stats)

    audit_csv = client.get("/api/v1/admin/export-audit-csv", headers=admin_headers)
    assert audit_csv.status_code == 200
    assert "1NT22AI050" in audit_csv.text
    print("Admin Audit CSV Export verified!")

    print("\n=======================================================")
    print("ALL END-TO-END PIPELINE TESTS PASSED WITH 100% SUCCESS!")
    print("=======================================================\n")

if __name__ == "__main__":
    test_full_pipeline()
