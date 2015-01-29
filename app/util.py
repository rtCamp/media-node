import os

#create a folder if doesn't exists
def ensuredir(dirname):
    if not os.path.exists(dirname):
        os.makedirs(dirname)
