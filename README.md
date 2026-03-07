# Smart Birdhouse

esp32s3(сенсоры, wifi ap, api) + react на телефоне. Опционально распи для видео

## Деплой

Команды — из **корня репозитория**. ESP32 по USB.

```bash
# очистить spiffs
npm run erase
# залить прошивку(после erase флеш пустая)
npm run upload
# собрать веб и залить только его
npm run copy-web-to-esp32
npm run uploadfs
```

## Обновить веб

находясь в папке web:

npm run copy-web-to-esp32
npm run uploadfs
npm run upload

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
