import os
import random

from datetime import datetime, timedelta
from app import create_app
from app.models import db
from app.models.admin import Admin
from app.models.student import Student
from app.models.attendance import Attendance
from app.models.system_settings import SystemSettings
from app.services.face_recognition_service import face_service

app = create_app()

def seed_database():
    with app.app_context():
        db.create_all()

        # 1. Admin Account Creation
        admin = Admin.query.filter_by(username='admin').first()
        if not admin:
            admin = Admin(username='admin')
            admin.set_password('admin123')
            db.session.add(admin)
            print("✓ Default Admin account created (admin / admin123)")
        else:
            print("✓ Admin account already exists.")

        # 2. System Default Settings
        SystemSettings.set_val('face_match_threshold', '0.50')
        SystemSettings.set_val('institution_name', 'Institute of Engineering & Technology')
        print("✓ System settings initialized.")

        # 3. Seed Students
        demo_students_data = [
            {
                "roll_number": "231B001",
                "name": "Rahul Sharma",
                "email": "rahul.sharma@college.edu",
                "phone": "+91 9876543210",
                "course": "B.Tech",
                "branch": "Computer Science & Engineering",
                "semester": "6",
                "section": "A",
                "date_of_birth": "2003-05-14",
                "enrollment_date": "2023-08-01"
            },
            {
                "roll_number": "231B002",
                "name": "Priya Verma",
                "email": "priya.verma@college.edu",
                "phone": "+91 9876543211",
                "course": "B.Tech",
                "branch": "Computer Science & Engineering",
                "semester": "6",
                "section": "A",
                "date_of_birth": "2003-09-22",
                "enrollment_date": "2023-08-01"
            },
            {
                "roll_number": "231B003",
                "name": "Aman Singh",
                "email": "aman.singh@college.edu",
                "phone": "+91 9876543212",
                "course": "B.Tech",
                "branch": "Information Technology",
                "semester": "6",
                "section": "B",
                "date_of_birth": "2003-11-05",
                "enrollment_date": "2023-08-01"
            },
            {
                "roll_number": "231B004",
                "name": "Sneha Gupta",
                "email": "sneha.gupta@college.edu",
                "phone": "+91 9876543213",
                "course": "B.Tech",
                "branch": "Electronics & Communication",
                "semester": "4",
                "section": "A",
                "date_of_birth": "2004-02-18",
                "enrollment_date": "2024-08-01"
            },
            {
                "roll_number": "231B005",
                "name": "Vikram Malhotra",
                "email": "vikram.m@college.edu",
                "phone": "+91 9876543214",
                "course": "M.Tech",
                "branch": "Artificial Intelligence",
                "semester": "2",
                "section": "A",
                "date_of_birth": "2002-12-30",
                "enrollment_date": "2025-08-01"
            }
        ]

        created_students = []
        for s_data in demo_students_data:
            stu = Student.query.filter_by(roll_number=s_data["roll_number"]).first()
            if not stu:
                stu = Student(**s_data)
                # Generate sample 128-d face encoding vector so face service has seed data
                sample_vec = [random.uniform(-0.1, 0.1) for _ in range(128)]
                stu.set_encodings([sample_vec])
                db.session.add(stu)
                created_students.append(stu)
            else:
                created_students.append(stu)

        db.session.commit()
        print(f"✓ {len(demo_students_data)} Demo Students created/verified.")

        # 4. Seed Attendance History for past 7 days
        all_students = Student.query.all()
        today = datetime.now()
        attendance_count = 0

        for day_offset in range(7, -1, -1):
            att_date = (today - timedelta(days=day_offset)).strftime('%Y-%m-%d')
            for stu in all_students:
                existing_att = Attendance.query.filter_by(student_id=stu.id, attendance_date=att_date).first()
                if not existing_att:
                    # Randomize realistic status
                    rand_val = random.random()
                    if rand_val < 0.75:
                        status = 'Present'
                        method = 'Face Recognition'
                        time_str = f"09:{random.randint(0, 15):02d}:{random.randint(0, 59):02d}"
                    elif rand_val < 0.88:
                        status = 'Late'
                        method = 'Face Recognition'
                        time_str = f"09:{random.randint(16, 45):02d}:{random.randint(0, 59):02d}"
                    else:
                        status = 'Absent'
                        method = 'Manual'
                        time_str = "09:00:00"

                    att = Attendance(
                        student_id=stu.id,
                        attendance_date=att_date,
                        attendance_time=time_str,
                        status=status,
                        method=method,
                        remarks="Demo seed record"
                    )
                    db.session.add(att)
                    attendance_count += 1

        db.session.commit()
        print(f"✓ Seeded {attendance_count} past attendance history records.")
        print("🎉 Database seeding completed successfully!")

if __name__ == '__main__':
    seed_database()
