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

    @staticmethod
    def to_serializable(val: Any) -> Any:
        """Converts numpy types (ndarray, float32, int64, etc.) recursively into native Python types for JSON serialization."""
        if isinstance(val, np.ndarray):
            return val.tolist()
        elif isinstance(val, (np.floating, np.float32, np.float64)):
            return float(val)
        elif isinstance(val, (np.integer, np.int32, np.int64)):
            return int(val)
        elif isinstance(val, dict):
            return {str(k): RetinaFaceService.to_serializable(v) for k, v in val.items()}
        elif isinstance(val, (list, tuple)):
            return [RetinaFaceService.to_serializable(x) for x in val]
        return val

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

        # Check if face boundary is clipping the frame edge
        if x1 < 0.02 * w or y1 < 0.02 * h or x2 > 0.98 * w or y2 > 0.98 * h:
            return {
                "is_valid": False,
                "message": "Face is partially outside the camera frame. Please move into the center circle.",
                "face_count": 1,
                "confidence": round(float(score), 3),
            }

        # Check face size
        # Face must occupy at least 15% of frame dimension and at most 85%
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

        # Landmark extraction and validation
        landmarks = face_info.get("landmarks", {})
        if not ("right_eye" in landmarks and "left_eye" in landmarks and "nose" in landmarks):
            return {
                "is_valid": False,
                "message": "Essential facial landmarks not detected. Please face the camera clearly.",
                "face_count": 1,
                "confidence": round(float(score), 3),
            }

        re = np.array(landmarks["right_eye"], dtype=np.float64)
        le = np.array(landmarks["left_eye"], dtype=np.float64)
        nose = np.array(landmarks["nose"], dtype=np.float64)
        rm = np.array(landmarks.get("mouth_right", [re[0], re[1] + (nose[1] - re[1]) * 1.6]), dtype=np.float64)
        lm = np.array(landmarks.get("mouth_left", [le[0], le[1] + (nose[1] - le[1]) * 1.6]), dtype=np.float64)

        # Check if landmarks are partially outside frame
        for pt in [re, le, nose, rm, lm]:
            if pt[0] < 0.01 * w or pt[0] > 0.99 * w or pt[1] < 0.01 * h or pt[1] > 0.99 * h:
                return {
                    "is_valid": False,
                    "message": "Facial features are partially out of frame. Please position your face inside the circle.",
                    "face_count": 1,
                    "confidence": round(float(score), 3),
                }

        # =========================================================================
        # HEAD-POSE ESTIMATION: Geometric Landmarks & OpenCV solvePnP
        # =========================================================================

        # 1. Roll analysis (in-plane tilt)
        dx_eyes = float(le[0] - re[0])
        dy_eyes = float(le[1] - re[1])
        roll_deg = float(np.degrees(np.arctan2(dy_eyes, dx_eyes)))

        if abs(roll_deg) > 20.0:
            return {
                "is_valid": False,
                "message": "Your head is tilted sideways. Please keep your head upright.",
                "face_count": 1,
                "confidence": round(float(score), 3),
            }

        # 2. Yaw analysis (Horizontal rotation: Left / Right)
        # Note: In raw camera image, subject's anatomical left is image-right (larger X).
        # When turning to user's LEFT: nose shifts towards left eye (image-right) -> dist_re > dist_le -> yaw_ratio > 0.
        # When turning to user's RIGHT: nose shifts towards right eye (image-left) -> dist_le > dist_re -> yaw_ratio < 0.
        dist_re_x = float(nose[0] - re[0])
        dist_le_x = float(le[0] - nose[0])
        total_x = dist_re_x + dist_le_x
        if total_x < 1e-4:
            total_x = 1.0
        yaw_ratio = (dist_re_x - dist_le_x) / total_x

        # 3. Pitch analysis (Vertical tilt: Up / Down)
        # In image coords, Y=0 is top.
        # When tilting UP: nose moves towards eye line -> (nose_y - eye_y) shrinks -> pitch_ratio < 0.38.
        # When tilting DOWN: nose moves towards mouth line -> (nose_y - eye_y) grows -> pitch_ratio > 0.63.
        eye_y = float(re[1] + le[1]) / 2.0
        mouth_y = float(rm[1] + lm[1]) / 2.0
        total_y = mouth_y - eye_y
        if total_y < 1e-4:
            total_y = 1.0
        pitch_ratio = float(nose[1] - eye_y) / total_y

        # 4. 3D Head Pose via OpenCV solvePnP
        pnp_yaw, pnp_pitch, pnp_roll = 0.0, 0.0, 0.0
        try:
            model_points = np.array([
                (0.0, 0.0, 0.0),             # Nose tip
                (-33.0, -32.0, -28.0),        # Right eye
                (33.0, -32.0, -28.0),         # Left eye
                (-26.0, 32.0, -28.0),         # Right mouth
                (26.0, 32.0, -28.0)           # Left mouth
            ], dtype=np.float64)

            image_points = np.array([nose, re, le, rm, lm], dtype=np.float64)
            focal_length = float(w)
            center = (w / 2.0, h / 2.0)
            camera_matrix = np.array([
                [focal_length, 0, center[0]],
                [0, focal_length, center[1]],
                [0, 0, 1]
            ], dtype=np.float64)
            dist_coeffs = np.zeros((4, 1), dtype=np.float64)

            pnp_ok, rvec, tvec = cv2.solvePnP(
                model_points, image_points, camera_matrix, dist_coeffs, flags=cv2.SOLVEPNP_EPNP
            )
            if pnp_ok:
                R, _ = cv2.Rodrigues(rvec)
                angles, _, _, _, _, _ = cv2.RQDecomp3x3(R)
                pnp_pitch, pnp_yaw, pnp_roll = angles
        except Exception:
            pass

        pose_metrics = {
            "yaw_ratio": round(yaw_ratio, 3),
            "pitch_ratio": round(pitch_ratio, 3),
            "roll_deg": round(roll_deg, 1),
            "pnp_yaw": round(float(pnp_yaw), 1),
            "pnp_pitch": round(float(pnp_pitch), 1),
            "pnp_roll": round(float(pnp_roll), 1),
        }

        # =========================================================================
        # 5 STRICT ORIENTATION RULES & USER GUIDANCE
        # =========================================================================
        req = requested_orientation.lower()

        if req == "forward":
            if yaw_ratio > 0.20:
                return {
                    "is_valid": False,
                    "message": "Your face is turned to the left. Please look directly forward at the camera.",
                    "face_count": 1,
                    "confidence": round(float(score), 3),
                    "pose_metrics": pose_metrics,
                }
            if yaw_ratio < -0.20:
                return {
                    "is_valid": False,
                    "message": "Your face is turned to the right. Please look directly forward at the camera.",
                    "face_count": 1,
                    "confidence": round(float(score), 3),
                    "pose_metrics": pose_metrics,
                }
            if pitch_ratio < 0.38:
                return {
                    "is_valid": False,
                    "message": "Your head is tilted upward. Please look straight forward at the camera.",
                    "face_count": 1,
                    "confidence": round(float(score), 3),
                    "pose_metrics": pose_metrics,
                }
            if pitch_ratio > 0.62:
                return {
                    "is_valid": False,
                    "message": "Your head is tilted downward. Please look straight forward at the camera.",
                    "face_count": 1,
                    "confidence": round(float(score), 3),
                    "pose_metrics": pose_metrics,
                }
            return {
                "is_valid": True,
                "message": "Frontal pose verified successfully.",
                "face_count": 1,
                "bounding_box": {"x": int(x1), "y": int(y1), "w": int(face_w), "h": int(face_h)},
                "confidence": round(float(score), 3),
                "landmarks": cls.to_serializable(landmarks),
                "pose_metrics": pose_metrics,
            }

        elif req == "left":
            if yaw_ratio <= -0.15:
                return {
                    "is_valid": False,
                    "message": "Your face is turned to the right. Please turn left as requested.",
                    "face_count": 1,
                    "confidence": round(float(score), 3),
                    "pose_metrics": pose_metrics,
                }
            if -0.15 < yaw_ratio < 0.15 and 0.40 <= pitch_ratio <= 0.60:
                return {
                    "is_valid": False,
                    "message": "Your face is currently facing forward. Turn left to continue.",
                    "face_count": 1,
                    "confidence": round(float(score), 3),
                    "pose_metrics": pose_metrics,
                }
            if 0.15 <= yaw_ratio < 0.25:
                return {
                    "is_valid": False,
                    "message": "Please turn your head further to the left.",
                    "face_count": 1,
                    "confidence": round(float(score), 3),
                    "pose_metrics": pose_metrics,
                }
            if yaw_ratio > 0.85:
                return {
                    "is_valid": False,
                    "message": "You have turned too far to the left. Please face slightly more towards the camera.",
                    "face_count": 1,
                    "confidence": round(float(score), 3),
                    "pose_metrics": pose_metrics,
                }
            if pitch_ratio < 0.32:
                return {
                    "is_valid": False,
                    "message": "Your head is tilted upward. Please keep your head level while turning left.",
                    "face_count": 1,
                    "confidence": round(float(score), 3),
                    "pose_metrics": pose_metrics,
                }
            if pitch_ratio > 0.68:
                return {
                    "is_valid": False,
                    "message": "Your head is tilted downward. Please keep your head level while turning left.",
                    "face_count": 1,
                    "confidence": round(float(score), 3),
                    "pose_metrics": pose_metrics,
                }
            return {
                "is_valid": True,
                "message": "Left head orientation verified successfully.",
                "face_count": 1,
                "bounding_box": {"x": int(x1), "y": int(y1), "w": int(face_w), "h": int(face_h)},
                "confidence": round(float(score), 3),
                "landmarks": cls.to_serializable(landmarks),
                "pose_metrics": pose_metrics,
            }

        elif req == "right":
            if yaw_ratio >= 0.15:
                return {
                    "is_valid": False,
                    "message": "Your face is turned to the left. Please turn right as requested.",
                    "face_count": 1,
                    "confidence": round(float(score), 3),
                    "pose_metrics": pose_metrics,
                }
            if -0.15 < yaw_ratio < 0.15 and 0.40 <= pitch_ratio <= 0.60:
                return {
                    "is_valid": False,
                    "message": "Your face is currently facing forward. Turn right to continue.",
                    "face_count": 1,
                    "confidence": round(float(score), 3),
                    "pose_metrics": pose_metrics,
                }
            if -0.25 < yaw_ratio <= -0.15:
                return {
                    "is_valid": False,
                    "message": "Please turn your head further to the right.",
                    "face_count": 1,
                    "confidence": round(float(score), 3),
                    "pose_metrics": pose_metrics,
                }
            if yaw_ratio < -0.85:
                return {
                    "is_valid": False,
                    "message": "You have turned too far to the right. Please face slightly more towards the camera.",
                    "face_count": 1,
                    "confidence": round(float(score), 3),
                    "pose_metrics": pose_metrics,
                }
            if pitch_ratio < 0.32:
                return {
                    "is_valid": False,
                    "message": "Your head is tilted upward. Please keep your head level while turning right.",
                    "face_count": 1,
                    "confidence": round(float(score), 3),
                    "pose_metrics": pose_metrics,
                }
            if pitch_ratio > 0.68:
                return {
                    "is_valid": False,
                    "message": "Your head is tilted downward. Please keep your head level while turning right.",
                    "face_count": 1,
                    "confidence": round(float(score), 3),
                    "pose_metrics": pose_metrics,
                }
            return {
                "is_valid": True,
                "message": "Right head orientation verified successfully.",
                "face_count": 1,
                "bounding_box": {"x": int(x1), "y": int(y1), "w": int(face_w), "h": int(face_h)},
                "confidence": round(float(score), 3),
                "landmarks": cls.to_serializable(landmarks),
                "pose_metrics": pose_metrics,
            }

        elif req == "up":
            if pitch_ratio >= 0.62:
                return {
                    "is_valid": False,
                    "message": "Your face is tilted downward. Please tilt your face upward as requested.",
                    "face_count": 1,
                    "confidence": round(float(score), 3),
                    "pose_metrics": pose_metrics,
                }
            if 0.42 <= pitch_ratio < 0.62 and abs(yaw_ratio) <= 0.20:
                return {
                    "is_valid": False,
                    "message": "Your face is currently facing forward. Please tilt your face upward.",
                    "face_count": 1,
                    "confidence": round(float(score), 3),
                    "pose_metrics": pose_metrics,
                }
            if 0.38 < pitch_ratio < 0.42:
                return {
                    "is_valid": False,
                    "message": "Please tilt your face slightly more upward.",
                    "face_count": 1,
                    "confidence": round(float(score), 3),
                    "pose_metrics": pose_metrics,
                }
            if pitch_ratio < 0.08:
                return {
                    "is_valid": False,
                    "message": "Head is tilted too far upward. Please lower your chin slightly.",
                    "face_count": 1,
                    "confidence": round(float(score), 3),
                    "pose_metrics": pose_metrics,
                }
            if abs(yaw_ratio) > 0.30:
                return {
                    "is_valid": False,
                    "message": "Your head is turned sideways. Please face forward while tilting upward.",
                    "face_count": 1,
                    "confidence": round(float(score), 3),
                    "pose_metrics": pose_metrics,
                }
            return {
                "is_valid": True,
                "message": "Upward head tilt verified successfully.",
                "face_count": 1,
                "bounding_box": {"x": int(x1), "y": int(y1), "w": int(face_w), "h": int(face_h)},
                "confidence": round(float(score), 3),
                "landmarks": cls.to_serializable(landmarks),
                "pose_metrics": pose_metrics,
            }

        elif req == "down":
            if pitch_ratio <= 0.38:
                return {
                    "is_valid": False,
                    "message": "Your face is tilted upward. Please tilt your face downward as requested.",
                    "face_count": 1,
                    "confidence": round(float(score), 3),
                    "pose_metrics": pose_metrics,
                }
            if 0.38 < pitch_ratio <= 0.58 and abs(yaw_ratio) <= 0.20:
                return {
                    "is_valid": False,
                    "message": "Your face is currently facing forward. Please tilt your face downward.",
                    "face_count": 1,
                    "confidence": round(float(score), 3),
                    "pose_metrics": pose_metrics,
                }
            if 0.58 < pitch_ratio < 0.63:
                return {
                    "is_valid": False,
                    "message": "Please tilt your face slightly more downward.",
                    "face_count": 1,
                    "confidence": round(float(score), 3),
                    "pose_metrics": pose_metrics,
                }
            if pitch_ratio > 0.92:
                return {
                    "is_valid": False,
                    "message": "Head is tilted too far downward. Please raise your chin slightly.",
                    "face_count": 1,
                    "confidence": round(float(score), 3),
                    "pose_metrics": pose_metrics,
                }
            if abs(yaw_ratio) > 0.30:
                return {
                    "is_valid": False,
                    "message": "Your head is turned sideways. Please face forward while tilting downward.",
                    "face_count": 1,
                    "confidence": round(float(score), 3),
                    "pose_metrics": pose_metrics,
                }
            return {
                "is_valid": True,
                "message": "Downward head tilt verified successfully.",
                "face_count": 1,
                "bounding_box": {"x": int(x1), "y": int(y1), "w": int(face_w), "h": int(face_h)},
                "confidence": round(float(score), 3),
                "landmarks": cls.to_serializable(landmarks),
                "pose_metrics": pose_metrics,
            }

        return {
            "is_valid": False,
            "message": f"Unsupported requested orientation: {requested_orientation}",
            "face_count": 1,
            "confidence": round(float(score), 3),
        }
