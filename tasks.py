from celery import Celery

app = Celery(
    'tasks', broker='sqla+sqlite:////Users/rahul286/Sites/media-node/app.db')


@app.task
def queue_process():
    Queue.process('queued')
