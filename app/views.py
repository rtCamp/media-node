from flask import render_template, request, send_from_directory, url_for
from flask.ext.sqlalchemy import models_committed
from app import app, db
from .models import Job
from .util import ensuredir
from .encoder import Encoder
from .queue import Queue
from werkzeug import secure_filename
from pprint import pprint
import time
import os

####################################
# app routes
####################################


@app.route("/")
def index():
    return render_template('upload.html', timestamp=int(time.time()))

# status check


@app.route("/status")
def status():
    return "All is well"

# version check


@app.route("/version")
def version():
    return "Working on v2 in python"

# uploads


@app.route("/upload", methods=['POST'])
def upload():
    # Get the name of the uploaded file
    file = request.files['upload']
    # Check if the file is one of the allowed types/extensions
    if file:
        # Make the filename safe, remove unsupported chars
        filename = secure_filename(file.filename)
        filedir = os.path.join(
            app.config['UPLOAD_FOLDER'], request.form['media_id'])
        filepath = os.path.join(filedir, filename)
        # Move file form temp to desired dest
        ensuredir(filedir)
        file.save(filepath)
        fileurl = url_for(
            'uploaded_file',
            filename=os.path.join(request.form['media_id'], filename),
            _external=True)
        # create a new Job into database
        job = Job(api_job_id=request.form['media_id'],
                  file_path=filepath,
                  file_url=fileurl,
                  request_format=request.form['media_type'],
                  thumb_count=request.form['thumbs'],
                  callback_url=request.form['callback_url'])
        # add to db
        db.session.add(job)
        db.session.commit()
        return "file uploaded successfully" + fileurl

# Serve files


@app.route('/files/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'],
                               filename)


@app.route('/start/')
def start_encoding():
    Queue.process('queued')

    return "hello"


def on_models_committed(sender, changes):
    for model, change in changes:
        if change == 'insert':
            print ("Hook Fired")
            db.create_scoped_session()
            Queue.process('queued')

models_committed.connect(on_models_committed, sender=app)
