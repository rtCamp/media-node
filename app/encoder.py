import os
from math import floor
from converter import FFMpeg
import numpy as np


class Encoder:
    infile_path = ""
    outfile_base = ""
    thumb_count = 0

    mp4 = ['-vcodec', 'libx264', '-pix_fmt', 'yuv420p',
           '-profile:v', 'baseline',
           '-preset', 'slower', '-crf', '18',
           '-vf', 'scale=trunc(in_w/2)*2:trunc(in_h/2)*2'
           ]
    webm = ['-c:v', 'libvpx', '-c:a', 'libvorbis', '-pix_fmt', 'yuv420p',
            '-quality', 'good', '-b:v', '2M', '-crf', '5',
            '-vf', 'scale=trunc(in_w/2)*2:trunc(in_h/2)*2'
            ]
    ogv = ['-q', '5', '-pix_fmt', 'yuv420p',
           '-acodec', 'libvorbis', '-vcodec', 'libtheora'
           ]

    mp3 = ['-acodec', 'libmp3lame', '-q:a', '0', '-map', '0:a:0']

    ogg = ['-acodec', 'libvorbis', '-q:a', '10', '-map', '0:a:0']

    thumb = ['-vframes', '1', '-map', '0:v:0', ' -vf', 'scale=100:100']

    def __init__(self, infile_path, thumb_count=0):
        if not os.path.isfile(infile_path):
            print ("file doesn't exist at :: " + infile_path +
                   " or at:: " + os.path.abspath(infile_path))
            return

        self.infile_path = infile_path
        self.outfile_base = os.path.splitext(infile_path)[0]
        self.thumb_count = thumb_count
        print("Initializing Encoder with" +
              "\ni/p : " + self.infile_path +
              "\no/p : " + self.outfile_base)

    def _conv(self, infile, outfile, opt):
        print("Starting " + os.path.splitext(outfile)
              [1] + " conversion. Dest:  " + outfile)
        ffmpeg = FFMpeg()
        info = ffmpeg.probe(infile)
        res = ffmpeg.convert(infile, outfile, opt)
        for timestamp in res:
            print ("Processed %d%% ...\r" %
                   floor(timestamp / info.format.duration * 100))

    def video(self):
        self._conv(self.infile_path, self.outfile_base + '.mp4', self.mp4)
        self._conv(self.infile_path, self.outfile_base + '.ogv', self.ogv)
        self._conv(self.infile_path, self.outfile_base + '.webm', self.webm)

        if(self.thumb_count):
            self.thumbs()

    def audio(self):
        self._conv(self.infile_path, self.outfile_base + '.mp3', self.mp3)
        self._conv(self.infile_path, self.outfile_base + '.ogg', self.ogg)

    def thumbs(self):
        if(self.thumb_count == 0):
            print ("ERROR: Thumbnail count is set to 0 (zero)")
            return

        print("Generating %d thumbsnails for %s " %
              (self.thumb_count, self.infile_path))
        ffmpeg = FFMpeg()
        info = ffmpeg.probe(self.infile_path)
        timestamps = np.linspace(
            1, floor(info.format.duration), self.thumb_count).astype(int)

        for index, timestamp in enumerate(timestamps):
            # doc -
            # http://python-video-converter.readthedocs.org/en/latest/api.html#converter.ffmpeg.FFMpeg.thumbnail
            ffmpeg.thumbnail(
                self.infile_path, timestamp,
                self.outfile_base + '-thumb-' + str(index + 1) + '.png',
                2)
            print ("Generated %d/%d at second: %d" %
                   (index + 1, self.thumb_count, timestamp))
