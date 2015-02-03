if __name__ == '__main__' and __package__ is None:
    from os import sys, path
    sys.path.append(path.dirname(path.dirname(path.abspath(__file__))))

from app.encoder import Encoder

# create a obj
enc = Encoder('/Users/rahul286/Sites/media-node/tests/data/gaganam.mov', 3)
# enc.video()
# enc.audio()
enc.thumbs()
