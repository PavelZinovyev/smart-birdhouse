"""
Скрипт записи видео по сигналу GPIO на Raspberry Pi.

Читает GPIO (PI_SIGNAL_PIN): при HIGH запускает запись через rpicam-vid в MP4,
при LOW или по таймауту — останавливает. Состояние «готовности» отдаёт на PI_READY_PIN.
Предназначен для работы в связке с внешним триггером (например, датчик движения).
"""

import RPi.GPIO as GPIO
import subprocess
import time
import os
import traceback
import datetime
import signal

# ---------- setup ----------
PI_SIGNAL_PIN = 17
PI_READY_PIN  = 27
VIDEO_DIR = "/home/pavlinmavlin/videos"

MAX_RECORD_TIME = 42
FRAMERATE = 30
WIDTH = 1920
HEIGHT = 1080
PROCESS_TIMEOUT = 90

# ---------- prepare GPIO ----------
GPIO.setmode(GPIO.BCM)
GPIO.setup(PI_SIGNAL_PIN, GPIO.IN)
GPIO.setup(PI_READY_PIN, GPIO.OUT, initial=GPIO.LOW)

# ---------- create directory ----------
try:
    os.makedirs(VIDEO_DIR, exist_ok=True)
    print("📁 VIDEO_DIR ready:", VIDEO_DIR)
except Exception as e:
    print("❌ Failed to create VIDEO_DIR:", e)

process = None
recording = False
record_start_time = None
current_file = None
pi_on_time = None

# ---------- log ----------
def log(msg):
    """Печатает сообщение с префиксом времени в формате HH:MM:SS."""
    print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] {msg}")


# ---------- start recording ----------
def start_recording():
    """
    Запускает запись видео в MP4 через rpicam-vid (libav).
    Устанавливает PI_READY_PIN в HIGH. Ничего не делает, если запись уже идёт.
    """
    global process, recording, record_start_time, current_file, pi_on_time

    if recording:
        return

    timestamp = int(time.time())
    current_file = os.path.join(VIDEO_DIR, f"video_{timestamp}.mp4")

    log(f"🎬 START RECORDING: {current_file}")

    GPIO.output(PI_READY_PIN, GPIO.HIGH)  # Pi занят
    pi_on_time = time.time()

    process = subprocess.Popen([
        "rpicam-vid",
        "-t", "0",
        "--width", str(WIDTH),
        "--height", str(HEIGHT),
        "--framerate", str(FRAMERATE),

        "--codec", "libav",
        "--libav-format", "mp4",

        "--bitrate", "30000000",   

        "--profile", "high",
        "--level", "4.2",
        "--intra", "30",

        "--nopreview",
        "-o", current_file

    ], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)

    recording = True
    record_start_time = time.time()

# ---------- stop recording ----------
def stop_recording():
    """
    Останавливает текущую запись: отправляет SIGINT в rpicam-vid, при необходимости
    принудительно завершает процесс, синхронизирует диск. Всегда сбрасывает
    PI_READY_PIN и глобальное состояние записи.
    """
    global process, recording, record_start_time, current_file, pi_on_time

    try:
        log("⏹ STOP RECORDING")

        if process:
            log("Sending SIGINT to rpicam...")
            process.send_signal(signal.SIGINT)

            try:
                process.wait(timeout=10)
                log("✅ rpicam stopped cleanly")
            except subprocess.TimeoutExpired:
                log("⚠ rpicam did not exit, killing")
                process.kill()

        os.sync()

        if current_file and os.path.exists(current_file):
            size = os.path.getsize(current_file) / (1024 * 1024)
            log(f"📁 File saved: {current_file} ({size:.1f} MB)")
        else:
            log("❌ File missing after recording")

    except Exception:
        log(f"❌ Exception during stop_recording:\n{traceback.format_exc()}")

    finally:
        GPIO.output(PI_READY_PIN, GPIO.LOW)
        recording = False
        process = None
        record_start_time = None
        pi_on_time = None
    # ---------- main loop ----------
try:
    GPIO.output(PI_READY_PIN, GPIO.HIGH)
    time.sleep(0.5)

    while True:
        signal_state = GPIO.input(PI_SIGNAL_PIN)
        now = time.time()

        if signal_state == GPIO.HIGH and not recording:
            start_recording()

        if recording:
            elapsed = now - record_start_time if record_start_time else 0

            if signal_state == GPIO.LOW or elapsed >= MAX_RECORD_TIME:
                stop_recording()
            else:
                if pi_on_time:
                    log(f"⏱ Recording time: {int(now - pi_on_time)} sec")

                    if now - pi_on_time > PROCESS_TIMEOUT:
                        log("⚠ Max process time exceeded, forcing stop")
                        stop_recording()

        time.sleep(0.5)

except KeyboardInterrupt:
    log("🛑 Stopped manually")

finally:
    if process:
        stop_recording()
    GPIO.cleanup()
