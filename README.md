# Smart Birdhouse

ESP32-S3 (сенсоры, Wi‑Fi AP, API) + React-фронт на телефоне. Опционально Raspberry Pi для видео.

## Деплой

Команды — из **корня репозитория**. ESP32 по USB.

```bash
npm run copy-web-to-esp32   # сборка фронта → esp32/data/
npm run uploadfs            # заливка веба в ESP32 (то, что видит телефон)
npm run upload              # заливка прошивки ESP32
```

| Команда | Назначение |
|---------|------------|
| `npm run copy-web-to-esp32` | Собрать фронт, скопировать в `esp32/data/` |
| `npm run uploadfs` | Залить веб в SPIFFS на ESP32 |
| `npm run upload` | Залить прошивку (C++) в ESP32 |

Перед `upload` и `uploadfs` закройте Serial Monitor.

**Только веб:** `npm run copy-web-to-esp32` → `npm run uploadfs`  
**Только прошивка:** `npm run upload`

## Настройка

**Пароль Wi‑Fi:** в `esp32/src/main.cpp` поменять `ap_password` (и при желании `ap_ssid`), затем выполнить `npm run upload`. Пароль — не короче 8 символов.

## Использование

1. Подключиться к Wi‑Fi **SmartBirdhouse**.
2. Открыть **http://192.168.4.1** в браузере.

## Структура

- **esp32/** — прошивка (PlatformIO). Подробнее: [esp32/README.md](esp32/README.md)
- **web/smart-birdhouse/** — React-приложение
- **raspi/** — скрипты для Raspberry Pi
