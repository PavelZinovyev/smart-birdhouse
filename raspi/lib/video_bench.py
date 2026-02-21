"""
Бенчмарк видеозаписи на Raspberry Pi.

Запускает rpicam-vid в двух режимах (прямой MP4 через libav и H264 с последующей
конвертацией через ffmpeg), замеряет пиковую нагрузку CPU, RAM и температуру.
Используется для сравнения производительности разных способов записи видео.
"""

import subprocess
import time
import os
import psutil
import datetime

VIDEO_DIR = "/home/pavlinmavlin/videos"
DURATION = 20        # сек
WIDTH = 1920
HEIGHT = 1080
FRAMERATE = 30
BITRATE = 30000000   # 30 Mbps

os.makedirs(VIDEO_DIR, exist_ok=True)


def log(msg):
    """Печатает сообщение с префиксом времени в формате HH:MM:SS."""
    print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] {msg}")


def get_cpu_ram_temp():
    """
    Считывает текущую загрузку CPU, использование RAM и температуру SoC.

    Returns:
        tuple[float, float, float]: (cpu %, ram_used MB, temp °C). temp=0 при ошибке чтения.
    """
    cpu = psutil.cpu_percent(interval=0.1)
    ram = psutil.virtual_memory().used / 1024 / 1024
    try:
        with open("/sys/class/thermal/thermal_zone0/temp") as f:
            temp = int(f.read()) / 1000.0
    except:
        temp = 0
    return cpu, ram, temp


def run_bench(name, cmd):
    """
    Запускает процесс и во время его работы замеряет максимум CPU, RAM и температуру.

    Args:
        name: Название теста для лога.
        cmd: Список аргументов для subprocess (команда и аргументы).

    Returns:
        tuple[float, float, float]: (max_cpu %, max_ram MB, max_temp °C).
    """
    log(f"===== START {name} =====")
    max_cpu = 0
    max_ram = 0
    max_temp = 0
    start_time = time.time()

    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)

    while process.poll() is None:
        cpu, ram, temp = get_cpu_ram_temp()
        max_cpu = max(max_cpu, cpu)
        max_ram = max(max_ram, ram)
        max_temp = max(max_temp, temp)
        time.sleep(0.5)

    # финальные замеры после завершения
    cpu, ram, temp = get_cpu_ram_temp()
    max_cpu = max(max_cpu, cpu)
    max_ram = max(max_ram, ram)
    max_temp = max(max_temp, temp)

    end_time = time.time()
    log(f"===== END {name} (Duration {int(end_time-start_time)}s) =====")
    log(f"Max CPU: {max_cpu:.1f}% | Max RAM: {max_ram:.1f} MB | Max Temp: {max_temp:.1f}°C")
    return max_cpu, max_ram, max_temp


def main():
    """
    Запускает серию бенчмарков: прямая запись в MP4 (libav) и запись H264
    с последующей конвертацией в MP4 через ffmpeg. Результаты выводятся в лог.
    """
    timestamp = int(time.time())

    # --- 1. Сразу MP4 через libav ---
    mp4_file = os.path.join(VIDEO_DIR, f"video_{timestamp}_direct.mp4")
    cmd_mp4 = [
        "rpicam-vid",
        "-t", str(DURATION*1000),
        "--width", str(WIDTH),
        "--height", str(HEIGHT),
        "--framerate", str(FRAMERATE),
        "--codec", "libav",
        "--libav-format", "mp4",
        "--bitrate", str(BITRATE),
        "--nopreview",
        "-o", mp4_file
    ]
    run_bench("MP4_DIRECT", cmd_mp4)

    # --- 2. H264 + конвертация ---
    h264_file = os.path.join(VIDEO_DIR, f"video_{timestamp}.h264")
    mp4_conv_file = os.path.join(VIDEO_DIR, f"video_{timestamp}_conv.mp4")
    cmd_h264 = [
        "rpicam-vid",
        "-t", str(DURATION*1000),
        "--width", str(WIDTH),
        "--height", str(HEIGHT),
        "--framerate", str(FRAMERATE),
        "--codec", "h264",
        "--nopreview",
        "-o", h264_file
    ]
    run_bench("H264_RECORD", cmd_h264)

    # конвертация в mp4 через ffmpeg
    cmd_ffmpeg = [
        "ffmpeg",
        "-y",
        "-framerate", str(FRAMERATE),
        "-i", h264_file,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "22",
        mp4_conv_file
    ]
    run_bench("H264_CONVERT", cmd_ffmpeg)

if __name__ == "__main__":
    main()
