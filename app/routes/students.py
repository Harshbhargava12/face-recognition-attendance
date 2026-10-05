import os
import uuid
import json
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from werkzeug.utils import secure_filename
from app.models import db
from app.models.student import Student
from app.models.attendance import Attendance
from app.services.face_recognition_service import face_service
from app.utils.auth_middleware import token_required

students_bp = Blueprint('students', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@students_bp.route('', methods=['GET'])
@token_required
def get_students(current_admin):
    search = request.args.get('search', '').strip()
    course = request.args.get('course', '').strip()
    branch = request.args.get('branch', '').strip()

    query = Student.query

    if search:
        query = query.filter(
            (Student.name.ilike(f"%{search}%")) |
            (Student.roll_number.ilike(f"%{search}%")) |
            (Student.email.ilike(f"%{search}%"))
        )

    if course:
        query = query.filter(Student.course == course)
    if branch:
        query = query.filter(Student.branch == branch)

    students = query.order_by(Student.roll_number.asc()).all()
    result = []

    for s in students:
        s_dict = s.to_dict()
        # Compute overall student attendance percentage
        total_att = Attendance.query.filter_by(student_id=s.id).count()
        present_att = Attendance.query.filter_by(student_id=s.id, status='Present').count()
        late_att = Attendance.query.filter_by(student_id=s.id, status='Late').count()
        
        # Count present + late as attended
        attended = present_att + late_att
        s_dict['total_classes'] = total_att
        s_dict['present_count'] = present_att
        s_dict['absent_count'] = Attendance.query.filter_by(student_id=s.id, status='Absent').count()
        s_dict['late_count'] = late_att
        s_dict['attendance_percentage'] = round((attended / total_att * 100), 1) if total_att > 0 else 0.0
        result.append(s_dict)

    return jsonify({'students': result}), 200

@students_bp.route('/<int:student_id>', methods=['GET'])
@token_required
def get_student(current_admin, student_id):
    student = Student.query.get_or_404(student_id)
    s_dict = student.to_dict()

    attendances = Attendance.query.filter_by(student_id=student.id).order_by(Attendance.attendance_date.desc()).all()
    attendance_logs = [a.to_dict() for a in attendances]

    total_classes = len(attendances)
    present_cnt = sum(1 for a in attendances if a.status == 'Present')
    absent_cnt = sum(1 for a in attendances if a.status == 'Absent')
    late_cnt = sum(1 for a in attendances if a.status == 'Late')
    attended = present_cnt + late_cnt

    s_dict['total_classes'] = total_classes
    s_dict['present_count'] = present_cnt
    s_dict['absent_count'] = absent_cnt
    s_dict['late_count'] = late_cnt
    s_dict['attendance_percentage'] = round((attended / total_classes * 100), 1) if total_classes > 0 else 0.0
    s_dict['attendance_history'] = attendance_logs

    return jsonify({'student': s_dict}), 200

@students_bp.route('', methods=['POST'])
@token_required
def create_student(current_admin):
    data = request.form.to_dict() if request.form else (request.get_json() or {})

    roll_number = data.get('roll_number', '').strip()
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()

    if not roll_number or not name or not email:
        return jsonify({'message': 'Roll number, Name, and Email are required fields.'}), 400

    existing = Student.query.filter_by(roll_number=roll_number).first()
    if existing:
        return jsonify({'message': f'Student with Roll Number "{roll_number}" already exists.'}), 400

    student = Student(
        roll_number=roll_number,
        name=name,
        email=email,
        phone=data.get('phone', '').strip(),
        course=data.get('course', 'B.Tech').strip(),
        branch=data.get('branch', 'CSE').strip(),
        semester=data.get('semester', '1').strip(),
        section=data.get('section', 'A').strip(),
        date_of_birth=data.get('date_of_birth', '').strip(),
        enrollment_date=data.get('enrollment_date', datetime.now().strftime('%Y-%m-%d')).strip()
    )

    db.session.add(student)
    db.session.commit()

    # Handle image upload if provided in form
    if 'image' in request.files:
        file = request.files['image']
        if file and file.filename != '' and allowed_file(file.filename):
            ext = file.filename.rsplit('.', 1)[1].lower()
            filename = f"{student.roll_number}_{uuid.uuid4().hex[:8]}.{ext}"
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            student.profile_image = f"/uploads/profiles/{filename}"

            # Process face encoding
            res = face_service.encode_face(filepath)
            if res['success']:
                student.set_encodings([res['encoding']])
            db.session.commit()

    return jsonify({
        'message': 'Student created successfully!',
        'student': student.to_dict()
    }), 201

@students_bp.route('/<int:student_id>', methods=['PUT'])
@token_required
def update_student(current_admin, student_id):
    student = Student.query.get_or_404(student_id)
    data = request.form.to_dict() if request.form else (request.get_json() or {})

    roll_number = data.get('roll_number', student.roll_number).strip()
    if roll_number != student.roll_number:
        existing = Student.query.filter_by(roll_number=roll_number).first()
        if existing:
            return jsonify({'message': f'Roll number "{roll_number}" is already used by another student.'}), 400
        student.roll_number = roll_number

    student.name = data.get('name', student.name).strip()
    student.email = data.get('email', student.email).strip()
    student.phone = data.get('phone', student.phone).strip()
    student.course = data.get('course', student.course).strip()
    student.branch = data.get('branch', student.branch).strip()
    student.semester = data.get('semester', student.semester).strip()
    student.section = data.get('section', student.section).strip()
    student.date_of_birth = data.get('date_of_birth', student.date_of_birth).strip()

    db.session.commit()
    return jsonify({'message': 'Student details updated!', 'student': student.to_dict()}), 200

@students_bp.route('/<int:student_id>', methods=['DELETE'])
@token_required
def delete_student(current_admin, student_id):
    student = Student.query.get_or_404(student_id)

    # Clean up profile image file if exists
    if student.profile_image:
        filename = os.path.basename(student.profile_image)
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass

    db.session.delete(student)
    db.session.commit()
    return jsonify({'message': 'Student record deleted successfully.'}), 200

@students_bp.route('/<int:student_id>/face', methods=['POST'])
@token_required
def register_face(current_admin, student_id):
    student = Student.query.get_or_404(student_id)
    
    # Check if request has base64 array of frames or single file
    data = request.get_json() or {}
    encodings_to_store = []
    saved_image_url = None

    if 'image_base64' in data or 'frames' in data:
        frames = data.get('frames', [])
        if not frames and 'image_base64' in data:
            frames = [data['image_base64']]

        for idx, frame in enumerate(frames):
            res = face_service.encode_face(frame)
            if not res['success']:
                return jsonify({'message': res['message']}), 400
            encodings_to_store.append(res['encoding'])

        # Save first frame as profile picture
        try:
            filename = f"{student.roll_number}_{uuid.uuid4().hex[:8]}.jpg"
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            frame_str = frames[0].split(',')[1] if ',' in frames[0] else frames[0]
            with open(filepath, 'wb') as f:
                f.write(face_service._decode_image(frame_str).tobytes())
            saved_image_url = f"/uploads/profiles/{filename}"
        except Exception:
            pass

    elif 'file' in request.files:
        file = request.files['file']
        if not file or not allowed_file(file.filename):
            return jsonify({'message': 'Invalid file format. Please upload JPG or PNG image.'}), 400

        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{student.roll_number}_{uuid.uuid4().hex[:8]}.{ext}"
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        saved_image_url = f"/uploads/profiles/{filename}"

        res = face_service.encode_face(filepath)
        if not res['success']:
            # Remove invalid file
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({'message': res['message']}), 400

        encodings_to_store.append(res['encoding'])
    else:
        return jsonify({'message': 'No face image or webcam frames provided.'}), 400

    student.set_encodings(encodings_to_store)
    if saved_image_url:
        student.profile_image = saved_image_url

    db.session.commit()

    return jsonify({
        'message': 'Student face registered successfully!',
        'student': student.to_dict()
    }), 200
