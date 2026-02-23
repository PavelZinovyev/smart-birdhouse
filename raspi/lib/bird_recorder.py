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
from flask import Flask, jsonify, request

# ---------- PINS ----------
PI_SIGNAL_PIN = 17
PI_MODE_PIN = 22
PI_READY_PIN = 27

VIDEO_DIR = "/home/pavlinmavlin/videos"

GPIO.setmode(GPIO.BCM)

GPIO.setup(PI_SIGNAL_PIN, GPIO.IN)
GPIO.setup(PI_READY_PIN, GPIO.OUT)
GPIO.setup(PI_MODE_PIN, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)

os.makedirs(VIDEO_DIR, exist_ok=True)

process = None
recording = False
manual_mode = False

# ---------- MODE ----------
if GPIO.input(PI_MODE_PIN) == GPIO.HIGH:
    manual_mode = True
    print("📱 MANUAL MODE")
else:
    print("🐦 AUTO MODE")

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


# ---------- API ----------
app = Flask(__name__)

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
    GPIO.output(PI_READY_PIN, GPIO.LOW)
    return jsonify({"ok": True})


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

        time.sleep(0.2)


import threading

threading.Thread(target=gpio_loop, daemon=True).start()

app.run(host="0.0.0.0", port=5000)
