# Smart Birdhouse — ESP32-S3 N16R8

Прошивка: Wi‑Fi AP, раздача фронта из SPIFFS, API сенсоров и управление питанием Pi.

## Деплой

Из **корня репозитория** (где `package.json`). ESP32 по USB.

| Шаг | Команда | Действие |
|-----|---------|----------|
| 1 | `npm run copy-web-to-esp32` | Сборка React → `esp32/data/` |
| 2 | `npm run uploadfs` | Заливка веба в SPIFFS |
| 3 | `npm run upload` | Заливка прошивки |

```bash
npm run copy-web-to-esp32
npm run uploadfs
npm run upload
```

Перед заливкой закройте Serial Monitor.

**Только веб:** `npm run copy-web-to-esp32` и `npm run uploadfs`  
**Только прошивка:** `npm run upload`

## Требования

- PlatformIO (CLI или расширение)
- ESP32-S3 N16R8 по USB

Если `pio` не в PATH: `~/.platformio/penv/bin/pio run -t upload` (или добавить в PATH). В Cursor можно открыть папку `esp32` и использовать кнопки PlatformIO (Upload / Upload Filesystem Image).

**Порт занят:** `lsof | grep cu.usbserial` → `kill <PID>`

## API

- `GET /api/sensors` — температура, влажность, батарея, расстояние
- `GET /api/pi/status` — статус Pi
- `POST /api/pi/power` — `{"on": true, "manual": true}`

## Пины (ESP32-S3)

| Назначение | GPIO |
|------------|------|
| I2C SDA / SCL | 21, 20 |
| Pi power / signal / ready / mode | 5, 6, 4, 8 |
| LED | 7 |
| Батарея (ADC) | 1 |

## Заряд батареи

Без делителя напряжения заряд не измерить (питание только 3.3V). Нужен делитель BAT+ → R1 → GPIO 1 → R2 → GND. В коде зашиты R1=20 кОм, R2=47 кОм. Подстройка: `BATTERY_VOLTAGE_MAX` / `BATTERY_VOLTAGE_MIN` в `main.cpp`.

## Раздел прошивки

`partitions.csv`: приложение ~4 MB, spiffs ~12 MB под веб.
