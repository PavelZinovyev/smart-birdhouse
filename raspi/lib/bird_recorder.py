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
import json
import datetime
import re
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
# Смещение wall-clock относительно time.time() (секунды); сохраняется на диск после синка с телефона.
TIME_OFFSET_PATH = os.path.join(VIDEO_DIR, ".pi_time_offset.json")
_time_offset_lock = threading.Lock()
_time_offset_s = 0.0

# ---------- AUDIO ----------
# ALSA capture: см. arecord -L. Пример: plughw:CARD=Device,DEV=0 или plughw:0,0 (card 0).
AUDIO_DEVICE = os.getenv("AUDIO_DEVICE", "plughw:0,0")


def _arecord_l_has_card_device(list_text: str, card: int, device: int) -> bool:
    """Проверяет, что arecord -l содержит пару card N / device M (для plughw:N,M)."""
    for line in list_text.splitlines():
        line = line.strip()
        if not line.startswith("card "):
            continue
        m_card = re.match(r"card\s+(\d+):", line)
        if not m_card or int(m_card.group(1)) != card:
            continue
        if re.search(rf"device\s+{device}:", line):
            return True
    return False


def _probe_audio_device(dev: str) -> bool:
    """Проверяет наличие устройства захвата в ALSA (arecord), иначе пишем без звука."""
    if not dev:
        return False
    try:
        proc = subprocess.run(["arecord", "-L"], capture_output=True, text=True, timeout=3)
        if proc.returncode != 0:
            print(f"audio probe failed with code {proc.returncode}, disabling audio")
            return False
        listing_l = proc.stdout or ""
        if dev in listing_l:
            print(f"🔊 Audio device '{dev}' detected, recording with sound")
            return True
        # plughw:N,M часто не дублируется в arecord -L строкой — сверяем с arecord -l
        m = re.match(r"^plughw:(\d+),(\d+)$", dev) or re.match(r"^hw:(\d+),(\d+)$", dev)
        if m:
            card, subdev = int(m.group(1)), int(m.group(2))
            proc_l = subprocess.run(["arecord", "-l"], capture_output=True, text=True, timeout=3)
            if proc_l.returncode == 0 and _arecord_l_has_card_device(proc_l.stdout or "", card, subdev):
                print(f"🔊 Audio device '{dev}' detected (capture card {card} dev {subdev}), recording with sound")
                return True
        print(f"🔇 Audio device '{dev}' not found in ALSA capture list, recording without sound")
        return False
    except Exception as e:
        print(f"audio probe failed, disabling audio: {e}")
        return False

GPIO.setmode(GPIO.BCM)

GPIO.setup(PI_SIGNAL_PIN, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)
GPIO.setup(PI_READY_PIN, GPIO.OUT)
GPIO.setup(PI_MODE_PIN, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)

os.makedirs(VIDEO_DIR, exist_ok=True)
os.makedirs(THUMB_DIR, exist_ok=True)


def _load_time_offset() -> None:
    global _time_offset_s
    try:
        with open(TIME_OFFSET_PATH, encoding="utf-8") as f:
            data = json.load(f)
        _time_offset_s = float(data["offset_s"])
    except (OSError, KeyError, TypeError, ValueError, json.JSONDecodeError):
        _time_offset_s = 0.0


def _save_time_offset() -> None:
    try:
        with open(TIME_OFFSET_PATH, "w", encoding="utf-8") as f:
            json.dump({"offset_s": _time_offset_s}, f, indent=0)
    except OSError as e:
        print(f"failed to save time offset: {e}")


def wall_time() -> float:
    """Эффективное время для имён файлов и API (смещение от телефона, без sudo)."""
    with _time_offset_lock:
        return time.time() + _time_offset_s


def _format_pi_local_time() -> str:
    return datetime.datetime.fromtimestamp(wall_time()).strftime("%Y-%m-%d %H:%M:%S")


_load_time_offset()

process = None
recording = False
recording_error = False  # true, если последняя запись завершилась с ошибкой(процесс упал)
manual_mode = False
stream_process = None
stream_lock = threading.Lock()
audio_enabled = _probe_audio_device(AUDIO_DEVICE)  # если аудиоустройство не найдено, пишем без звука
current_filename = None  # актуальный файл записи (нужно для ожидания финализации MP4)

# ---------- MODE ----------
if GPIO.input(PI_MODE_PIN) == GPIO.HIGH:
    manual_mode = True
    print("📱 MANUAL MODE")
else:
    print("🐦 AUTO MODE")


def request_os_shutdown():
    """запрашивает мягкое выключение распи"""
    try:
        subprocess.Popen(["sudo", "-n", "shutdown", "-h", "now"])
    except Exception as e:
        print(f"failed to request os shutdown: {e}")

