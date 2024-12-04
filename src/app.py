"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import os
from flask import Flask, request, jsonify, url_for, send_from_directory
from flask_migrate import Migrate
from flask_swagger import swagger
from flask_cors import CORS
from flask_jwt_extended import JWTManager  # Importar JWTManager
from api.utils import APIException, generate_sitemap
from api.models import db, User, Survey, Question, Option, Vote, Invitation
from api.admin import setup_admin
from api.commands import setup_commands

ENV = "development" if os.getenv("FLASK_DEBUG") == "1" else "production"
static_file_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), '../public/')
app = Flask(__name__)
CORS(app)  # Inicializa CORS para permitir solicitudes de cualquier origen
app.url_map.strict_slashes = False

# database configuration
db_url = os.getenv("DATABASE_URL")
if db_url is not None:
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url.replace("postgres://", "postgresql://")
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:////tmp/test.db"

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# JWT Configuration
app.config["JWT_SECRET_KEY"] = "your_secret_key_here"  # Cambia esto por una clave secreta segura
app.config["JWT_TOKEN_LOCATION"] = ["headers"]  # Indica dónde estará ubicado el token (generalmente en los encabezados)
jwt = JWTManager(app)

MIGRATE = Migrate(app, db, compare_type=True)
db.init_app(app)

# add the admin
setup_admin(app)

# add the commands
setup_commands(app)

# Importing api Blueprint after app is created to avoid circular imports
from api.routes import api
# Add all endpoints from the API with an "api" prefix
app.register_blueprint(api, url_prefix='/api')

# Handle/serialize errors like a JSON object
@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code

# generate sitemap with all your endpoints
@app.route('/')
def sitemap():
    if ENV == "development":
        return generate_sitemap(app)
    return send_from_directory(static_file_dir, 'index.html')

# Serve static files and handle admin paths
@app.route('/<path:path>', methods=['GET'])
def serve_file(path):
    if path.startswith("admin"):
        # Handle admin-specific paths
        admin_path = path.replace("admin/", "")
        response = send_from_directory(static_file_dir, admin_path)
    else:
        # Serve static files or return index.html for client-side routing
        if not os.path.isfile(os.path.join(static_file_dir, path)):
            path = 'index.html'  # Devuelve index.html si no se encuentra el archivo solicitado
        response = send_from_directory(static_file_dir, path)
    response.cache_control.max_age = 0  # avoid cache memory
    return response


# this only runs if `$ python src/main.py` is executed
if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=PORT, debug=True)

# Make app available for WSGI (e.g., for use with gunicorn)
application = app