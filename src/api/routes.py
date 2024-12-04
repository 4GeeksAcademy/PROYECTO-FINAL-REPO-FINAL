from flask import Flask, Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from api.models import db, User, Survey, Question, Option, Vote
import jwt
import datetime
from flask_cors import CORS
import openai
import os
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity


app = Flask(__name__)


CORS(app, resources={r"/*": {"origins": "*"}})

api = Blueprint('api', __name__)

SECRET_KEY = 'your_secret_key_here' 

@api.route('/users/<int:user_id>/votes/surveys', methods=['GET'])
@jwt_required()
def get_user_voted_surveys(user_id):
    current_user_id = get_jwt_identity()
    if current_user_id != user_id:
        return jsonify({"error": "Unauthorized access"}), 403


    votes = Vote.query.filter_by(user_id=user_id).all()
    if not votes:
        return jsonify([]), 200

    survey_ids = {vote.survey_id for vote in votes}
    surveys = Survey.query.filter(Survey.id.in_(survey_ids)).all()

    surveys_list = [
        {
            "id": survey.id,
            "creator_id": survey.creator_id,
            "title": survey.title,
            "description": survey.description,
            "start_date": survey.start_date,
            "end_date": survey.end_date,
            "status": survey.status
        } for survey in surveys
    ]

    return jsonify(surveys_list), 200



@api.route('/surveys/full', methods=['POST'])
@jwt_required()
def create_full_survey():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    try:

        new_survey = Survey(
            creator_id=data['creator_id'],
            title=data['title'],
            description=data.get('description'),
            start_date=data.get('start_date'),
            end_date=data.get('end_date'),
            is_public=data.get('is_public', True),
            status=data.get('status', 'draft'),
            type=data['type']
        )
        db.session.add(new_survey)
        db.session.flush()  

        survey_response = {
            "survey_id": new_survey.id,
            "questions": []
        }


        for question_data in data.get('questions', []):
            new_question = Question(
                survey_id=new_survey.id,
                question_text=question_data['question_text'],
                question_type=question_data['question_type'],
                order=question_data.get('order'),
                required=question_data.get('required', True)
            )
            db.session.add(new_question)
            db.session.flush()

            question_response = {
                "question_id": new_question.id,
                "options": []
            }


            for option_data in question_data.get('options', []):
                new_option = Option(
                    question_id=new_question.id,
                    option_text=option_data['option_text'],
                    order=option_data.get('order')
                )
                db.session.add(new_option)
                db.session.flush() 

                question_response["options"].append({
                    "option_id": new_option.id,
                    "option_text": new_option.option_text
                })

            survey_response["questions"].append(question_response)

        db.session.commit()
        return jsonify({"message": "Survey, questions, and options created successfully", "survey": survey_response}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e), "message": "There was an error processing your request."}), 500

        

## USERS ENDPOINTS

@api.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    users_list = [
        {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "created_at": user.created_at,
            "is_active": user.is_active
        } for user in users
    ]
    return jsonify(users_list), 200

@api.route('/users/<int:id>', methods=['GET'])
@jwt_required()
def get_user(id):
    user = User.query.options(db.joinedload(User.surveys_created)).get_or_404(id)
    user_data = {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "created_at": user.created_at,
        "is_active": user.is_active,
        "surveys": [survey.serialize() for survey in user.surveys_created]
    }
    return jsonify(user_data)





