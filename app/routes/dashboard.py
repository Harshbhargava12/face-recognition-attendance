from datetime import datetime, timedelta
from flask import Blueprint, jsonify
from sqlalchemy import func
from app.models import db
from app.models.student import Student
from app.models.attendance import Attendance
from app.utils.auth_middleware import token_required

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('', methods=['GET'])
@token_required
def get_dashboard_stats(current_admin):
    today_str = datetime.now().strftime('%Y-%m-%d')

    total_students = Student.query.count()
    present_today = Attendance.query.filter_by(attendance_date=today_str, status='Present').count()
    late_today = Attendance.query.filter_by(attendance_date=today_str, status='Late').count()
    absent_today_recorded = Attendance.query.filter_by(attendance_date=today_str, status='Absent').count()
    
    # Students without attendance record today are considered absent by default for today's summary
    unrecorded_today = max(0, total_students - (present_today + late_today + absent_today_recorded))
    total_absent_today = absent_today_recorded + unrecorded_today

    total_records = Attendance.query.count()

    overall_present = Attendance.query.filter(Attendance.status.in_(['Present', 'Late'])).count()
    overall_attendance_pct = round((overall_present / total_records * 100), 1) if total_records > 0 else 0.0

    # Weekly Attendance (Last 7 Days)
    weekly_chart = []
    for i in range(6, -1, -1):
        day_dt = datetime.now() - timedelta(days=i)
        day_str = day_dt.strftime('%Y-%m-%d')
        day_label = day_dt.strftime('%b %d')

        p_cnt = Attendance.query.filter_by(attendance_date=day_str, status='Present').count()
        l_cnt = Attendance.query.filter_by(attendance_date=day_str, status='Late').count()
        a_cnt = Attendance.query.filter_by(attendance_date=day_str, status='Absent').count()

        weekly_chart.append({
            'date': day_str,
            'day': day_label,
            'present': p_cnt + l_cnt,
            'absent': a_cnt,
            'late': l_cnt
        })

    # Status Breakdown (Pie Chart)
    status_breakdown = [
        {'name': 'Present Today', 'value': present_today + late_today, 'color': '#22C55E'},
        {'name': 'Absent Today', 'value': total_absent_today, 'color': '#EF4444'},
    ]

    # Course-wise attendance percentage
    courses = db.session.query(Student.course).distinct().all()
    course_chart = []
    for (c_name,) in courses:
        if not c_name:
            continue
        c_students = Student.query.filter_by(course=c_name).all()
        s_ids = [s.id for s in c_students]
        if not s_ids:
            continue
        c_tot = Attendance.query.filter(Attendance.student_id.in_(s_ids)).count()
        c_pres = Attendance.query.filter(Attendance.student_id.in_(s_ids), Attendance.status.in_(['Present', 'Late'])).count()
        c_pct = round((c_pres / c_tot * 100), 1) if c_tot > 0 else 0.0
        course_chart.append({
            'course': c_name,
            'students': len(c_students),
            'attendance_percentage': c_pct
        })

    # Recent Attendance Activity (Last 10 records)
    recent_activity = Attendance.query.join(Student).order_by(Attendance.created_at.desc()).limit(10).all()

    return jsonify({
        'stats': {
            'total_students': total_students,
            'present_today': present_today + late_today,
            'absent_today': total_absent_today,
            'attendance_percentage': overall_attendance_pct,
            'total_attendance_records': total_records
        },
        'weekly_chart': weekly_chart,
        'status_breakdown': status_breakdown,
        'course_chart': course_chart,
        'recent_activity': [r.to_dict() for r in recent_activity]
    }), 200
