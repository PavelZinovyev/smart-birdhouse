"""
Скрипт записи видео по сигналу GPIO на Raspberry Pi.

Читает GPIO (PI_SIGNAL_PIN): при HIGH запускает запись через rpicam-vid в MP4,
при LOW или по таймауту — останавливает. Состояние «готовности» отдаёт на PI_READY_PIN.
Предназначен для работы в связке с внешним триггером (например, датчик движения).
"""

#!/usr/bin/env python3

import RPi.GPIO as GPIO
import subprocess
import time
import os
import signal
from flask import Flask, jsonify, request, send_file
from urllib.parse import unquote

# ---------- PINS ----------
PI_SIGNAL_PIN = 17
PI_MODE_PIN = 22
PI_READY_PIN = 27

VIDEO_DIR = "/home/pavlinmavlin/videos"
THUMB_DIR = os.path.join(VIDEO_DIR, ".thumbs")

# ---------- AUDIO ----------
# ALSA: plughw:0,0 часто надёжнее hw:0,0. Если микрофон на card 1 — AUDIO_DEVICE=plughw:1,0.
AUDIO_DEVICE = os.getenv("AUDIO_DEVICE", "plughw:0,0")

GPIO.setmode(GPIO.BCM)

GPIO.setup(PI_SIGNAL_PIN, GPIO.IN)
GPIO.setup(PI_READY_PIN, GPIO.OUT)
GPIO.setup(PI_MODE_PIN, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)

os.makedirs(VIDEO_DIR, exist_ok=True)
os.makedirs(THUMB_DIR, exist_ok=True)

process = None
recording = False
manual_mode = False

# ---------- MODE ----------
if GPIO.input(PI_MODE_PIN) == GPIO.HIGH:
    manual_mode = True
    print("📱 MANUAL MODE")
else:
    print("🐦 AUTO MODE")


def request_os_shutdown():
    """запрашивает мягкое выключение распи"""
    try:
        subprocess.Popen(["sudo", "shutdown", "-h", "now"])
    except Exception as e:
        print(f"failed to request os shutdown: {e}")

# ---------- RECORD ----------
def start_recording():
    global process, recording

    if recording:
        return

    filename = os.path.join(VIDEO_DIR, f"video_{int(time.time())}.mp4")

    process = subprocess.Popen([
        "rpicam-vid",
        "-t", "0",
        "--width", "1920",
        "--height", "1080",
        "--framerate", "30",
        "--codec", "libav",
        "--libav-format", "mp4",
        "--libav-audio",
        "--audio-source", "alsa",
        "--audio-codec", "aac",
        "--audio-device", AUDIO_DEVICE,
        "--bitrate", "30000000",
        "--nopreview",
        "-o", filename
    ])

    recording = True
    print("🎬 Recording started")


def stop_recording():
    global process, recording

    if not process:
        return

    process.send_signal(signal.SIGINT)
    process.wait()

    process = None
    recording = False
    print("⏹ Recording stopped")


# ---------- FILE LIST ----------
def list_files():
    files = []
    for f in os.listdir(VIDEO_DIR):
        if f.endswith(".mp4"):
            files.append(f)
    return files


def list_files_with_meta():
    """Список видео с именем, размером и временем изменения (для фронта)."""
    out = []
    for f in sorted(os.listdir(VIDEO_DIR), reverse=True):
        if not f.endswith(".mp4"):
            continue
        path = os.path.join(VIDEO_DIR, f)
        try:
            st = os.stat(path)
            out.append({"name": f, "size": st.st_size, "mtime": int(st.st_mtime)})
        except OSError:
            pass
    return out


def _safe_filename(name):
    """Только имя .mp4 файла, без пути (защита от path traversal)."""
    name = os.path.basename(name)
    return name if name.endswith(".mp4") and name == name.strip() else None


def _ensure_thumbnail(video_name):
    """Генерирует превью в THUMB_DIR если ещё нет. Возвращает путь к jpg или None."""
    safe = _safe_filename(video_name)
    if not safe:
        return None
    video_path = os.path.join(VIDEO_DIR, safe)
    thumb_path = os.path.join(THUMB_DIR, os.path.splitext(safe)[0] + ".jpg")
    if not os.path.isfile(video_path):
        return None
    if os.path.isfile(thumb_path):
        return thumb_path
    try:
        subprocess.run([
            "ffmpeg", "-y", "-i", video_path,
            "-ss", "00:00:01", "-vframes", "1", "-f", "image2", thumb_path
        ], capture_output=True, timeout=15)
        return thumb_path if os.path.isfile(thumb_path) else None
    except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
        return None


# ---------- API ----------
app = Flask(__name__)


@app.after_request
def _cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    return resp


@app.route("/status")
def status():
    return jsonify({
        "manual_mode": manual_mode,
        "recording": recording,
        "files": list_files()
    })


@app.route("/record/start", methods=["POST"])
def api_start():
    start_recording()
    return jsonify({"ok": True})


@app.route("/record/stop", methods=["POST"])
def api_stop():
    stop_recording()
    return jsonify({"ok": True})


@app.route("/shutdown", methods=["POST"])
def shutdown():
    if recording:
        stop_recording()
    GPIO.output(PI_READY_PIN, GPIO.LOW)
    request_os_shutdown()
    return jsonify({"ok": True})


@app.route("/videos")
def videos_list():
    """Список видео с метаданными для фронта."""
    return jsonify({"files": list_files_with_meta()})


@app.route("/videos/thumbnail/<path:filename>")
def video_thumbnail(filename):
    """Превью кадра видео (генерируется ffmpeg при первом запросе)."""
    name = unquote(filename).strip()
    path = _ensure_thumbnail(name)
    if not path:
        return "", 404
    return send_file(path, mimetype="image/jpeg", max_age=86400)


@app.route("/videos/<path:filename>")
def video_file(filename):
    """Отдача файла видео для просмотра/скачивания."""
    name = _safe_filename(unquote(filename).strip())
    if not name:
        return "", 404
    path = os.path.join(VIDEO_DIR, name)
    if not os.path.isfile(path):
        return "", 404
    return send_file(path, mimetype="video/mp4", as_attachment=False, download_name=name)


# ---------- MAIN ----------
GPIO.output(PI_READY_PIN, GPIO.HIGH)

if not manual_mode:
    print("Waiting for ESP32 signal...")
else:
    print("Manual control active")

def gpio_loop():
    global recording

    while True:

        if not manual_mode:

            signal_state = GPIO.input(PI_SIGNAL_PIN)

            if signal_state == GPIO.HIGH and not recording:
                start_recording()

            if signal_state == GPIO.LOW and recording:
                stop_recording()
                GPIO.output(PI_READY_PIN, GPIO.LOW)
                request_os_shutdown()

        time.sleep(0.2)


import threading

threading.Thread(target=gpio_loop, daemon=True).start()

app.run(host="0.0.0.0", port=5000)
