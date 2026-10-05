from datetime import datetime
from app.models import db

class Attendance(db.Model):
    __tablename__ = 'attendance'

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    attendance_date = db.Column(db.String(10), nullable=False, index=True)  # Format: YYYY-MM-DD
    attendance_time = db.Column(db.String(8), nullable=False)   # Format: HH:MM:SS
    status = db.Column(db.String(20), nullable=False, default='Present') # Present, Absent, Late
    method = db.Column(db.String(50), nullable=False, default='Face Recognition') # Face Recognition, Manual
    remarks = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('student_id', 'attendance_date', name='uq_student_date_attendance'),
    )

    def to_dict(self):
        student_data = self.student.to_dict() if self.student else None
        return {
            'id': self.id,
            'student_id': self.student_id,
            'student': student_data,
            'attendance_date': self.attendance_date,
            'attendance_time': self.attendance_time,
            'status': self.status,
            'method': self.method,
            'remarks': self.remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
