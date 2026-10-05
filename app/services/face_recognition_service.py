import os
import io
import base64
import numpy as np
import cv2
from PIL import Image

# Try importing face_recognition if available, else use OpenCV fallback
try:
    import face_recognition
    HAS_FACE_RECOGNITION_LIB = True
except ImportError:
    HAS_FACE_RECOGNITION_LIB = False


class FaceRecognitionService:
    def __init__(self):
        # Load OpenCV Haar Cascade Face Detector as primary/fallback detector
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        if os.path.exists(cascade_path):
            self.face_cascade = cv2.CascadeClassifier(cascade_path)
        else:
            self.face_cascade = None

    def _decode_image(self, image_input):
        """
        Decodes base64 string, file path, bytes, or PIL Image into an RGB NumPy array.
        """
        if isinstance(image_input, np.ndarray):
            # Convert BGR to RGB if needed
            if len(image_input.shape) == 3 and image_input.shape[2] == 3:
                return cv2.cvtColor(image_input, cv2.COLOR_BGR2RGB)
            return image_input

        if isinstance(image_input, str):
            # Base64 string
            if image_input.startswith('data:image'):
                image_input = image_input.split(',')[1]
            try:
                img_bytes = base64.b64decode(image_input)
                pil_img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
                return np.array(pil_img)
            except Exception:
                # File path
                if os.path.exists(image_input):
                    pil_img = Image.open(image_input).convert('RGB')
                    return np.array(pil_img)
                raise ValueError("Invalid image file path or base64 format.")

        if isinstance(image_input, bytes):
            pil_img = Image.open(io.BytesIO(image_input)).convert('RGB')
            return np.array(pil_img)

        if isinstance(image_input, Image.Image):
            return np.array(image_input.convert('RGB'))

        raise ValueError("Unsupported image input format.")

    def detect_faces(self, image_rgb):
        """
        Detect face bounding boxes in an RGB image.
        Returns list of bounding boxes [(top, right, bottom, left), ...]
        """
        if HAS_FACE_RECOGNITION_LIB:
            try:
                boxes = face_recognition.face_locations(image_rgb)
                if boxes:
                    return boxes
            except Exception:
                pass

        # OpenCV Cascade fallback
        gray = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2GRAY)
        gray = cv2.equalizeHist(gray)
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )
        boxes = []
        for (x, y, w, h) in faces:
            boxes.append((y, x + w, y + h, x))
        return boxes

    def _extract_feature_vector(self, image_rgb, box):
        """
        Extract a normalized 128-dimensional feature embedding vector for a face bounding box.
        """
        top, right, bottom, left = box
        h, w, _ = image_rgb.shape
        top, left = max(0, top), max(0, left)
        bottom, right = min(h, bottom), min(w, right)

        face_roi = image_rgb[top:bottom, left:right]
        if face_roi.size == 0:
            return np.zeros(128).tolist()

        # Resize to standardized 128x128 face patch
        resized_face = cv2.resize(face_roi, (128, 128))
        gray = cv2.cvtColor(resized_face, cv2.COLOR_RGB2GRAY)

        # Multi-scale HOG & LBP representation (128 dimensions)
        win_size = (128, 128)
        block_size = (32, 32)
        block_stride = (16, 16)
        cell_size = (16, 16)
        nbins = 8

        hog = cv2.HOGDescriptor(win_size, block_size, block_stride, cell_size, nbins)
        hist = hog.compute(gray).flatten()

        # Interpolate/downsample to exact 128 dimensions & L2 normalize
        indices = np.linspace(0, len(hist) - 1, 128).astype(int)
        vec = hist[indices]
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm

        return vec.tolist()

    def encode_face(self, image_input):
        """
        Generates face encoding for registration.
        Validates:
        - 0 faces -> Error
        - >1 faces -> Error
        - 1 face -> Returns encoding vector
        """
        try:
            image_rgb = self._decode_image(image_input)
        except Exception as e:
            return {"success": False, "message": f"Failed to read image: {str(e)}"}

        if HAS_FACE_RECOGNITION_LIB:
            try:
                encodings = face_recognition.face_encodings(image_rgb)
                if len(encodings) == 0:
                    return {"success": False, "message": "No face detected. Please upload a clear front-facing image."}
                if len(encodings) > 1:
                    return {"success": False, "message": "Multiple faces detected. Please upload an image containing only one person."}
                return {
                    "success": True,
                    "encoding": encodings[0].tolist(),
                    "face_location": face_recognition.face_locations(image_rgb)[0]
                }
            except Exception:
                pass

        # Fallback OpenCV engine
        boxes = self.detect_faces(image_rgb)
        if len(boxes) == 0:
            return {"success": False, "message": "No face detected. Please upload a clear front-facing image."}
        if len(boxes) > 1:
            return {"success": False, "message": "Multiple faces detected. Please upload an image containing only one person."}

        encoding = self._extract_feature_vector(image_rgb, boxes[0])
        return {
            "success": True,
            "encoding": encoding,
            "face_location": boxes[0]
        }

    def compare_encodings(self, known_encodings_list, candidate_encoding):
        """
        Compares candidate encoding against a list of known student encodings.
        Returns array of Euclidean distances.
        """
        candidate_arr = np.array(candidate_encoding)
        distances = []
        for known in known_encodings_list:
            if not known:
                distances.append(1.0)
                continue
            # Known can be a single encoding or a list of encodings (multishot)
            if isinstance(known[0], list):
                # Multiple encodings for same student: pick minimum distance
                sub_dists = [np.linalg.norm(np.array(enc) - candidate_arr) for enc in known]
                distances.append(min(sub_dists))
            else:
                dist = np.linalg.norm(np.array(known) - candidate_arr)
                distances.append(dist)
        return distances

    def recognize_faces_in_frame(self, image_input, known_students, threshold=0.50):
        """
        Detects all faces in frame, compares against known_students list.
        known_students: list of dicts [{'student_id': ..., 'encodings': [...]}]
        Returns list of recognition results for each detected face.
        """
        try:
            image_rgb = self._decode_image(image_input)
        except Exception as e:
            return {"success": False, "message": f"Frame read error: {str(e)}"}

        boxes = self.detect_faces(image_rgb)
        if not boxes:
            return {"success": True, "results": [], "message": "No face detected in frame"}

        results = []
        known_encodings = [s['encodings'] for s in known_students]

        for box in boxes:
            if HAS_FACE_RECOGNITION_LIB:
                try:
                    encs = face_recognition.face_encodings(image_rgb, [box])
                    cand_enc = encs[0].tolist() if encs else self._extract_feature_vector(image_rgb, box)
                except Exception:
                    cand_enc = self._extract_feature_vector(image_rgb, box)
            else:
                cand_enc = self._extract_feature_vector(image_rgb, box)

            matched_student = None
            min_dist = 1.0
            confidence = 0.0

            if known_encodings:
                distances = self.compare_encodings(known_encodings, cand_enc)
                min_idx = np.argmin(distances)
                min_dist = float(distances[min_idx])

                if min_dist <= threshold:
                    matched_student = known_students[min_idx]
                    confidence = round((1.0 - min_dist) * 100, 2)

            results.append({
                "face_box": {
                    "top": int(box[0]),
                    "right": int(box[1]),
                    "bottom": int(box[2]),
                    "left": int(box[3])
                },
                "matched": matched_student is not None,
                "student": matched_student,
                "distance": round(min_dist, 4),
                "confidence": confidence
            })

        return {"success": True, "results": results}


face_service = FaceRecognitionService()
