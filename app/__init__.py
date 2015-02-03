from flask import Flask
# import SQLAlchemy
from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.sqlalchemy import models_committed
from .util import ensuredir
from .encoder import Encoder
# from .queue import Queue
from pprint import pprint
from .celery import make_celery

app = Flask(__name__)
app.config.from_object('config')
db = SQLAlchemy(app)
queue_db = SQLAlchemy(app)
celery = make_celery(app)

# pprint (app.config['UPLOAD_FOLDER'])

from app import views, models, queue

# create UPLOAD_FOLDER if it doesn't exists
ensuredir(app.config['UPLOAD_FOLDER'])

# create db
db.create_all()

# celery task


@celery.task()
def queue_process():
    print ("Celery Task called")
    Queue.process('queued')


def on_models_committed(sender, changes):
    for model, change in changes:
        if change == 'insert':
            print ("db insert called")
            queue_process()


models_committed.connect(on_models_committed, sender=app)

queue_process.delay()