# ---------- RECORD ----------
def _build_rpicam_cmd(filename: str, with_audio: bool) -> list[str]:
    """Собирает команду rpicam-vid. При with_audio=False пишет только видео (без звука)."""
    cmd = [
        "rpicam-vid",
        "-t",
        "0",
        "--width",
        "1920",
        "--height",
        "1080",
        "--framerate",
        "30",
        "--codec",
        "libav",
        "--libav-format",
        "mp4",
    ]
    if with_audio and AUDIO_DEVICE:
        cmd.extend(
            [
                "--libav-audio",
                "--audio-source",
                "alsa",
                "--audio-codec",
                "aac",
                "--audio-device",
                AUDIO_DEVICE,
            ]
        )
    else:
        print("audio disabled, recording video without sound")

    cmd.extend(
        [
            "--bitrate",
            "30000000",
            "--nopreview",
            "-o",
            filename,
        ]
    )
    return cmd


def _read_stderr_nonblocking(proc, limit: int = 2048) -> str:
    """Пытается прочитать кусок stderr из процесса, не блокируя надолго."""
    if proc.stderr is None:
        return ""
    try:
        data = proc.stderr.read1(limit)
        return data.decode(errors="ignore") if data else ""
    except Exception:
        return ""


def start_recording():
    global process, recording, recording_error, audio_enabled, current_filename

    if recording:
        return

    recording_error = False  # сброс при новом старте записи
    filename = os.path.join(VIDEO_DIR, f"video_{int(wall_time())}.mp4")
    current_filename = filename

    # сначала пробуем с аудио (если оно ещё не было отключено), при быстром фейле — повторяем без звука
    try_audio = audio_enabled
    cmd = _build_rpicam_cmd(filename, with_audio=try_audio)

    print("rpicam-vid cmd:", " ".join(cmd))

    try:
        process = subprocess.Popen(cmd, stderr=subprocess.PIPE)
    except FileNotFoundError as e:
        # rpicam-vid не найден — это уже фатальная ошибка
        recording_error = True
        print(f"❌ Failed to start rpicam-vid: {e}")
        process = None
        return

    # даём процессу чуть времени стартануть и проверить устройство аудио
    time.sleep(0.5)

    if process.poll() is not None and process.returncode != 0:
        # процесс сразу упал — забираем stderr, чтобы увидеть реальную причину
        try:
            _, stderr_data = process.communicate(timeout=1)
            stderr_text = stderr_data.decode(errors="ignore") if stderr_data else ""
        except Exception:
            stderr_text = ""
        print(f"⚠️ rpicam-vid exited early with code {process.returncode}")
        if stderr_text:
            print(f"stderr (early): {stderr_text}")

        if try_audio:
            # больше не будем пытаться писать аудио в следующих запусках
            audio_enabled = False
            print("🔇 Disabling audio and retrying recording without sound")
            filename = os.path.join(VIDEO_DIR, f"video_{int(wall_time())}.mp4")
            cmd_no_audio = _build_rpicam_cmd(filename, with_audio=False)
            print("rpicam-vid cmd (no audio):", " ".join(cmd_no_audio))
            try:
                process = subprocess.Popen(cmd_no_audio, stderr=subprocess.PIPE)
            except FileNotFoundError as e:
                recording_error = True
                print(f"❌ Failed to start rpicam-vid without audio: {e}")
                process = None
                return
            # небольшой чек что второй запуск жив
            time.sleep(0.5)
            if process.poll() is not None and process.returncode != 0:
                try:
                    _, stderr_data = process.communicate(timeout=1)
                    stderr_text = stderr_data.decode(errors="ignore") if stderr_data else ""
                except Exception:
                    stderr_text = ""
                recording_error = True
                print(
                    f"❌ rpicam-vid without audio also failed with code {process.returncode}"
                )
                if stderr_text:
                    print(f"stderr (no-audio): {stderr_text}")
                process = None
                return
        else:
            # мы уже запускались без аудио — просто считаем это ошибкой
            recording_error = True
            try:
                _, stderr_data = process.communicate(timeout=1)
                stderr_text = stderr_data.decode(errors="ignore") if stderr_data else ""
            except Exception:
                stderr_text = ""
            print("❌ rpicam-vid failed to start (audio already disabled)")
            if stderr_text:
                print(f"stderr (final): {stderr_text}")
            process = None
            return

    recording = True
    print("🎬 Recording started")


def stop_recording():
    global process, recording, recording_error, current_filename

    if not process:
        return

    process.send_signal(signal.SIGINT)
    process.wait()
    if process.returncode is not None and process.returncode != 0:
        # rpicam-vid при SIGINT может вернуть специфические коды (например, 130, 255) — считаем их нормой.
        if process.returncode not in (130, 255, -2):
            recording_error = True
            stderr_tail = _read_stderr_nonblocking(process)
            print(f"⚠️ Recording exited with code {process.returncode}")
            if stderr_tail:
                print(f"stderr: {stderr_tail}")

    process = None
    recording = False
    print("⏹ Recording stopped")


