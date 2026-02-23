# Smart Birdhouse — ESP32-S3 N16R8

Прошивка для ESP32-S3 (16 MB Flash, 8 MB PSRAM): точка доступа Wi‑Fi, раздача фронтенда из SPIFFS, JSON API (сенсоры, управление питанием Pi).

## Где выполнять команды

**Все команды выполняются на MacBook** в приложении **Терминал** (Terminal). ESP32 подключён по USB к тому же MacBook — прошивка и заливка файловой системы идут через этот кабель.

- **Корень репозитория** — папка `smart-birdhouse` (та, где лежат `esp32/`, `web/`, `package.json`). В терминале сначала перейдите туда:  
  `cd /Users/pavelzinovev/frontend_learning/frontend-pets/python/smart-birdhouse`
- Команды с `pio` — из папки **`esp32/`** (или из корня репы с путём `esp32/` там, где так указано).
- Команды `npm run ...` — из **корня репозитория** `smart-birdhouse`.

## Требования

- [PlatformIO](https://platformio.org/) (CLI или расширение в VS Code)
- Плата ESP32-S3 N16R8, подключённая по USB к MacBook

## Если вы привыкли к Arduino IDE

Этот проект собран под **PlatformIO**: своя таблица разделов (16 MB flash, SPIFFS под веб) и отдельная заливка файловой системы (`uploadfs`). В Arduino IDE так же удобно сделать сложнее (нужен свой partition и загрузка LittleFS вручную).

**Вариант 1 (рекомендуется).** Поставить PlatformIO и пользоваться им только для этого репозитория:

- **VS Code:** установить расширение [PlatformIO IDE](https://marketplace.visualstudio.com/items?itemName=platformio.platformio-ide). Открыть папку `smart-birdhouse` → в боковой панели PIO: «Open Project» → выбрать папку `esp32`. Дальше кнопки Build / Upload / Upload Filesystem Image.
- **Только терминал:** установить CLI: `pip install platformio` или [инструкция](https://docs.platformio.org/en/latest/core/installation.html). Дальше все команды ниже — из терминала на MacBook.

Порт USB (например `/dev/cu.usbmodem*`) PlatformIO подхватит сам; при необходимости укажите в `esp32/platformio.ini`:  
`upload_port = /dev/cu.usbserial-XXXX`

**Если при загрузке ошибка «port is busy»:** закройте Serial Monitor и выполните в терминале (подставьте свой порт из сообщения об ошибке):

```bash
lsof | grep cu.usbserial
kill <PID>   # номер из второй колонки
```

После этого снова запустите `pio run -t upload`.

## Cursor и PlatformIO IDE

Плагин **platformio-ide** ставит Core в свою папку и **не добавляет `pio` в PATH** — в обычном терминале Cursor команда `pio` не находится (`command not found`).

**Вариант 1 — кнопки плагина (без терминала):** откройте папку **`esp32`** как проект (File → Open Folder → выберите папку `esp32`). В боковой панели PlatformIO (иконка домика) нажмите **Upload** (прошивка) или **Upload Filesystem Image** (заливка веб-интерфейса в SPIFFS).

**Вариант 2 — терминал с полным путём:**

```bash
cd /Users/pavelzinovev/frontend_learning/frontend-pets/python/smart-birdhouse/esp32
~/.platformio/penv/bin/pio run -t upload
```

**Вариант 3 — добавить `pio` в PATH** (один раз). В `~/.zshrc` добавьте строку и перезапустите терминал:

```bash
export PATH="$HOME/.platformio/penv/bin:$PATH"
```

После этого команды `pio run -t upload` и `pio run -t uploadfs` будут работать из любой папки.

## Chrome OS / Chromium OS

Подойдёт, если есть **Linux (Crostini)**: установите в нём PlatformIO CLI (`pip install platformio` или по [инструкции](https://docs.platformio.org/en/latest/core/installation.html)) и выполняйте те же команды. Для прошивки по USB включите доступ USB-устройств для контейнера Linux. Фронт в браузере (Chrome/Chromium) с `http://192.168.4.1` работает как обычно.

## Сборка и прошивка

В терминале на MacBook:

```bash
cd /Users/pavelzinovev/frontend_learning/frontend-pets/python/smart-birdhouse/esp32
pio run -t upload
```

(Если вы уже в корне репы `smart-birdhouse`, то: `cd esp32` и затем `pio run -t upload`.)

## Загрузка фронтенда в SPIFFS

1. Соберите React и скопируйте файлы в `esp32/data/` — **из корня репозитория** на MacBook:

   ```bash
   cd /Users/pavelzinovev/frontend_learning/frontend-pets/python/smart-birdhouse
   npm run copy-web-to-esp32
   ```

   (Скрипт сам сделает `npm run build` в `web/smart-birdhouse` и скопирует `dist/*` в `esp32/data/`.)

2. Залить файловую систему в ESP32 (плата по USB) — **из папки esp32**:

   ```bash
   cd /Users/pavelzinovev/frontend_learning/frontend-pets/python/smart-birdhouse/esp32
   pio run -t uploadfs
   ```

После этого при открытии `http://192.168.4.1` с телефона (подключённого к точке доступа **SmartBirdhouse**) будет загружаться ваш фронтенд и доступны API:

- `GET /api/sensors` — температура, влажность, заряд батареи, расстояние
- `GET /api/pi/status` — статус питания Pi и режим
- `POST /api/pi/power` — тело `{"on": true, "manual": true}` — включить Pi в ручном режиме

## Пины (ESP32-S3)

| Назначение         | GPIO |
| ------------------ | ---- |
| I2C SDA            | 21   |
| I2C SCL            | 20   |
| Pi power (MOSFET)  | 5    |
| Pi signal (запись) | 6    |
| Pi ready (от Pi)   | 4    |
| Pi mode (manual)   | 8    |
| LED                | 7    |
| Батарея (ADC)      | 1    |

## Раздел прошивки

В `partitions.csv`: приложение ~4 MB, раздел **spiffs** ~12 MB под веб-интерфейс.
