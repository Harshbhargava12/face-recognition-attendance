import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from app.config import Config
from app.models import db

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Ensure upload and database folders exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    db_dir = os.path.dirname(app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', ''))
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)

    # Initialize Extensions
    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": app.config['CORS_ORIGINS']}})

    # Static uploads route
    @app.route('/uploads/profiles/<filename>')
    def uploaded_file(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    # Register Blueprints
    from app.routes.auth import auth_bp
    from app.routes.students import students_bp
    from app.routes.attendance import attendance_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.reports import reports_bp
    from app.routes.settings import settings_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(students_bp, url_prefix='/api/students')
    app.register_blueprint(attendance_bp, url_prefix='/api/attendance')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(settings_bp, url_prefix='/api/settings')

    with app.app_context():
        db.create_all()

    return app
