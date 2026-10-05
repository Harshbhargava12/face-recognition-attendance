import json
from datetime import datetime
from app.models import db

class Student(db.Model):
    __tablename__ = 'students'

    id = db.Column(db.Integer, primary_key=True)
    roll_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    course = db.Column(db.String(80), nullable=False)
    branch = db.Column(db.String(80), nullable=False)
    semester = db.Column(db.String(20), nullable=False)
    section = db.Column(db.String(10), nullable=True)
    date_of_birth = db.Column(db.String(20), nullable=True)
    enrollment_date = db.Column(db.String(20), nullable=True)
    face_encoding = db.Column(db.Text, nullable=True)  # JSON serialized encoding(s)
    profile_image = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship to Attendance
    attendances = db.relationship('Attendance', backref='student', lazy=True, cascade="all, delete-orphan")

    def get_encodings(self):
        if not self.face_encoding:
            return []
        try:
            return json.loads(self.face_encoding)
        except Exception:
            return []

    def set_encodings(self, encodings_list):
        self.face_encoding = json.dumps(encodings_list)

    def to_dict(self, include_encoding=False):
        data = {
            'id': self.id,
            'roll_number': self.roll_number,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'course': self.course,
            'branch': self.branch,
            'semester': self.semester,
            'section': self.section,
            'date_of_birth': self.date_of_birth,
            'enrollment_date': self.enrollment_date,
            'profile_image': self.profile_image,
            'has_face_registered': bool(self.face_encoding),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_encoding:
            data['face_encodings'] = self.get_encodings()
        return data
