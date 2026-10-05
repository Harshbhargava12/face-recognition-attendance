import datetime
import jwt
from flask import Blueprint, request, jsonify, current_app
from app.models.admin import Admin, db
from app.utils.auth_middleware import token_required

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({'message': 'Username and password are required.'}), 400

    admin = Admin.query.filter_by(username=username).first()
    if not admin or not admin.check_password(password):
        return jsonify({'message': 'Invalid username or password.'}), 401

    token = jwt.encode({
        'admin_id': admin.id,
        'username': admin.username,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, current_app.config['SECRET_KEY'], algorithm='HS256')

    return jsonify({
        'message': 'Login successful!',
        'token': token,
        'admin': admin.to_dict()
    }), 200

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_admin):
    return jsonify({'admin': current_admin.to_dict()}), 200

@auth_bp.route('/change-password', methods=['POST'])
@token_required
def change_password(current_admin):
    data = request.get_json() or {}
    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')

    if not current_password or not new_password:
        return jsonify({'message': 'Both current and new password are required.'}), 400

    if not current_admin.check_password(current_password):
        return jsonify({'message': 'Incorrect current password.'}), 400

    current_admin.set_password(new_password)
    db.session.commit()

    return jsonify({'message': 'Password updated successfully!'}), 200
