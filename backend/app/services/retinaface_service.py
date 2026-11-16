import cv2
import numpy as np
import base64
from typing import Dict, Any, Tuple
from retinaface import RetinaFace

class RetinaFaceService:
    @staticmethod
    def decode_base64_or_bytes(image_input: Any) -> np.ndarray:
        """Decodes base64 string (with or without data:image/jpeg;base64, prefix) or bytes into OpenCV BGR numpy array."""
        if isinstance(image_input, str):
            if "," in image_input:
                image_input = image_input.split(",", 1)[1]
            image_bytes = base64.b64decode(image_input)
        elif isinstance(image_input, bytes):
            image_bytes = image_input
        else:
            raise ValueError("Unsupported image input type for decoding")

        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Unable to decode image data into OpenCV format")
        return img

    @classmethod
    def validate_face_capture(
        cls,
        image_input: Any,
        requested_orientation: str = "forward"
    ) -> Dict[str, Any]:
        """
        Validates the captured image according to project requirements:
        1. Face presence detection
        2. Face bounding-box extraction
        3. Face count validation (reject 0 or > 1)
        4. Face positioning validation (inside circle/capture area)
        5. Basic face visibility and size validation (too small / too large)
        6. Landmark analysis for requested orientation checks
        """
        try:
            img = cls.decode_base64_or_bytes(image_input)
        except Exception as e:
            return {
                "is_valid": False,
                "message": f"Corrupted or invalid image data: {str(e)}",
                "face_count": 0,
            }

        h, w = img.shape[:2]

        try:
            # RetinaFace.detect_faces returns a dict of faces: { 'face_1': { 'score': 0.99, 'facial_area': [...], 'landmarks': {...} } }
            detections = RetinaFace.detect_faces(img)
        except Exception as e:
            return {
                "is_valid": False,
                "message": f"Face detection inference failed: {str(e)}",
                "face_count": 0,
            }

        # Check face count
        if not detections or not isinstance(detections, dict) or len(detections) == 0:
            return {
                "is_valid": False,
                "message": "No face detected. Please position your face correctly.",
                "face_count": 0,
            }

        face_count = len(detections)
        if face_count > 1:
            return {
                "is_valid": False,
                "message": "Multiple faces detected. Please ensure only one person is visible.",
                "face_count": face_count,
            }

        # Exactly 1 face
        face_info = list(detections.values())[0]
        score = face_info.get("score", 0.0)
        facial_area = face_info.get("facial_area", [0, 0, 0, 0])
        x1, y1, x2, y2 = facial_area
        face_w = x2 - x1
        face_h = y2 - y1

        # Check confidence
        if score < 0.85:
            return {
                "is_valid": False,
                "message": "Low face detection confidence. Please ensure good lighting and face visibility.",
                "face_count": 1,
                "confidence": round(float(score), 3),
            }

        # Check face size
        # Face must occupy at least 15% of frame dimension and at most 85%
        min_dim = min(w, h)
        if face_w < 0.15 * w or face_h < 0.15 * h:
            return {
                "is_valid": False,
                "message": "Face too small. Move closer to the camera.",
                "face_count": 1,
                "confidence": round(float(score), 3),
            }

        if face_w > 0.85 * w or face_h > 0.85 * h:
            return {
                "is_valid": False,
                "message": "Face is too close to the camera. Please back up slightly.",
                "face_count": 1,
                "confidence": round(float(score), 3),
            }

        # Check face positioning relative to center circle
        face_center_x = (x1 + x2) / 2.0
        face_center_y = (y1 + y2) / 2.0
        frame_center_x = w / 2.0
        frame_center_y = h / 2.0

        offset_x_ratio = abs(face_center_x - frame_center_x) / w
        offset_y_ratio = abs(face_center_y - frame_center_y) / h

        # If face center is outside 30% tolerance from frame center
        if offset_x_ratio > 0.30 or offset_y_ratio > 0.30:
            return {
                "is_valid": False,
                "message": "Face is not positioned correctly. Please adjust your position inside the circle.",
                "face_count": 1,
                "confidence": round(float(score), 3),
            }

        # Landmark and orientation guidance
        landmarks = face_info.get("landmarks", {})
        orientation_note = ""

        # Basic landmark check: right_eye, left_eye, nose
        if "right_eye" in landmarks and "left_eye" in landmarks and "nose" in landmarks:
            re = landmarks["right_eye"]
            le = landmarks["left_eye"]
            nose = landmarks["nose"]
            
            # Distance from nose to right eye vs left eye
            dist_to_re = abs(nose[0] - re[0])
            dist_to_le = abs(nose[0] - le[0])
            total_eye_dist = abs(le[0] - re[0]) if abs(le[0] - re[0]) > 0 else 1.0

            # Yaw ratio
            yaw_ratio = (dist_to_re - dist_to_le) / total_eye_dist

            # Vertical eye-nose distance
            eye_y = (re[1] + le[1]) / 2.0
            nose_drop = nose[1] - eye_y

            # Orientation analysis
            if requested_orientation == "left" and yaw_ratio > 0.15:
                orientation_note = " (Turned left orientation detected)"
            elif requested_orientation == "right" and yaw_ratio < -0.15:
                orientation_note = " (Turned right orientation detected)"
            elif requested_orientation == "up" and nose_drop < (face_h * 0.25):
                orientation_note = " (Tilted up orientation detected)"
            elif requested_orientation == "down" and nose_drop > (face_h * 0.40):
                orientation_note = " (Tilted down orientation detected)"
            elif requested_orientation == "forward":
                orientation_note = " (Frontal orientation confirmed)"

        return {
            "is_valid": True,
            "message": f"Face detected successfully for {requested_orientation} orientation{orientation_note}.",
            "face_count": 1,
            "bounding_box": {
                "x": int(x1),
                "y": int(y1),
                "w": int(face_w),
                "h": int(face_h),
            },
            "confidence": round(float(score), 3),
            "landmarks": landmarks,
        }
