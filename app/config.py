import os

BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'super-secret-key-face-attendance-2026')
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        f"sqlite:///{os.path.join(BASE_DIR, 'database', 'attendance.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads', 'profiles')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max limit
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')
    
    # Face Recognition Threshold (lower distance = stricter match)
    # Default 0.50 strikes optimal balance between precision & recall
    DEFAULT_FACE_MATCH_THRESHOLD = float(os.environ.get('FACE_MATCH_THRESHOLD', 0.50))
