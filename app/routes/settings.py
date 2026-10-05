from flask import Blueprint, request, jsonify
from app.models.system_settings import SystemSettings
from app.utils.auth_middleware import token_required

settings_bp = Blueprint('settings', __name__)

@settings_bp.route('', methods=['GET'])
@token_required
def get_settings(current_admin):
    threshold = SystemSettings.get_val('face_match_threshold', '0.50')
    institution_name = SystemSettings.get_val('institution_name', 'College of Engineering & Technology')
    auto_refresh_sec = SystemSettings.get_val('auto_refresh_sec', '5')

    return jsonify({
        'settings': {
            'face_match_threshold': float(threshold),
            'institution_name': institution_name,
            'auto_refresh_sec': int(auto_refresh_sec)
        }
    }), 200

@settings_bp.route('', methods=['PUT'])
@token_required
def update_settings(current_admin):
    data = request.get_json() or {}

    if 'face_match_threshold' in data:
        val = float(data['face_match_threshold'])
        if not (0.1 <= val <= 0.9):
            return jsonify({'message': 'Threshold must be between 0.1 and 0.9'}), 400
        SystemSettings.set_val('face_match_threshold', str(val))

    if 'institution_name' in data:
        SystemSettings.set_val('institution_name', str(data['institution_name']).strip())

    if 'auto_refresh_sec' in data:
        SystemSettings.set_val('auto_refresh_sec', str(data['auto_refresh_sec']))

    return jsonify({'message': 'System settings updated successfully!'}), 200
