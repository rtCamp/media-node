####################################
# database
####################################

from app import db
import time


class Job(db.Model):

    """ Database - Job table ORM """
    id = db.Column(db.Integer, primary_key=True)

    # add unix timestamp as default value
    api_job_id = db.Column(db.Integer, default=int(time.time()))
    api_key_id = db.Column(db.Integer)

    file_path = db.Column(db.String(255))
    file_url = db.Column(db.String(255))

    # mp4, mp3 and thumbnails
    request_format = db.Column(
        db.Enum('mp4', 'mp3', 'thumbnails', name='request_format_type'),
        default='mp4')

    # queued, completed, processing, error
    status = db.Column(
        db.Enum('queued', 'completed', 'processing', 'error'),
        default='queued')
    bandwidth = db.Column(db.Integer)
    thumb_count = db.Column(db.Integer)
    callback_url = db.Column(db.String(255))
    duration = db.Column(db.Float)

    def __init__(
        self, api_job_id, file_path, file_url, request_format,
        api_key_id=0, status="queued", bandwidth=0, thumb_count=0,
        callback_url="", duration=0
    ):
        """ Job constructor """
        self.api_job_id = api_job_id
        self.api_key_id = api_key_id
        self.file_path = file_path
        self.file_url = file_url
        self.request_format = request_format
        self.status = status
        self.bandwidth = bandwidth
        self.thumb_count = thumb_count
        self.callback_url = callback_url
        self.duration = duration

    def __repr__(self):
        """ String representation of a Job object """
        return '<Job File: %r>' % (self.original_file_path)
