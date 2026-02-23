#!/usr/bin/env node
/**
 * Читает .env в корне репозитория и генерирует esp32/include/secrets.h
 * для прошивки (SSID и пароль Wi‑Fi). Файл .env в .gitignore — в Git не попадёт.
 *
 * Запуск: node scripts/generate-secrets.js (или автоматически перед npm run upload)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');
const OUT_DIR = path.join(ROOT, 'esp32', 'include');
const OUT_FILE = path.join(OUT_DIR, 'secrets.h');

const DEFAULTS = {
  WIFI_SSID: 'SmartBirdhouse',
  WIFI_PASSWORD: '',
};

function parseEnv(content) {
  const vars = { ...DEFAULTS };
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    if (key === 'WIFI_SSID' || key === 'WIFI_PASSWORD') vars[key] = val;
  }
  return vars;
}

function escapeCString(s) {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

if (!fs.existsSync(ENV_PATH)) {
  const vars = DEFAULTS;
  const ssid = escapeCString(vars.WIFI_SSID);
  const pass = escapeCString(vars.WIFI_PASSWORD);
  const out = `// Сгенерировано при отсутствии .env(значения по умолчанию)
// Скопируйте .env.example в .env и задайте WIFI_PASSWORD, затем снова запустите сборку

#ifndef SMART_BIRDHOUSE_SECRETS_H
#define SMART_BIRDHOUSE_SECRETS_H

#define AP_SSID     "${ssid}"
#define AP_PASSWORD "${pass}"

#endif
`;
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, out, 'utf8');
  console.log('secrets.h: использованы значения по умолчанию (.env не найден).');
  process.exit(0);
}

const content = fs.readFileSync(ENV_PATH, 'utf8');
const vars = parseEnv(content);
const ssid = escapeCString(vars.WIFI_SSID);
const pass = escapeCString(vars.WIFI_PASSWORD);

const out = `// Сгенерировано из .env (не коммитить .env в Git).

#ifndef SMART_BIRDHOUSE_SECRETS_H
#define SMART_BIRDHOUSE_SECRETS_H

#define AP_SSID     "${ssid}"
#define AP_PASSWORD "${pass}"

#endif
`;

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, out, 'utf8');
console.log('secrets.h создан из .env');
