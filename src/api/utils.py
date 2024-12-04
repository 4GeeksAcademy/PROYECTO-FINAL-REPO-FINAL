from flask import jsonify, url_for
from datetime import datetime
from api.models import Survey, db

class APIException(Exception):
    status_code = 400

    def __init__(self, message, status_code=None, payload=None):
        Exception.__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        return rv

def update_all_surveys_status():
    """Actualiza el estado de todas las encuestas según las fechas de inicio y fin."""
    current_time = datetime.utcnow()
    surveys = Survey.query.all()
    for survey in surveys:
        if survey.start_date <= current_time <= survey.end_date:
            survey.status = 'active'
        elif current_time > survey.end_date:
            survey.status = 'closed'
        else:
            survey.status = 'draft'
    db.session.commit()

import smtplib
from email.mime.text import MIMEText

def send_reset_email(user, reset_token):
    # URL para restablecer la contraseña
    reset_url = f"http://yourfrontend.com/reset-password/{reset_token}"

    # Configuración del correo electrónico
    sender_email = "noreply@surveyhub.com"
    recipient_email = user.email
    subject = "Password Reset Instructions"
    body = f"Hello {user.full_name},\n\nClick the link below to reset your password:\n\n{reset_url}\n\nIf you didn't request a password reset, please ignore this email."

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = sender_email
    msg["To"] = recipient_email

    try:
        with smtplib.SMTP("smtp.your-email-provider.com", 587) as server:
            server.starttls()
            server.login("your-email@example.com", "your-email-password")
            server.sendmail(sender_email, recipient_email, msg.as_string())
    except Exception as e:
        print(f"Error sending email: {e}")


def has_no_empty_params(rule):
    defaults = rule.defaults if rule.defaults is not None else ()
    arguments = rule.arguments if rule.arguments is not None else ()
    return len(defaults) >= len(arguments)

