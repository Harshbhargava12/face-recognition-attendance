import jwt
from functools import wraps
from flask import request, jsonify, current_app
from app.models.admin import Admin

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')

        if auth_header:
            parts = auth_header.split()
            if len(parts) == 2 and parts[0].lower() == 'bearer':
                token = parts[1]
            else:
                token = auth_header

        if not token:
            return jsonify({'message': 'Authorization token is missing!'}), 401

        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            current_admin = Admin.query.get(data.get('admin_id'))
            if not current_admin:
                return jsonify({'message': 'Invalid token or admin user not found!'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired! Please login again.'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid authentication token!'}), 401
        except Exception as e:
            return jsonify({'message': f'Authentication error: {str(e)}'}), 401

        return f(current_admin, *args, **kwargs)

    return decorated
