"""
Утилита для тестовой записи видео на Raspberry Pi.

Запускает rpicam-vid с теми же базовыми настройками, что и основной bird_recorder.py:
1920x1080@30fps, ~30 Мбит/с, контейнер MP4 через libav и звук с USB-микрофона.

Нужна, чтобы быстро проверить качество/звук/нагрузку, не трогая GPIO и Flask.
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

AUDIO_DEVICE = os.getenv("AUDIO_DEVICE", "plughw:0,0")
audio_enabled = True  # если аудиоустройство недоступно, переключаемся на запись без звука

os.makedirs(VIDEO_DIR, exist_ok=True)


def log(msg: str) -> None:
    """Печатает сообщение с префиксом времени."""
    print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] {msg}")


def build_rpicam_cmd(output_path: str, duration_s: int, with_audio: bool = True) -> list[str]:
    """
    Собирает команду rpicam-vid с теми же параметрами, что в bird_recorder.py,
    но с ограниченной длительностью (duration_s секунд).

    Args:
        output_path: путь к выходному .mp4 файлу.
        duration_s: длительность записи в секундах.
    """
    cmd = [
        "rpicam-vid",
        "-t",
        str(duration_s * 1000),
        "--width",
        str(WIDTH),
        "--height",
        str(HEIGHT),
        "--framerate",
        str(FRAMERATE),
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
        log("🔇 Audio disabled, recording test video without sound")

    cmd.extend(
        [
            "--bitrate",
            str(BITRATE),
            "--nopreview",
            "-o",
            output_path,
        ]
    )
    return cmd


def main() -> None:
    """
    Запускает одну тестовую запись:

    - По умолчанию MAX_RECORD_TIME секунд (можно передать число секунд первым аргументом).
    - Пишет файл video_<timestamp>_test.mp4 в VIDEO_DIR.
    - Использует те же параметры, что и bird_recorder.py (включая звук).
    """
    import sys

    global audio_enabled

    duration_s = MAX_RECORD_TIME
    if len(sys.argv) >= 2:
        try:
            duration_s = int(sys.argv[1])
        except ValueError:
            log(f"Некорректная длительность '{sys.argv[1]}', используем {MAX_RECORD_TIME} c.")
            duration_s = MAX_RECORD_TIME

    ts = int(time.time())
    output_path = os.path.join(VIDEO_DIR, f"video_{ts}_test.mp4")

    # сначала пробуем с аудио (если ещё не отключали), при ошибке повторяем без звука
    try_audio = audio_enabled
    cmd = build_rpicam_cmd(output_path, duration_s, with_audio=try_audio)

    log(f"Старт тестовой записи на {duration_s} с.")
    log(f"Файл: {output_path}")
    log(f"AUDIO_DEVICE={AUDIO_DEVICE}")
    log("Команда: " + " ".join(cmd))

    process = None
    try:
        process = subprocess.Popen(cmd)
        process.wait()
        rc = process.returncode

        if rc != 0:
            log(f"⚠️ rpicam-vid завершился с кодом {rc}")

            if try_audio:
                # предполагаем, что могла быть проблема с аудио — повторяем без звука
                audio_enabled = False
                noaudio_path = os.path.join(VIDEO_DIR, f"video_{ts}_test_noaudio.mp4")
                log("🔇 Отключаем аудио для теста и пробуем записать только видео.")
                log(f"Файл (без звука): {noaudio_path}")
                cmd = build_rpicam_cmd(noaudio_path, duration_s, with_audio=False)
                log("Команда (без звука): " + " ".join(cmd))

                process = subprocess.Popen(cmd)
                process.wait()
                rc2 = process.returncode
                if rc2 != 0:
                    log(f"❌ rpicam-vid без аудио тоже завершился с кодом {rc2}")
                else:
                    log("✅ Тестовая запись без звука успешно завершена.")
            else:
                log("❌ rpicam-vid завершился с ошибкой (аудио уже было отключено).")
        else:
            log("Запись завершена.")
    except KeyboardInterrupt:
        log("Получен Ctrl+C, останавливаем rpicam-vid...")
        if process is not None and process.poll() is None:
            try:
                process.send_signal(signal.SIGINT)
                process.wait(timeout=5)
            except Exception:
                traceback.print_exc()
        log("Тестовая запись прервана пользователем.")
    except Exception:
        traceback.print_exc()
        log("Ошибка при запуске тестовой записи.")


if __name__ == "__main__":
    main()