@api.route('/surveys/full', methods=['PUT'])
@jwt_required()
def update_full_survey():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    try:

        survey = Survey.query.get(data['id'])
        if not survey:
            return jsonify({"error": "Survey not found"}), 404

        current_user_id = get_jwt_identity()
        if survey.creator_id != current_user_id:
            return jsonify({"error": "Unauthorized access"}), 403


        survey.title = data.get('title', survey.title)
        survey.description = data.get('description', survey.description)
        survey.start_date = data.get('start_date', survey.start_date)
        survey.end_date = data.get('end_date', survey.end_date)
        survey.status = data.get('status', survey.status)

        for question_data in data.get('questions', []):
            question = Question.query.get(question_data['id'])
            if question:
                question.question_text = question_data.get('question_text', question.question_text)
                question.order = question_data.get('order', question.order)


                for option_data in question_data.get('options', []):
                    option = Option.query.get(option_data['id'])
                    if option:
                        option.option_text = option_data.get('option_text', option.option_text)
                        option.order = option_data.get('order', option.order)
                    else:
      
                        new_option = Option(
                            question_id=question.id,
                            option_text=option_data['option_text'],
                            order=option_data.get('order')
                        )
                        db.session.add(new_option)
            else:
         
                new_question = Question(
                    survey_id=survey.id,
                    question_text=question_data['question_text'],
                    question_type=question_data['question_type'],
                    order=question_data.get('order', len(survey.questions) + 1),
                    required=question_data.get('required', True)
                )
                db.session.add(new_question)
                db.session.flush()


                for option_data in question_data.get('options', []):
                    new_option = Option(
                        question_id=new_question.id,
                        option_text=option_data['option_text'],
                        order=option_data.get('order')
                    )
                    db.session.add(new_option)

        db.session.commit()
        return jsonify({"message": "Survey updated successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e), "message": "There was an error processing your request."}), 500




@api.route('/users', methods=['POST'])
def create_user():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    existing_user = User.query.filter_by(email=data['email']).first()
    if existing_user:
        return jsonify({"error": "Email already registered"}), 409

    password_hash = generate_password_hash(data['password'], method='pbkdf2:sha256')
    new_user = User(email=data['email'], password_hash=password_hash, full_name=data['full_name'])
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User created successfully"}), 201

@api.route('/users/<int:id>', methods=['PUT'])
@jwt_required()
def update_user(id):
    user = User.query.get_or_404(id)
    data = request.get_json()
    user.email = data.get('email', user.email)
    user.full_name = data.get('full_name', user.full_name)
    user.is_active = data.get('is_active', user.is_active)
    user.password_hash = generate_password_hash(data.get('password', user.password_hash), method='pbkdf2:sha256')
    db.session.commit()
    return jsonify({
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "created_at": user.created_at,
        "is_active": user.is_active
    })


from api.utils import send_reset_email

@api.route('/users/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.get_json()
        email = data.get('email')

        if not email:
            return jsonify({"error": "Email is required"}), 400


        user = User.query.filter_by(email=email).first()
        if user is None:
            return jsonify({"message": "If the email is registered, you will receive password reset instructions."}), 200


        reset_token = create_access_token(identity=user.id, expires_delta=False)

 
        send_reset_email(user, reset_token)

        return jsonify({"message": "If the email is registered, you will receive password reset instructions."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api.route('/users/<int:id>/update-password', methods=['PUT'])
@jwt_required()
def update_password(id):
    try:
   
        current_user_id = get_jwt_identity()
        if current_user_id != id:
            return jsonify({"error": "Unauthorized access"}), 403

   
        data = request.get_json()
        new_password = data.get('password')
        if not new_password:
            return jsonify({"error": "Password is required"}), 400

     
        password_hash = generate_password_hash(new_password, method='pbkdf2:sha256', salt_length=16)

    
        user = User.query.get_or_404(id)
        user.password_hash = password_hash
        db.session.commit()

        return jsonify({"message": "Password updated successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

## LOGIN ENDPOINT

@api.route('/login', methods=['POST'])
def login_user():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()

    if user and check_password_hash(user.password_hash, password):
        token = jwt.encode({
            'sub': user.id,
            'user_id': user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        }, SECRET_KEY, algorithm='HS256')

        return jsonify({"message": "Login successful", "token": token, "user_id": user.id}), 200
    else:
        return jsonify({"error": "Invalid email or password"}), 401


## SURVEYS ENDPOINTS
    
@api.route('/surveys', methods=['GET'])
def get_surveys():
    surveys = Survey.query.all()
    surveys_list = [
        {
            "id": survey.id,
            "creator_id": survey.creator_id,
            "title": survey.title,
            "description": survey.description,
            "start_date": survey.start_date,
            "end_date": survey.end_date,
            "is_public": survey.is_public,
            "status": survey.status,
            "type": survey.type
        } for survey in surveys
    ]
    return jsonify(surveys_list), 200

@api.route('/surveys', methods=['POST'])
@jwt_required()
def create_survey():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        new_survey = Survey(
            creator_id=data['creator_id'],
            title=data['title'],
            description=data.get('description'),
            start_date=data.get('start_date'),
            end_date=data.get('end_date'),
            is_public=data.get('is_public', True),
            status=data.get('status', 'draft'),
            type=data['type']
        )

        db.session.add(new_survey)
        db.session.commit()

        return jsonify({"message": "Survey created successfully", "id": new_survey.id}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api.route('/surveys/<int:id>', methods=['GET'])
def get_survey(id):
    try:
        survey = Survey.query.options(db.joinedload(Survey.questions).joinedload(Question.options)).get_or_404(id)

        survey_data = {
            "id": survey.id,
            "creator_id": survey.creator_id,
            "title": survey.title,
            "description": survey.description,
            "start_date": survey.start_date,
            "end_date": survey.end_date,
            "is_public": survey.is_public,
            "status": survey.status,
            "type": survey.type,
            "questions": [
                {
                    "id": question.id,
                    "question_text": question.question_text,
                    "question_type": question.question_type,
                    "order": question.order,
                    "required": question.required,
                    "options": [
                        {
                            "id": option.id,
                            "option_text": option.option_text,
                            "order": option.order
                        } for option in question.options
                    ]
                } for question in survey.questions
            ]
        }
        return jsonify(survey_data), 200

    except Exception as e:
        return jsonify({"error": str(e), "message": "There was an error processing your request."}), 500
    
    

@api.route('/surveys/<int:id>', methods=['PUT'])
@jwt_required()
def update_survey(id):
    survey = Survey.query.get_or_404(id)
    data = request.get_json()
    survey.title = data.get('title', survey.title)
    survey.description = data.get('description', survey.description)
    survey.is_public = data.get('is_public', survey.is_public)
    survey.status = data.get('status', survey.status)
    db.session.commit()
    return jsonify({
        "id": survey.id,
        "creator_id": survey.creator_id,
        "title": survey.title,
        "description": survey.description,
        "start_date": survey.start_date,
        "end_date": survey.end_date,
        "is_public": survey.is_public,
        "status": survey.status,
        "type": survey.type
    })

@api.route('/surveys/<int:id>/status', methods=['PUT'])
@jwt_required()
def update_survey_status(id):
    # Endpoint to update the status of a survey by ID
    data = request.get_json()
    if not data or 'status' not in data:
        return jsonify({"error": "Missing status field"}), 400

    survey = Survey.query.get(id)
    if not survey:
        return jsonify({"error": "Survey not found"}), 404

    survey.status = data['status']
    db.session.commit()
    return jsonify(survey.serialize()), 200




@api.route('/surveys/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_full_survey(id):
    try:
    
        survey = Survey.query.get_or_404(id)

  
        current_user_id = get_jwt_identity()
        if survey.creator_id != current_user_id:
            return jsonify({"error": "Unauthorized access"}), 403

       
        for question in survey.questions:
            for option in question.options:
                Vote.query.filter_by(option_id=option.id).delete()

     
        for question in survey.questions:
            Option.query.filter_by(question_id=question.id).delete()

    
        Question.query.filter_by(survey_id=survey.id).delete()

   
        db.session.delete(survey)


        db.session.commit()

        return jsonify({"message": "Survey and all associated data deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e), "message": "There was an error processing your request."}), 500


## QUESTIONS ENDPOINTS

@api.route('/questions', methods=['POST'])
@jwt_required()
def create_question():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        survey = Survey.query.get_or_404(data['survey_id'])
        new_question = Question(
            survey_id=data['survey_id'],
            question_text=data['question_text'],
            question_type=data['question_type'],
            order=data.get('order'),
            required=data.get('required', True)
        )
        db.session.add(new_question)
        db.session.commit()

        return jsonify({
            "message": "Question created successfully",
            "id": new_question.id,
            "question_text": new_question.question_text
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@api.route('/questions/<int:id>', methods=['GET'])
def get_question(id):
    question = Question.query.get_or_404(id)
    survey = Survey.query.get_or_404(question.survey_id)
    question_data = {
        "id": question.id,
        "survey_id": question.survey_id,
        "question_text": question.question_text,
        "question_type": question.question_type,
        "order": question.order,
        "required": question.required
    }
    return jsonify(question_data)

@api.route('/questions', methods=['GET'])
def get_questions():
    questions = Question.query.all()
    return jsonify([question.serialize() for question in questions]), 200

@api.route('/questions/<int:id>', methods=['PUT'])
@jwt_required()
def update_question(id):
    question = Question.query.get_or_404(id)
    survey = Survey.query.get_or_404(question.survey_id)
    data = request.get_json()
    question.question_text = data.get('question_text', question.question_text)
    question.question_type = data.get('question_type', question.question_type)
    question.required = data.get('required', question.required)
    db.session.commit()
    return jsonify({
        "id": question.id,
        "survey_id": question.survey_id,
        "question_text": question.question_text,
        "question_type": question.question_type,
        "order": question.order,
        "required": question.required
    })

@api.route('/questions/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_question(id):
    question = Question.query.get_or_404(id)
    survey = Survey.query.get_or_404(question.survey_id)
    db.session.delete(question)
    db.session.commit()
    return jsonify({'message': 'Question deleted'}), 200

## OPTIONS ENDPOINTS

@api.route('/options', methods=['POST'])
@jwt_required()
def create_option():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    question = Question.query.get_or_404(data['question_id'])
    survey = Survey.query.get_or_404(question.survey_id)
    new_option = Option(
        question_id=data['question_id'],
        option_text=data['option_text'],
        order=data.get('order')
    )
    db.session.add(new_option)
    db.session.commit()

    return jsonify({"message": "Option created successfully"}), 201

@api.route('/options/<int:id>', methods=['GET'])
def get_option(id):
    option = Option.query.get_or_404(id)
    question = Question.query.get_or_404(option.question_id)
    survey = Survey.query.get_or_404(question.survey_id)
    option_data = {
        "id": option.id,
        "question_id": option.question_id,
        "option_text": option.option_text,
        "order": option.order
    }
    return jsonify(option_data)

@api.route('/options', methods=['GET'])
def get_options():
    options = Option.query.all()
    return jsonify([option.serialize() for option in options]), 200

@api.route('/options/<int:id>', methods=['PUT'])
@jwt_required()
def update_option(id):
    option = Option.query.get_or_404(id)
    question = Question.query.get_or_404(option.question_id)
    survey = Survey.query.get_or_404(question.survey_id)
    data = request.get_json()
    option.option_text = data.get('option_text', option.option_text)
    db.session.commit()
    return jsonify({
        "id": option.id,
        "question_id": option.question_id,
        "option_text": option.option_text,
        "order": option.order
    })



@api.route('/options/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_option(id):
    option = Option.query.get_or_404(id)
    question = Question.query.get_or_404(option.question_id)
    survey = Survey.query.get_or_404(question.survey_id)
    db.session.delete(option)
    db.session.commit()
    return jsonify({'message': 'Option deleted'}), 200

## VOTES ENDPOINTS

## VOTES ENDPOINTS

@api.route('/votes', methods=['GET'])
@jwt_required()
def get_votes():
    votes = Vote.query.all()
    votes_list = [vote.serialize() for vote in votes]
    return jsonify(votes_list), 200

@api.route('/votes', methods=['POST'])
@jwt_required()
def create_vote():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        user = User.query.get(get_jwt_identity())
        option = Option.query.get(data['option_id'])

        if not user or not option:
            return jsonify({"error": "User or Option not found"}), 404

        new_vote = Vote(
            user_id=user.id,
            survey_id=option.question.survey_id,
            question_id=option.question_id,
            option_id=option.id,
        )

        db.session.add(new_vote)
        db.session.commit()

        return jsonify({
            "message": "Vote cast successfully",
            "vote_id": new_vote.id,
            "user_id": new_vote.user_id,
            "question_id": new_vote.question_id,
            "option_id": new_vote.option_id
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e), "message": "There was an error processing your request."}), 500

@api.route('/votes/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user_votes(user_id):
    user = User.query.get_or_404(user_id)
    votes = user.votes
    votes_data = [vote.serialize() for vote in votes]
    return jsonify(votes_data), 200

from flask_jwt_extended import jwt_required, get_jwt_identity

@api.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()  

   
    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify(user.serialize()), 200  

openai.api_key = os.getenv("OPENAI_API_KEY")

@api.route('/api/suggest', methods=['POST'])
def suggest_questions():
    try:
 
        data = request.json
        survey_title = data.get("title")

        if not survey_title:
            return jsonify({"error": "Title is required"}), 400

   
        prompt = f"Dado el título de la encuesta '{survey_title}', sugiere una descripción, 3 preguntas y opciones para cada pregunta."

        response = openai.Completion.create(
            engine="text-davinci-003",
            prompt=prompt,
            max_tokens=300,
            n=1,
            stop=None,
            temperature=0.7
        )

        suggestion = response.choices[0].text.strip()

        return jsonify({"suggestion": suggestion}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@api.route('/surveys/<int:survey_id>/votes', methods=['GET'])
def get_survey_votes(survey_id):

    questions = Question.query.filter_by(survey_id=survey_id).all()

   
    if not questions:
        return jsonify({"message": "No questions found for this survey."}), 404

 
    option_votes = {}
    total_voters = set()  


    for question in questions:
   
        option_votes[question.id] = {}

    
        for option in question.options:
       
            option_votes[question.id][option.id] = {"option_text": option.option_text, "votes_count": 0}

     
        for vote in question.votes:
            total_voters.add(vote.user_id)  
    
            option_votes[question.id][vote.option_id]["votes_count"] += 1

 
    total_voters_count = len(total_voters)

 
    most_voted_option = {}
    for question_id, options in option_votes.items():

        most_voted_option[question_id] = max(options.values(), key=lambda x: x["votes_count"])


    serialized_questions = []
    for question in questions:
        question_data = {
            "question_id": question.id,
            "question_text": question.question_text, 
            "total_voters": total_voters_count,
            "options": [],
            "most_voted_option": most_voted_option.get(question.id)
        }
        
    
        for option_id, option_info in option_votes.get(question.id, {}).items():
            question_data["options"].append({
                "option_text": option_info["option_text"],
                "votes_count": option_info["votes_count"]
            })


        serialized_questions.append(question_data)

   
    return jsonify({
        "survey_id": survey_id,
        "questions": serialized_questions,
    }), 200







# Configura el blueprint y la aplicación
app.register_blueprint(api, url_prefix='/api')

if __name__ == '__main__':
     app.run(debug=True)








# #ENDPOINTS

# from flask import Flask, Blueprint, request, jsonify
# from werkzeug.security import generate_password_hash, check_password_hash
# from api.models import db, User, Survey, Question, Option, Vote
# import jwt
# import datetime
# from flask_jwt_extended import jwt_required, get_jwt_identity
# from flask_cors import CORS  # Importa CORS

# # Inicializa la aplicación de Flask
# app = Flask(__name__)

# # Habilita CORS para todo el dominio de tu frontend (ajusta la URL si es necesario)
# CORS(app, resources={r"/*": {"origins": "*"}})  # Permite solicitudes de cualquier origen

# # Aquí va el resto de la configuración y rutas

# api = Blueprint('api', __name__)

# SECRET_KEY = 'your_secret_key_here'  # Debes reemplazar esto por una clave secreta segura

# ## USERS ENDPOINTS

# @api.route('/users', methods=['GET'])

# def get_users():
#     users = User.query.all()
#     users_list = [
#         {
#             "id": user.id,
#             "email": user.email,
#             "full_name": user.full_name,
#             "created_at": user.created_at,
#             "is_active": user.is_active
#         } for user in users
#     ]
#     return jsonify(users_list), 200

# @api.route('/users/<int:id>', methods=['GET'])
# def get_user(id):
#     user = User.query.options(db.joinedload(User.surveys_created)).get_or_404(id)  # Ensure surveys are loaded
#     user_data = {
#         "id": user.id,
#         "email": user.email,
#         "full_name": user.full_name,
#         "created_at": user.created_at,
#         "is_active": user.is_active,
#         "surveys": [survey.serialize() for survey in user.surveys_created]  # Include related surveys
#     }
#     return jsonify(user_data)

# # User Endpoints
# @api.route('/users', methods=['POST'])
# def create_user():
#     if request.method == 'POST':
#         data = request.get_json()
#         if not data:
#             return jsonify({"error": "No data provided"}), 400

#         # Verificar si el email ya está registrado
#         existing_user = User.query.filter_by(email=data['email']).first()
#         if existing_user:
#             return jsonify({"error": "Email already registered"}), 409

#         # Hashear la contraseña usando SHA256
#         password_hash = generate_password_hash(data['password'], method='pbkdf2:sha256')

#         # Crear el nuevo usuario
#         new_user = User(email=data['email'], password_hash=password_hash, full_name=data['full_name'])
#         db.session.add(new_user)
#         db.session.commit()

#         return jsonify({"message": "User created successfully"}), 201
    


# @api.route('/users/<int:id>', methods=['PUT'])
# def update_user(id):
#     user = User.query.get_or_404(id)
#     data = request.get_json()
#     user.email = data.get('email', user.email)
#     user.full_name = data.get('full_name', user.full_name)
#     user.is_active = data.get('is_active', user.is_active)
#     user.password_hash = generate_password_hash(data.get('password', user.password_hash), method='pbkdf2:sha256')
#     db.session.commit()
#     return jsonify({
#         "id": user.id,
#         "email": user.email,
#         "full_name": user.full_name,
#         "created_at": user.created_at,
#         "is_active": user.is_active
#     })


# ## LOGIN ENDPOINT

# @api.route('/login', methods=['POST'])
# def login_user():
#     data = request.get_json()
#     if not data:
#         return jsonify({"error": "No data provided"}), 400

#     email = data.get('email')
#     password = data.get('password')

#     if not email or not password:
#         return jsonify({"error": "Email and password are required"}), 400

#     user = User.query.filter_by(email=email).first()

#     if user and check_password_hash(user.password_hash, password):
#         token = jwt.encode({
#             'user_id': user.id,
#             'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
#         }, SECRET_KEY, algorithm='HS256')

#         return jsonify({"message": "Login successful", "token": token}), 200
#     else:
#         return jsonify({"error": "Invalid email or password"}), 401


# ## SURVEYS ENDPOINTS
    
# @api.route('/surveys', methods=['GET'])
# def get_surveys():
#     surveys = Survey.query.all()
#     surveys_list = [
#         {
#             "id": survey.id,
#             "creator_id": survey.creator_id,
#             "title": survey.title,
#             "description": survey.description,
#             "start_date": survey.start_date,
#             "end_date": survey.end_date,
#             "is_public": survey.is_public,
#             "status": survey.status,
#             "type": survey.type
#         } for survey in surveys
#     ]
#     return jsonify(surveys_list), 200

# @api.route('/surveys', methods=['POST'])
# def create_survey():
#     try:
#         data = request.get_json()
#         if not data:
#             return jsonify({"error": "No data provided"}), 400

#         # Crear una nueva encuesta
#         new_survey = Survey(
#             creator_id=data['creator_id'],
#             title=data['title'],
#             description=data.get('description'),
#             start_date=data.get('start_date'),
#             end_date=data.get('end_date'),
#             is_public=data.get('is_public', True),
#             status=data.get('status', 'draft'),
#             type=data['type']
#         )

#         db.session.add(new_survey)
#         db.session.commit()  # Aquí se hace el commit y se asigna el ID automáticamente

#         # Capturamos el ID de la nueva encuesta
#         survey_id = new_survey.id

#         # Devuelves el ID en la respuesta
#         return jsonify({
#             "message": "Survey created successfully",
#             "id": survey_id  # Aquí retornamos el ID de la encuesta creada
#         }), 201

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500  # Devolver el error en caso de fallo

# @api.route('/surveys/<int:id>', methods=['GET'])
# def get_survey(id):
#     try:
#         print(f"Fetching survey with id: {id}")
#         survey = Survey.query.options(db.joinedload(Survey.questions).joinedload(Question.options)).get_or_404(id)

#         print(f"Survey found: {survey}")
        
#         # Serializando datos
#         survey_data = {
#             "id": survey.id,
#             "creator_id": survey.creator_id,
#             "title": survey.title,
#             "description": survey.description,
#             "start_date": survey.start_date,
#             "end_date": survey.end_date,
#             "is_public": survey.is_public,
#             "status": survey.status,
#             "type": survey.type,
#             "questions": [
#                 {
#                     "id": question.id,
#                     "question_text": question.question_text,
#                     "question_type": question.question_type,
#                     "order": question.order,
#                     "required": question.required,
#                     "options": [
#                         {
#                             "id": option.id,
#                             "option_text": option.option_text,
#                             "order": option.order
#                         } for option in question.options
#                     ]
#                 } for question in survey.questions
#             ]
#         }
#         print(f"Survey data to return: {survey_data}")
#         return jsonify(survey_data), 200

#     except Exception as e:
#         print(f"Error fetching survey: {str(e)}")
#         return jsonify({"error": str(e), "message": "There was an error processing your request."}), 500


# @api.route('/surveys/<int:id>', methods=['PUT'])
# def update_survey(id):
#     survey = Survey.query.get_or_404(id)
#     data = request.get_json()
#     survey.title = data.get('title', survey.title)
#     survey.description = data.get('description', survey.description)
#     survey.is_public = data.get('is_public', survey.is_public)
#     survey.status = data.get('status', survey.status)
#     db.session.commit()
#     return jsonify({
#         "id": survey.id,
#         "creator_id": survey.creator_id,
#         "title": survey.title,
#         "description": survey.description,
#         "start_date": survey.start_date,
#         "end_date": survey.end_date,
#         "is_public": survey.is_public,
#         "status": survey.status,
#         "type": survey.type
#     })

# @api.route('/surveys/<int:id>', methods=['DELETE'])
# def delete_survey(id):
#     survey = Survey.query.get_or_404(id)
#     db.session.delete(survey)
#     db.session.commit()
#     return jsonify({'message': 'Survey deleted'}), 200



# ## QUESTIONS ENDPOINTS

# @api.route('/questions', methods=['POST'])
# def create_question():
#     try:
#         data = request.get_json()
#         if not data:
#             return jsonify({"error": "No data provided"}), 400

#         survey = Survey.query.get_or_404(data['survey_id'])
#         new_question = Question(
#             survey_id=data['survey_id'],
#             question_text=data['question_text'],
#             question_type=data['question_type'],
#             order=data.get('order'),
#             required=data.get('required', True)
#         )
#         db.session.add(new_question)
#         db.session.commit()  # Aquí se hace el commit para guardar la pregunta en la base de datos

#         # Capturar el ID de la nueva pregunta
#         question_id = new_question.id
#         question_text = new_question.question_text

#         # Devolver el ID y el texto de la pregunta en la respuesta
#         return jsonify({
#             "message": "Question created successfully",
#             "id": question_id,
#             "question_text": question_text
#         }), 201

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500  # Devolver el error en caso de fallo


# @api.route('/questions/<int:id>', methods=['GET'])
# def get_question(id):
#     question = Question.query.get_or_404(id)
#     survey = Survey.query.get_or_404(question.survey_id)
#     question_data = {
#         "id": question.id,
#         "survey_id": question.survey_id,
#         "question_text": question.question_text,
#         "question_type": question.question_type,
#         "order": question.order,
#         "required": question.required
#     }
#     return jsonify(question_data)

# @api.route('/questions', methods=['GET'])
# def get_questions():
#     questions = Question.query.all()
#     return jsonify([question.serialize() for question in questions]), 200

# @api.route('/questions/<int:id>', methods=['PUT'])
# def update_question(id):
#     question = Question.query.get_or_404(id)
#     survey = Survey.query.get_or_404(question.survey_id)
#     data = request.get_json()
#     question.question_text = data.get('question_text', question.question_text)
#     question.question_type = data.get('question_type', question.question_type)
#     question.required = data.get('required', question.required)
#     db.session.commit()
#     return jsonify({
#         "id": question.id,
#         "survey_id": question.survey_id,
#         "question_text": question.question_text,
#         "question_type": question.question_type,
#         "order": question.order,
#         "required": question.required
#     })

# @api.route('/questions/<int:id>', methods=['DELETE'])
# def delete_question(id):
#     question = Question.query.get_or_404(id)
#     survey = Survey.query.get_or_404(question.survey_id)
#     db.session.delete(question)
#     db.session.commit()
#     return jsonify({'message': 'Question deleted'}), 200




# ## OPTIONS ENDPOINTS


# @api.route('/options', methods=['POST'])
# def create_option():
#     data = request.get_json()
#     if not data:
#         return jsonify({"error": "No data provided"}), 400

#     question = Question.query.get_or_404(data['question_id'])
#     survey = Survey.query.get_or_404(question.survey_id)
#     new_option = Option(
#         question_id=data['question_id'],
#         option_text=data['option_text'],
#         order=data.get('order')
#     )
#     db.session.add(new_option)
#     db.session.commit()

#     return jsonify({"message": "Option created successfully"}), 201

# @api.route('/options/<int:id>', methods=['GET'])
# def get_option(id):
#     option = Option.query.get_or_404(id)
#     question = Question.query.get_or_404(option.question_id)
#     survey = Survey.query.get_or_404(question.survey_id)
#     option_data = {
#         "id": option.id,
#         "question_id": option.question_id,
#         "option_text": option.option_text,
#         "order": option.order
#     }
#     return jsonify(option_data)

# @api.route('/options', methods=['GET'])
# def get_options():
#     options = Option.query.all()
#     return jsonify([option.serialize() for option in options]), 200

# @api.route('/options/<int:id>', methods=['PUT'])
# def update_option(id):
#     option = Option.query.get_or_404(id)
#     question = Question.query.get_or_404(option.question_id)
#     survey = Survey.query.get_or_404(question.survey_id)
#     data = request.get_json()
#     option.option_text = data.get('option_text', option.option_text)
#     db.session.commit()
#     return jsonify({
#         "id": option.id,
#         "question_id": option.question_id,
#         "option_text": option.option_text,
#         "order": option.order
#     })

# @api.route('/options/<int:id>', methods=['DELETE'])
# def delete_option(id):
#     option = Option.query.get_or_404(id)
#     question = Question.query.get_or_404(option.question_id)
#     survey = Survey.query.get_or_404(question.survey_id)
#     db.session.delete(option)
#     db.session.commit()
#     return jsonify({'message': 'Option deleted'}), 200

# ## VOTES ENDPOINTS

# @api.route('/votes', methods=['GET'])
# def get_votes():
#     # Utiliza serialización en la consulta para evitar bucles innecesarios y mejorar el rendimiento
#     votes = Vote.query.all()
#     votes_list = [vote.serialize() for vote in votes]
#     return jsonify(votes_list), 200


# @api.route('/votes', methods=['POST'])
# def create_vote():
#     try:
#         data = request.get_json()
#         if not data:
#             return jsonify({"error": "No data provided"}), 400

#         # Validar que el usuario y la opción existen antes de crear el voto
#         user = User.query.get(data['user_id'])
#         option = Option.query.get(data['option_id'])

#         if not user or not option:
#             return jsonify({"error": "User or Option not found"}), 404

#         new_vote = Vote(
#             user_id=user.id,
#             survey_id=option.question.survey_id,
#             question_id=option.question_id,
#             option_id=option.id,
#         )

#         db.session.add(new_vote)
#         db.session.commit()

#         return jsonify({
#             "message": "Vote cast successfully",
#             "vote_id": new_vote.id,
#             "user_id": new_vote.user_id,
#             "question_id": new_vote.question_id,
#             "option_id": new_vote.option_id
#         }), 201

#     except Exception as e:
#         db.session.rollback()
#         return jsonify({"error": str(e), "message": "There was an error processing your request."}), 500


# @api.route('/votes/<int:user_id>', methods=['GET'])
# def get_user_votes(user_id):
#     # Se aplica serialización en la consulta para mejorar el rendimiento y la claridad del código
#     user = User.query.get_or_404(user_id)
#     votes = user.votes
#     votes_data = [vote.serialize() for vote in votes]
#     return jsonify(votes_data), 200

# # Configura el blueprint y la aplicación
# app.register_blueprint(api, url_prefix='/api')

# if __name__ == '__main__':
#     app.run(debug=True)