def _wait_for_file_stable(path: str | None, timeout_s: float = 8.0, poll_s: float = 0.5) -> None:
    """
    Ждёт пока размер MP4 стабилизируется (похоже на "дописывание/финализацию" после остановки).
    Это критично для авто-режима, когда после stop мы начинаем завершать/выключать систему.
    """
    if not path:
        return

    last_size = -1
    stable_checks = 0
    start = time.time()

    while time.time() - start < timeout_s:
        try:
            if not os.path.isfile(path):
                time.sleep(poll_s)
                continue
            size = os.path.getsize(path)
            if size > 0 and size == last_size:
                stable_checks += 1
                if stable_checks >= 2:
                    return
            else:
                last_size = size
                stable_checks = 0
        except OSError:
            pass
        time.sleep(poll_s)

    print(f"⚠️ file not stable within timeout: {path}")


# ---------- FILE LIST ----------
def _unix_from_video_filename(name: str) -> int | None:
    """Unix-время из имени video_<ts>.mp4 (совпадает с wall_time при записи)."""
    if not name.startswith("video_") or not name.endswith(".mp4"):
        return None
    core = name[len("video_") : -len(".mp4")]
    try:
        return int(core)
    except ValueError:
        return None


def list_files():
    files = []
    for f in os.listdir(VIDEO_DIR):
        if f.endswith(".mp4"):
            files.append(f)
    return files


def list_files_with_meta():
    """
    Список видео с именем, размером и временем для фронта.
    mtime — по возможности из имени файла (учёт смещения времени с телефона);
    иначе st_mtime (системные часы Pi могут быть неверными без NTP).
    """
    out = []
    for f in sorted(os.listdir(VIDEO_DIR), reverse=True):
        if not f.endswith(".mp4"):
            continue
        path = os.path.join(VIDEO_DIR, f)
        try:
            st = os.stat(path)
            from_name = _unix_from_video_filename(f)
            mtime = int(from_name if from_name is not None else st.st_mtime)
            out.append({"name": f, "size": st.st_size, "mtime": mtime})
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


def _effective_recording_state():
    """Если процесс записи уже завершился (упал), отражаем это в состоянии."""
    global recording, recording_error
    if recording and process is not None and process.poll() is not None:
        if process.returncode != 0:
            recording_error = True
        recording = False
    return recording, recording_error


@app.route("/status")
def status():
    rec, err = _effective_recording_state()
    return jsonify({
        "manual_mode": manual_mode,
        "recording": rec,
        "recording_error": err,
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


@app.route("/api/time", methods=["GET"])
def api_time_get():
    """Текущее «эффективное» локальное время Pi (учёт смещения после синка с телефона)."""
    with _time_offset_lock:
        wt = time.time() + _time_offset_s
        off = _time_offset_s
    local = datetime.datetime.fromtimestamp(wt).strftime("%Y-%m-%d %H:%M:%S")
    return jsonify({"unix_s": int(wt), "local": local, "offset_s": off})


@app.route("/api/time/sync", methods=["POST"])
def api_time_sync():
    """
    Принимает unix_ms с телефона и пересчитывает смещение (без прав root).
    Используется для имён видео и отображения в UI.
    """
    global _time_offset_s
    data = request.get_json(silent=True) or {}
    unix_ms = data.get("unix_ms")
    if unix_ms is None:
        return jsonify({"ok": False, "error": "missing unix_ms"}), 400
    try:
        t_phone = float(unix_ms) / 1000.0
    except (TypeError, ValueError):
        return jsonify({"ok": False, "error": "invalid unix_ms"}), 400

    with _time_offset_lock:
        _time_offset_s = t_phone - time.time()
        try:
            with open(TIME_OFFSET_PATH, "w", encoding="utf-8") as f:
                json.dump({"offset_s": _time_offset_s}, f, indent=0)
        except OSError as e:
            return jsonify({"ok": False, "error": str(e)}), 500

    print(f"time sync: offset_s={_time_offset_s:.3f}")
    return jsonify(
        {
            "ok": True,
            "unix_s": int(wall_time()),
            "local": _format_pi_local_time(),
            "offset_s": _time_offset_s,
        }
    )


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
                # Важно: перед выключением/READY=LOW дождёмся финализации MP4 на диске.
                # Без этого иногда получается "битый" MP4, который даёт превью, но не открывается в браузере.
                _wait_for_file_stable(current_filename)
                try:
                    subprocess.run(["sync"], check=False, timeout=2)
                except Exception:
                    pass
                GPIO.output(PI_READY_PIN, GPIO.LOW)
                request_os_shutdown()

        time.sleep(0.2)


threading.Thread(target=gpio_loop, daemon=True).start()

app.run(host="0.0.0.0", port=5000)
