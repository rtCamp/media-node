from .models import Job
from .encoder import Encoder
from pprint import pprint
from app import queue_db


class Queue():

    def process(self, status="queued"):
        jobs = queue_db.session.query(Job).filter_by(status=status)
        for job in jobs:
            pprint(vars(job))
            e = Encoder(job.file_path, job.thumb_count)
            if job.request_format == 'thumbnails':
                e.thumbs()
            elif job.request_format == 'mp3':
                e.audio()
            else:
                e.video()
        return "jobs processed successfully"
