# Smart Birdhouse — ESP32-S3 N16R8

Прошивка: wifi ap, раздача фронта из SPIFFS, api сенсоров и управление питанием паспи

Деплой — из **корня репозитория**, см. [README.md](../README.md).

## Требования

- PlatformIO(cli или расширение)
- ESP32-S3 N16R8 по usb

Если `pio` не в path: `~/.platformio/penv/bin/pio run -t upload`.

**Порт занят:** `lsof | grep cu.usbserial` -> `kill <PID>`. Перед заливкой закрыть Serial Monitor.

## API

- `GET /api/sensors` — температура, влажность, батарея, расстояние
- `GET /api/pi/status` — статус Pi
- `POST /api/pi/power` — `{"on": true, "manual": true}`

## Пины (ESP32-S3)

| Назначение                       | GPIO       |
| -------------------------------- | ---------- |
| I2C SDA / SCL                    | 21, 20     |
| Pi power / signal / ready / mode | 5, 6, 4, 8 |
| LED                              | 7          |
| Батарея (ADC)                    | 1          |

## Заряд батареи

Без делителя напряжения заряд не измерить(питание только 3.3v). Делитель: BAT+ -> R1 -> GPIO 1 -> R2 -> GND. В коде: R1=20 кОм, R2=47 кОм. Подстройка: `BATTERY_VOLTAGE_MAX` / `BATTERY_VOLTAGE_MIN` в `main.cpp`.

## Раздел прошивки

`partitions.csv`: приложение ~4 MB, spiffs ~12 MB под веб.
