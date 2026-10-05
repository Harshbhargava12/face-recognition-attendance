from datetime import datetime
from flask import Blueprint, request, jsonify
from app.models import db
from app.models.student import Student
from app.models.attendance import Attendance
from app.models.system_settings import SystemSettings
from app.services.face_recognition_service import face_service
from app.utils.auth_middleware import token_required

attendance_bp = Blueprint('attendance', __name__)

@attendance_bp.route('/recognize', methods=['POST'])
@token_required
def recognize_and_mark(current_admin):
    data = request.get_json() or {}
    frame = data.get('image_base64') or data.get('frame')

    if not frame:
        return jsonify({'message': 'No webcam image frame provided.'}), 400

    # Retrieve current configurable threshold or default 0.50
    threshold_str = SystemSettings.get_val('face_match_threshold', '0.50')
    try:
        threshold = float(threshold_str)
    except ValueError:
        threshold = 0.50

    # Fetch registered students with non-empty face encodings
    students = Student.query.filter(Student.face_encoding.isnot(None)).all()
    known_students = []
    for s in students:
        encs = s.get_encodings()
        if encs:
            known_students.append({
                'id': s.id,
                'roll_number': s.roll_number,
                'name': s.name,
                'course': s.course,
                'branch': s.branch,
                'encodings': encs,
                'student_data': s.to_dict()
            })

    if not known_students:
        return jsonify({
            'success': True,
            'message': 'No registered student face encodings found in database.',
            'results': []
        }), 200

    rec_res = face_service.recognize_faces_in_frame(frame, known_students, threshold=threshold)
    if not rec_res['success']:
        return jsonify({'message': rec_res['message']}), 400

    processed_results = []
    today_date = datetime.now().strftime('%Y-%m-%d')
    current_time = datetime.now().strftime('%H:%M:%S')

    for face_item in rec_res.get('results', []):
        if face_item['matched'] and face_item['student']:
            stu_info = face_item['student']['student_data']
            stu_id = face_item['student']['id']

            # Check if attendance already marked today
            existing_att = Attendance.query.filter_by(
                student_id=stu_id,
                attendance_date=today_date
            ).first()

            if existing_att:
                status_msg = "Attendance Already Marked"
                att_status = existing_att.status
                is_newly_marked = False
            else:
                new_att = Attendance(
                    student_id=stu_id,
                    attendance_date=today_date,
                    attendance_time=current_time,
                    status='Present',
                    method='Face Recognition'
                )
                try:
                    db.session.add(new_att)
                    db.session.commit()
                    status_msg = "Attendance Marked Successfully"
                    att_status = 'Present'
                    is_newly_marked = True
                except Exception:
                    db.session.rollback()
                    existing_att = Attendance.query.filter_by(
                        student_id=stu_id,
                        attendance_date=today_date
                    ).first()
                    status_msg = "Attendance Already Marked"
                    att_status = existing_att.status if existing_att else 'Present'
                    is_newly_marked = False

            processed_results.append({
                'status': 'MATCHED',
                'is_newly_marked': is_newly_marked,
                'message': status_msg,
                'student': stu_info,
                'attendance_date': today_date,
                'attendance_time': existing_att.attendance_time if existing_att else current_time,
                'attendance_status': att_status,
                'confidence': face_item['confidence'],
                'distance': face_item['distance'],
                'face_box': face_item['face_box']
            })
        else:
            processed_results.append({
                'status': 'UNKNOWN_FACE',
                'message': 'Unknown Face',
                'student': None,
                'distance': face_item['distance'],
                'confidence': 0.0,
                'face_box': face_item['face_box']
            })

    return jsonify({
        'success': True,
        'results': processed_results,
        'count': len(processed_results)
    }), 200


@attendance_bp.route('/manual', methods=['POST'])
@token_required
def mark_manual_attendance(current_admin):
    data = request.get_json() or {}
    student_id = data.get('student_id')
    att_date = data.get('attendance_date', datetime.now().strftime('%Y-%m-%d')).strip()
    status = data.get('status', 'Present').strip() # Present, Absent, Late
    remarks = data.get('remarks', 'Manual entry by admin').strip()

    if not student_id or not att_date:
        return jsonify({'message': 'Student ID and Date are required.'}), 400

    student = Student.query.get(student_id)
    if not student:
        return jsonify({'message': 'Student not found.'}), 404

    current_time = datetime.now().strftime('%H:%M:%S')
    existing = Attendance.query.filter_by(student_id=student_id, attendance_date=att_date).first()

    if existing:
        existing.status = status
        existing.method = 'Manual'
        existing.remarks = remarks
        message = f"Attendance updated to '{status}' for {student.name} on {att_date}."
    else:
        new_att = Attendance(
            student_id=student_id,
            attendance_date=att_date,
            attendance_time=current_time,
            status=status,
            method='Manual',
            remarks=remarks
        )
        db.session.add(new_att)
        message = f"Attendance marked as '{status}' for {student.name} on {att_date}."

    db.session.commit()
    return jsonify({'message': message}), 200


@attendance_bp.route('', methods=['GET'])
@token_required
def get_attendance_records(current_admin):
    date_str = request.args.get('date', '').strip()
    start_date = request.args.get('start_date', '').strip()
    end_date = request.args.get('end_date', '').strip()
    course = request.args.get('course', '').strip()
    branch = request.args.get('branch', '').strip()
    status = request.args.get('status', '').strip()
    search = request.args.get('search', '').strip()

    query = Attendance.query.join(Student)

    if date_str:
        query = query.filter(Attendance.attendance_date == date_str)
    elif start_date and end_date:
        query = query.filter(Attendance.attendance_date.between(start_date, end_date))

    if course:
        query = query.filter(Student.course == course)
    if branch:
        query = query.filter(Student.branch == branch)
    if status:
        query = query.filter(Attendance.status == status)

    if search:
        query = query.filter(
            (Student.name.ilike(f"%{search}%")) |
            (Student.roll_number.ilike(f"%{search}%"))
        )

    records = query.order_by(Attendance.attendance_date.desc(), Attendance.attendance_time.desc()).all()
    return jsonify({'records': [r.to_dict() for r in records]}), 200


@attendance_bp.route('/date/<date_str>', methods=['GET'])
@token_required
def get_attendance_by_date(current_admin, date_str):
    records = Attendance.query.filter_by(attendance_date=date_str).order_by(Attendance.attendance_time.desc()).all()
    return jsonify({'records': [r.to_dict() for r in records]}), 200


@attendance_bp.route('/student/<int:student_id>', methods=['GET'])
@token_required
def get_student_attendance(current_admin, student_id):
    records = Attendance.query.filter_by(student_id=student_id).order_by(Attendance.attendance_date.desc()).all()
    return jsonify({'records': [r.to_dict() for r in records]}), 200
