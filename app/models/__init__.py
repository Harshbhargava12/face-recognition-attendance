from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from app.models.admin import Admin
from app.models.student import Student
from app.models.attendance import Attendance
from app.models.system_settings import SystemSettings
