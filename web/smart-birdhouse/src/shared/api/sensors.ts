/**
 * API сенсоров ESP32: GET /api/sensors
 * Контракт: temperature, humidity, distance_mm, battery (V), battery_percent (0–100),
 * battery_available, battery_voltage, battery_current.
 * Моки: ?sensors=mock|loading|error
 */
import { getMockValue, createNeverResolvingPromise } from './mock';
import { MOCK_SENSORS } from './mock-data';

export interface SensorsData {
  temperature: number;
  humidity: number;
  battery: number;
  battery_percent?: number;
  battery_available?: boolean;
  distance_mm: number;
  battery_voltage?: number;
  battery_current?: number;
}

const SENSORS_URL = '/api/sensors';

function normalize(data: SensorsData): SensorsData {
  const d = Number(data.distance_mm);
  const battery = Number(data.battery) || 0;
  let battery_percent = Number(data.battery_percent);
  if (!Number.isFinite(battery_percent) || battery_percent > 100) battery_percent = 0;
  const battery_available =
    data.battery_available === true || (data.battery_available !== false && battery > 0.5);
  return {
    temperature: Number(data.temperature) || 0,
    humidity: Number(data.humidity) || 0,
    battery,
    battery_percent: battery_available ? battery_percent : 0,
    battery_available,
    distance_mm: Number.isFinite(d) ? d : -1,
    battery_voltage: Number.isFinite(Number(data.battery_voltage))
      ? Number(data.battery_voltage)
      : undefined,
    battery_current: Number.isFinite(Number(data.battery_current))
      ? Number(data.battery_current)
      : undefined,
  };
}

function isSensorsJson(obj: unknown): obj is SensorsData {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'temperature' in obj &&
    'humidity' in obj &&
    'battery' in obj
  );
}

export async function fetchSensors(): Promise<SensorsData> {
  const mock = getMockValue('sensors');
  if (mock === 'loading') return createNeverResolvingPromise();
  if (mock === 'error') throw new Error('Нет связи с сенсорами.');
  if (mock === 'mock') return MOCK_SENSORS;

  const res = await fetch(SENSORS_URL);
  if (!res.ok) throw new Error(`Сенсоры: ${res.status}`);
  const raw = (await res.json()) as unknown;
  if (!isSensorsJson(raw)) throw new Error('Сенсоры: неверный ответ');
  return normalize(raw);
}
