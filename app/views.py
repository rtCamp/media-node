from flask import render_template, request, send_from_directory, url_for
from app import app, db
from .models import Job
from .util import ensuredir
from werkzeug import secure_filename
from pprint import pprint
import time
import os

####################################
# app routes
####################################

@app.route("/")
def index():
    return render_template('upload.html',timestamp=int(time.time()))

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
        # Move file form temp to desired dest
        ensuredir(os.path.join(app.config['UPLOAD_FOLDER'], request.form['media_id']))
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], request.form['media_id'], filename))
        # create a new Job into database
        job = Job(api_job_id=request.form['media_id'],
                 file_path = filename,
                 file_url = url_for('uploaded_file',
                                 filename=os.path.join(request.form['media_id'],filename),
                                 _external=True),
                 request_format = request.form['media_type'],
                 thumb_count = request.form['thumbs'],
                 callback_url = request.form['callback_url'])
        #add to db
        db.session.add(job)
        db.session.commit()
        return "file uploaded successfully" + url_for('uploaded_file',
                        filename=os.path.join(request.form['media_id'],filename),
                        _external=True)

#server files
@app.route('/files/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'] ,
                               filename)
