"""
Настройки и константы для тестовой записи видео на Raspberry Pi.

Содержит параметры каталога, длительности, разрешения, framerate и bitrate
для скриптов, использующих rpicam-vid (например, тесты без GPIO).
"""

import subprocess
import time
import os
import traceback
import datetime
import signal

# ---------- Настройки ----------
VIDEO_DIR = "/home/pavlinmavlin/videos"
MAX_RECORD_TIME = 20  # длительность теста в секундах
FRAMERATE = 30
WIDTH = 1920
HEIGHT = 1080
BITRATE = 30000000  # 30 Mbps
