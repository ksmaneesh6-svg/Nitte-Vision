import cv2
import numpy as np
import random
import json
from typing import List, Dict, Any, Tuple

class AugmentationService:
    @staticmethod
    def decode_image_bytes(image_bytes: bytes) -> np.ndarray:
        """Decode image bytes into an OpenCV BGR numpy array."""
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Failed to decode image bytes into OpenCV image")
        return img

    @staticmethod
    def encode_image(img: np.ndarray, format_ext: str = ".jpg") -> bytes:
        """Encode OpenCV BGR image back to JPEG bytes."""
        params = [int(cv2.IMWRITE_JPEG_QUALITY), 95]
        success, buffer = cv2.imencode(format_ext, img, params)
        if not success:
            raise ValueError("Failed to encode OpenCV image to bytes")
        return buffer.tobytes()

    @staticmethod
    def transform_horizontal_flip(image: np.ndarray) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Transformation 1: Horizontal Flip
        Uses cv2.flip(img, 1). Always produces a verified output.
        """
        flipped = cv2.flip(image, 1)
        params = {"operation": "horizontal_flip", "flip_code": 1}
        return flipped, params

    @staticmethod
    def transform_rotation(image: np.ndarray) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Transformation 2: Rotation
        Random angle between -15 and +15 degrees, preserving dimensions.
        """
        angle = random.choice([x for x in range(-15, 16) if abs(x) >= 4])
        h, w = image.shape[:2]
        center = (w // 2, h // 2)
        rot_mat = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(image, rot_mat, (w, h), borderMode=cv2.BORDER_REFLECT_101)
        params = {"operation": "rotation", "angle_degrees": angle, "border_mode": "BORDER_REFLECT_101"}
        return rotated, params

    @staticmethod
    def transform_brightness_contrast(image: np.ndarray) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Transformation 3: Brightness and Contrast
        Changes of approximately ±20-30%, preventing overexposure.
        """
        # alpha is contrast (0.8 to 1.25), beta is brightness (-30 to +30)
        alpha = random.choice([0.80, 0.85, 0.90, 1.15, 1.20, 1.25])
        beta = random.choice([-25, -20, -15, 15, 20, 25])
        adjusted = cv2.convertScaleAbs(image, alpha=alpha, beta=beta)
        params = {"operation": "brightness_contrast", "alpha_contrast": alpha, "beta_brightness": beta}
        return adjusted, params

    @staticmethod
    def transform_crop_and_resize(image: np.ndarray) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Transformation 4: Random Crop and Resize
        Crops approx 85-95% of the original area around center and resizes back to original dimensions.
        """
        h, w = image.shape[:2]
        crop_ratio = random.uniform(0.85, 0.95)
        new_w = int(w * crop_ratio)
        new_h = int(h * crop_ratio)
        
        # Center-biased random offset to preserve the face
        max_x = w - new_w
        max_y = h - new_h
        start_x = random.randint(max_x // 4, max(max_x // 4, int(max_x * 0.75)))
        start_y = random.randint(max_y // 4, max(max_y // 4, int(max_y * 0.75)))
        
        cropped = image[start_y:start_y + new_h, start_x:start_x + new_w]
        resized = cv2.resize(cropped, (w, h), interpolation=cv2.INTER_LINEAR)
        params = {
            "operation": "crop_and_resize",
            "crop_ratio": round(crop_ratio, 3),
            "crop_box": {"x": start_x, "y": start_y, "w": new_w, "h": new_h},
            "original_size": {"w": w, "h": h}
        }
        return resized, params

    @staticmethod
    def transform_blur_or_noise(image: np.ndarray) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Transformation 5: Blur or Gaussian Noise
        Applies controlled mild Gaussian blur or mild Gaussian noise.
        """
        use_blur = random.choice([True, False])
        h, w = image.shape[:2]
        if use_blur:
            ksize = random.choice([3, 5])
            output = cv2.GaussianBlur(image, (ksize, ksize), 0)
            params = {"operation": "gaussian_blur", "kernel_size": ksize}
        else:
            mean = 0
            sigma = random.uniform(10, 20)
            gauss = np.random.normal(mean, sigma, image.shape).astype(np.float32)
            noisy = np.clip(image.astype(np.float32) + gauss, 0, 255).astype(np.uint8)
            output = noisy
            params = {"operation": "gaussian_noise", "sigma": round(sigma, 2)}
        return output, params

    @classmethod
    def generate_augmentations(cls, original_bytes: bytes) -> List[Dict[str, Any]]:
        """
        Generates exactly 5 independent augmentations for a single original image.
        Returns a list of 5 dictionaries containing:
        - 'type': transformation type name
        - 'parameters': json string of parameters
        - 'image_bytes': processed JPEG bytes
        - 'width': image width
        - 'height': image height
        """
        img = cls.decode_image_bytes(original_bytes)
        h, w = img.shape[:2]

        transformations = [
            ("horizontal_flip", cls.transform_horizontal_flip),
            ("rotation", cls.transform_rotation),
            ("brightness_contrast", cls.transform_brightness_contrast),
            ("crop_resize", cls.transform_crop_and_resize),
            ("blur_noise", cls.transform_blur_or_noise),
        ]

        augmented_results = []
        for trans_name, trans_func in transformations:
            # Independent transformation applied directly to original
            aug_img, params = trans_func(img.copy())
            aug_bytes = cls.encode_image(aug_img)
            augmented_results.append({
                "type": trans_name,
                "parameters": json.dumps(params),
                "image_bytes": aug_bytes,
                "width": w,
                "height": h,
            })

        return augmented_results
