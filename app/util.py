import os


def ensuredir(dirname):
    """ create a folder if doesn't exists """"
    if not os.path.exists(dirname):
        os.makedirs(dirname)
