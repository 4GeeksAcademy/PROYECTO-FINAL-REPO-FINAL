from flask_admin import Admin
import os
from flask_admin.contrib.sqla import ModelView
from .models import db, User, Survey, Question, Option, Vote, Invitation

def setup_admin(app):
    app.secret_key = os.environ.get('FLASK_APP_KEY', 'sample key')
    app.config['FLASK_ADMIN_SWATCH'] = 'cerulean'
    admin = Admin(app, name='4Geeks Admin', template_mode='bootstrap3')

    class UserAdmin(ModelView):
        form_excluded_columns = ['surveys_created', 'votes', 'invitations']

    class SurveyAdmin(ModelView):
        form_excluded_columns = ['questions', 'votes', 'invitations']

    class QuestionAdmin(ModelView):
        form_excluded_columns = ['options', 'votes']
        form_columns = ['survey', 'question_text', 'question_type', 'order', 'required']

    class OptionAdmin(ModelView):
        form_excluded_columns = ['votes']
        form_columns = ['question', 'question.survey', 'option_text', 'order']

    admin.add_view(UserAdmin(User, db.session))
    admin.add_view(SurveyAdmin(Survey, db.session))
    admin.add_view(QuestionAdmin(Question, db.session))
    admin.add_view(OptionAdmin(Option, db.session))
    admin.add_view(ModelView(Vote, db.session))
    admin.add_view(ModelView(Invitation, db.session))
