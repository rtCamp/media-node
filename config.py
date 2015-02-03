import os
basedir = os.path.abspath(os.path.dirname(__file__))

CELERY_BROKER_URL = 'sqla+sqlite:///' + os.path.join(basedir, 'app.db')

CELERY_RESULT_BACKEND = 'db+sqlite:///' + os.path.join(basedir, 'app.db')

SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'app.db')
SQLALCHEMY_MIGRATE_REPO = os.path.join(basedir, 'db_repository')

UPLOAD_FOLDER = os.path.join(basedir, 'files')
