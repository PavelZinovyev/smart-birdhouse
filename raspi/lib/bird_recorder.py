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
import threading
from flask import Flask, jsonify, request, send_file, Response, stream_with_context
from urllib.parse import unquote

# MJPEG: маркеры начала/конца JPEG в потоке
JPEG_SOI = bytes([0xFF, 0xD8])
JPEG_EOI = bytes([0xFF, 0xD9])
STREAM_BOUNDARY = b"frame"

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
stream_process = None
stream_lock = threading.Lock()

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


# ---------- MJPEG STREAM ----------
# Параметры стрима (меньше разрешение/FPS, чтобы не грузить Pi при просмотре)
STREAM_WIDTH = int(os.getenv("STREAM_WIDTH", "1280"))
STREAM_HEIGHT = int(os.getenv("STREAM_HEIGHT", "720"))
STREAM_FPS = int(os.getenv("STREAM_FPS", "15"))


def _read_jpeg_frames(pipe, chunk_size=65536):
    """Читает из pipe поток MJPEG (последовательность JPEG) и отдаёт по одному кадру (bytes)."""
    buffer = b""
    while True:
        data = pipe.read(chunk_size)
        if not data:
            break
        buffer += data
        while True:
            start = buffer.find(JPEG_SOI)
            if start == -1:
                # оставить хвост на случай разрыва кадра
                buffer = buffer[-len(JPEG_SOI) - 1 :] if len(buffer) > len(JPEG_SOI) + 1 else buffer
                break
            end = buffer.find(JPEG_EOI, start)
            if end == -1:
                buffer = buffer[start:]
                break
            end += len(JPEG_EOI)
            frame = buffer[start:end]
            buffer = buffer[end:]
            yield frame


def _stream_generator():
    """Запускает rpicam-vid (MJPEG в stdout), режет на кадры и отдаёт multipart/x-mixed-replace."""
    global stream_process
    with stream_lock:
        if stream_process is not None:
            return  # второй клиент не подключаем — один процесс на камеру
        stream_process = subprocess.Popen(
            [
                "rpicam-vid",
                "-t", "0",
                "-n",
                "--width", str(STREAM_WIDTH),
                "--height", str(STREAM_HEIGHT),
                "--framerate", str(STREAM_FPS),
                "--codec", "mjpeg",
                "-o", "-",
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
        )
    try:
        for frame in _read_jpeg_frames(stream_process.stdout):
            part = (
                b"--" + STREAM_BOUNDARY + b"\r\n"
                b"Content-Type: image/jpeg\r\n"
                b"Content-Length: " + str(len(frame)).encode() + b"\r\n\r\n"
                + frame + b"\r\n"
            )
            yield part
    except (BrokenPipeError, GeneratorExit):
        pass
    finally:
        with stream_lock:
            if stream_process is not None:
                try:
                    stream_process.terminate()
                    stream_process.wait(timeout=3)
                except (ProcessLookupError, subprocess.TimeoutExpired):
                    try:
                        stream_process.kill()
                    except ProcessLookupError:
                        pass
                stream_process = None


# ---------- API ----------
app = Flask(__name__)


@app.after_request
def _cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    return resp


@app.before_request
def _cors_preflight():
    """Ответ на preflight (OPTIONS) для cross-origin DELETE и др. — иначе браузер даёт status 0."""
    if request.method == "OPTIONS":
        r = Response(status=204)
        r.headers["Access-Control-Allow-Origin"] = "*"
        r.headers["Access-Control-Allow-Methods"] = "GET, POST, DELETE, OPTIONS"
        r.headers["Access-Control-Allow-Headers"] = "Content-Type"
        r.headers["Access-Control-Max-Age"] = "86400"
        return r


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


@app.route("/stream")
def stream():
    """
    MJPEG live stream с камеры.
    Браузер отображает через <img src="/stream"> (multipart/x-mixed-replace).
    Во время записи в файл стрим недоступен (одна камера). Одновременно только один зритель.
    """
    if recording:
        return Response(
            "Stream unavailable while recording",
            status=503,
            mimetype="text/plain",
        )
    with stream_lock:
        if stream_process is not None:
            return Response(
                "Stream already in use",
                status=503,
                mimetype="text/plain",
            )
    return Response(
        stream_with_context(_stream_generator()),
        mimetype="multipart/x-mixed-replace; boundary=" + STREAM_BOUNDARY.decode(),
    )


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


@app.route("/videos/<path:filename>", methods=["GET", "DELETE"])
def video_file(filename):
    """GET — отдача файла видео. DELETE — удаление видео и превью."""
    name = _safe_filename(unquote(filename).strip())
    if not name:
        return "", 404
    path = os.path.join(VIDEO_DIR, name)
    if not os.path.isfile(path):
        return "", 404

    if request.method == "DELETE":
        try:
            os.remove(path)
            thumb_path = os.path.join(THUMB_DIR, os.path.splitext(name)[0] + ".jpg")
            if os.path.isfile(thumb_path):
                os.remove(thumb_path)
            return jsonify({"ok": True})
        except OSError as e:
            return jsonify({"ok": False, "error": str(e)}), 500

    as_attachment = request.args.get("download") == "1"
    return send_file(path, mimetype="video/mp4", as_attachment=as_attachment, download_name=name)


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


threading.Thread(target=gpio_loop, daemon=True).start()

app.run(host="0.0.0.0", port=5000)
