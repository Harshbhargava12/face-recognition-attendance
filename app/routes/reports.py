import csv
import io
from datetime import datetime
from flask import Blueprint, request, jsonify, make_response, send_file
from app.models import db
from app.models.student import Student
from app.models.attendance import Attendance
from app.models.system_settings import SystemSettings
from app.utils.auth_middleware import token_required
from app.utils.pdf_generator import generate_attendance_pdf

reports_bp = Blueprint('reports', __name__)

def _get_filtered_records():
    start_date = request.args.get('start_date', '').strip()
    end_date = request.args.get('end_date', '').strip()
    student_id = request.args.get('student_id', '').strip()
    course = request.args.get('course', '').strip()
    branch = request.args.get('branch', '').strip()

    query = Attendance.query.join(Student)

    if start_date:
        query = query.filter(Attendance.attendance_date >= start_date)
    if end_date:
        query = query.filter(Attendance.attendance_date <= end_date)
    if student_id:
        query = query.filter(Attendance.student_id == student_id)
    if course:
        query = query.filter(Student.course == course)
    if branch:
        query = query.filter(Student.branch == branch)

    return query.order_by(Attendance.attendance_date.desc(), Attendance.attendance_time.desc()).all()


@reports_bp.route('', methods=['GET'])
@token_required
def get_reports_data(current_admin):
    records = _get_filtered_records()
    record_dicts = [r.to_dict() for r in records]

    # Summary metrics
    total = len(records)
    present = sum(1 for r in records if r.status in ['Present', 'Late'])
    absent = sum(1 for r in records if r.status == 'Absent')
    pct = round((present / total * 100), 1) if total > 0 else 0.0

    return jsonify({
        'total': total,
        'present': present,
        'absent': absent,
        'attendance_percentage': pct,
        'records': record_dicts
    }), 200


@reports_bp.route('/csv', methods=['GET'])
@token_required
def download_csv(current_admin):
    records = _get_filtered_records()
    si = io.StringIO()
    cw = csv.writer(si)

    # Header
    cw.writerow([
        'S.No', 'Roll Number', 'Student Name', 'Email', 'Course',
        'Branch', 'Semester', 'Section', 'Attendance Date',
        'Attendance Time', 'Status', 'Method', 'Remarks'
    ])

    for idx, r in enumerate(records, start=1):
        s = r.student
        cw.writerow([
            idx,
            s.roll_number if s else 'N/A',
            s.name if s else 'N/A',
            s.email if s else 'N/A',
            s.course if s else 'N/A',
            s.branch if s else 'N/A',
            s.semester if s else 'N/A',
            s.section if s else 'N/A',
            r.attendance_date,
            r.attendance_time,
            r.status,
            r.method,
            r.remarks or ''
        ])

    output = make_response(si.getvalue())
    output.headers["Content-Disposition"] = f"attachment; filename=attendance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    output.headers["Content-type"] = "text/csv"
    return output


@reports_bp.route('/pdf', methods=['GET'])
@token_required
def download_pdf(current_admin):
    records = _get_filtered_records()
    records_dict = [r.to_dict() for r in records]

    institution_name = SystemSettings.get_val('institution_name', 'FACE RECOGNITION ATTENDANCE SYSTEM')
    start_date = request.args.get('start_date', 'Beginning')
    end_date = request.args.get('end_date', 'Present')

    metadata = {
        'institution_name': institution_name,
        'date_range': f"{start_date} to {end_date}"
    }

    pdf_bytes = generate_attendance_pdf(records_dict, metadata)

    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"attendance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    )