def generate_sitemap(app):
    unique_endpoints = set()
    for rule in app.url_map.iter_rules():
        if has_no_empty_params(rule):
            url = url_for(rule.endpoint, **(rule.defaults or {}))
            if url != "/" and "/admin/" not in url:
                unique_endpoints.add(url)

    links_html = "".join(["<li style='padding: 10px 0 5px 0;'><a style='text-decoration: none; color: black; text-transform: uppercase;' href='" + y +
                         "' onmouseover='this.style.color=\"darkred\"' onmouseout='this.style.color=\"black\"' onclick='this.style.color=\"blue\"'>" + y + '</a></li>' for y in unique_endpoints])
    api_name = "Encuestas App"
    additional_data_html = """
        <h2 style="margin: 20px 0px 10px 0px; font-size:40px;">ENDPOINTS REQUESTS GUIDE</h2>
        <div style="text-align: left; padding: 40px; margin: 20px 100px; background-color: #333; border-radius: 10px; color: white;">
            <p><strong>CREATE USER:</strong></p>
            <p><strong>method: POST</strong></p>
            <p><strong>path request:</strong> /users</p>
            <pre style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow: auto; color: black;">
                    {
                        "email": "newuser@example.com",
                        "password": "new_password",
                        "full_name": "New User"
                    }
            </pre>

            <p><strong>CREATE FULL SURVEY:</strong></p>
            <p><strong>method: POST</strong></p>
            <p><strong>path request:</strong> /surveys/full</p>
            <pre style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow: auto; color: black;">
                    {
                        "creator_id": 1,
                        "title": "Customer Satisfaction",
                        "description": "Survey to understand customer satisfaction",
                        "start_date": "2024-01-01",
                        "end_date": "2024-01-31",
                        "is_public": true,
                        "status": "draft",
                        "type": "survey",
                        "questions": [
                            {
                                "question_text": "How satisfied are you with our service?",
                                "question_type": "multiple_choice",
                                "order": 1,
                                "required": true,
                                "options": [
                                    {
                                        "option_text": "Very Satisfied",
                                        "order": 1
                                    },
                                    {
                                        "option_text": "Satisfied",
                                        "order": 2
                                    }
                                ]
                            }
                        ]
                    }
            </pre>
        </div>
        <div style="text-align: left; padding: 40px; margin: 20px 100px; background-color: #333; border-radius: 10px; color: white;">
            <p><strong>DELETE USER:</strong></p>
            <p><strong>method: DELETE</strong></p>
            <p><strong>path request:</strong> /users/&lt;int:id&gt;</p>
            <pre style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow: auto; color: black;">
                /users/&lt;int:id&gt;
            </pre>

            <p><strong>DELETE SURVEY:</strong></p>
            <p><strong>method: DELETE</strong></p>
            <p><strong>path request:</strong> /surveys/&lt;int:id&gt;</p>
            <pre style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow: auto; color: black;">
                /surveys/&lt;int:id&gt;
            </pre>
        </div>
    """
    return f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{api_name} API</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@700&family=Montserrat&family=Pixelify+Sans&display=swap" rel="stylesheet">
        </head>
        <body style="background-color: white; color: black; text-align: center; font-family: 'Montserrat', arial;">
        <div style="text-align: center;">
        <div style="position: fixed; bottom: 0; right: 0; margin: 40px;">
                <button style="font-family: 'Barlow', sans-serif; border-radius: 40px;background-color: grey; padding: 20px; box-shadow: 0px 0px 10px 0px white; transition: all 0.3s ease;"
                    onmouseover="this.style.backgroundColor='black'; this.style.boxShadow='0px 0px 20px 0px white';"
                    onmouseout="this.style.backgroundColor='grey'; this.style.boxShadow='0px 0px 10px 0px white';">
                    <a style="text-decoration: none; font-size: 20px; color: white;" href="/admin">ADMIN MODE</a>
                </button>
         </div>
        <h1>Welcome to {api_name} API</h1>
          <img style="max-height : 400px; margin: 0px 0px 50px 0px;" src="https://greatbrook.com/wp-content/uploads/2015/05/data-analysis-charts.png" />
         <p style="font-size:25px">API HOST <script>document.write('<input style="padding: 10px; margin-left: 20px; width: 300px" type="text" value="'+window.location.href+'" />');</script></p>
        <h2 style="margin: 50px 0px 10px 0px; font-size:60px;">ENDPOINTS</h2>
        <div>
        <ul style="text-align: center; font-size: 25px; list-style-type: none; padding-right:30px; margin-bottom: 150px;">{links_html}</ul>
        {additional_data_html}
        </div>
        </body>
        </html>
        """




# from flask import jsonify, url_for

# class APIException(Exception):
#     status_code = 400

#     def __init__(self, message, status_code=None, payload=None):
#         Exception.__init__(self)
#         self.message = message
#         if status_code is not None:
#             self.status_code = status_code
#         self.payload = payload

#     def to_dict(self):
#         rv = dict(self.payload or ())
#         rv['message'] = self.message
#         return rv

# def has_no_empty_params(rule):
#     defaults = rule.defaults if rule.defaults is not None else ()
#     arguments = rule.arguments if rule.arguments is not None else ()
#     return len(defaults) >= len(arguments)

# def generate_sitemap(app):
#     links = ['/admin/']
#     for rule in app.url_map.iter_rules():
#         # Filter out rules we can't navigate to in a browser
#         # and rules that require parameters
#         if "GET" in rule.methods and has_no_empty_params(rule):
#             url = url_for(rule.endpoint, **(rule.defaults or {}))
#             if "/admin/" not in url:
#                 links.append(url)

#     links_html = "".join(["<li><a href='" + y + "'>" + y + "</a></li>" for y in links])
#     return """
#         <div style="text-align: center;">
#         <img style="max-height: 80px" src='https://storage.googleapis.com/breathecode/boilerplates/rigo-baby.jpeg' />
#         <h1>Rigo welcomes you to your API!!</h1>
#         <p>API HOST: <script>document.write('<input style="padding: 5px; width: 300px" type="text" value="'+window.location.href+'" />');</script></p>
#         <p>Start working on your project by following the <a href="https://start.4geeksacademy.com/starters/full-stack" target="_blank">Quick Start</a></p>
#         <p>Remember to specify a real endpoint path like: </p>
#         <ul style="text-align: left;">"""+links_html+"</ul></div>"
