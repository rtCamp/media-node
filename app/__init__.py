from flask import Flask
from flask.ext.sqlalchemy import SQLAlchemy
from .util import ensuredir
from pprint import pprint
import os

app = Flask(__name__)
app.config.from_object('config')
db = SQLAlchemy(app)

# pprint (app.config['UPLOAD_FOLDER'])

from app import views, models

# create UPLOAD_FOLDER if it doesn't exists
ensuredir(app.config['UPLOAD_FOLDER'])

# create db
db.create_all()
