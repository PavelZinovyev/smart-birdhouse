# Raspberry Pi — запись видео

Скрипты на Python для записи видео по сигналу с ESP32: GPIO-триггер и бенчмарки rpicam-vid.

## Пины (BCM)

| Пин | Назначение |
|-----|------------|
| 17  | `PI_SIGNAL_PIN` — вход: HIGH = начать запись, LOW = остановить |
| 27  | `PI_READY_PIN` — выход: HIGH = идёт запись / Pi занят |

Схема согласована с ESP32: Pi читает сигнал старта с 17, отдаёт «готовность» на 27.

## Файлы в `lib/`

| Файл | Описание |
|------|----------|
| **bird_recorder.py** | Основной скрипт: цикл по GPIO, при HIGH на 17 — запись в MP4 через `rpicam-vid` (libav), при LOW или по таймауту — остановка. Видео сохраняются в `VIDEO_DIR`. |
| **video_bench.py** | Бенчмарк: прямая запись в MP4 и запись H264 + конвертация в MP4; замеры CPU, RAM, температуры. |
| **test_gpio.py** | Тест чтения пинов 17 и 27 в цикле (проверка проводки/сигналов). |
| **test_recorder.py** | Общие настройки для тестов записи (каталог, длительность, разрешение, framerate, bitrate). |

## Зависимости

- Python 3
- **RPi.GPIO**
- **rpicam-vid** (системный пакет на Raspberry Pi OS)
- Для бенчмарка: **psutil**

## Запуск

Основная запись по триггеру (обычно с автозапуском или systemd):

```bash
python3 lib/bird_recorder.py
```

Бенчмарк (создаёт тестовые ролики и выводит метрики):

```bash
python3 lib/video_bench.py
```

Проверка GPIO:

```bash
python3 lib/test_gpio.py
```

## Настройки

В `bird_recorder.py`: `VIDEO_DIR`, `MAX_RECORD_TIME`, `WIDTH`, `HEIGHT`, `FRAMERATE`, `PROCESS_TIMEOUT`. В `video_bench.py` и `test_recorder.py` — свои константы под тесты.
