import io
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_attendance_pdf(attendance_records, metadata=None):
    """
    Generates a PDF attendance report document.
    Returns bytes buffer.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    story = []
    styles = getSampleStyleSheet()

    # Custom styles
    header_style = ParagraphStyle(
        'HeaderTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#1E293B'),
        alignment=1 # Center
    )

    subtitle_style = ParagraphStyle(
        'SubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#3B82F6'),
        alignment=1
    )

    meta_style = ParagraphStyle(
        'MetaText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569')
    )

    col_name = metadata.get('institution_name', 'FACE RECOGNITION ATTENDANCE SYSTEM') if metadata else 'FACE RECOGNITION ATTENDANCE SYSTEM'
    date_range = metadata.get('date_range', f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M')}") if metadata else ''

    story.append(Paragraph(col_name.upper(), header_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("OFFICIAL ATTENDANCE REPORT", subtitle_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#3B82F6'), spaceAfter=15))

    # Metadata summary
    total_records = len(attendance_records)
    present_cnt = sum(1 for r in attendance_records if r.get('status') == 'Present')
    absent_cnt = sum(1 for r in attendance_records if r.get('status') == 'Absent')
    late_cnt = sum(1 for r in attendance_records if r.get('status') == 'Late')
    att_pct = round((present_cnt / total_records * 100), 1) if total_records > 0 else 0.0

    meta_table_data = [
        [
            Paragraph(f"<b>Date Range:</b> {date_range}", meta_style),
            Paragraph(f"<b>Total Records:</b> {total_records}", meta_style)
        ],
        [
            Paragraph(f"<b>Present:</b> {present_cnt} | <b>Absent:</b> {absent_cnt} | <b>Late:</b> {late_cnt}", meta_style),
            Paragraph(f"<b>Overall Attendance Rate:</b> {att_pct}%", meta_style)
        ]
    ]
    meta_table = Table(meta_table_data, colWidths=[270, 250])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 15))

    # Attendance Records Table
    table_data = [
        ['#', 'Roll No', 'Student Name', 'Course / Branch', 'Date', 'Time', 'Status', 'Method']
    ]

    for idx, rec in enumerate(attendance_records, start=1):
        stu = rec.get('student') or {}
        table_data.append([
            str(idx),
            stu.get('roll_number', 'N/A'),
            stu.get('name', 'N/A'),
            f"{stu.get('course', '')} - {stu.get('branch', '')}",
            rec.get('attendance_date', ''),
            rec.get('attendance_time', ''),
            rec.get('status', ''),
            rec.get('method', '')
        ])

    rec_table = Table(table_data, colWidths=[25, 65, 110, 110, 65, 55, 50, 60])
    rec_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('TOPPADDING', (0,0), (-1,0), 6),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
        ('ALIGN', (6,0), (6,-1), 'CENTER'),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,1), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
    ]))

    story.append(rec_table)
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
