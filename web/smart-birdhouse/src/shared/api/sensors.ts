/**
 * API сенсоров ESP32: GET /api/sensors
 * Ответ: { temperature, humidity, battery, distance_mm }
 * Моки: ?sensors=mock|loading|error
 */
import { getMockValue, createNeverResolvingPromise } from './mock';
import { MOCK_SENSORS } from './mock-data';

export interface SensorsData {
  temperature: number;
  humidity: number;
  battery: number;
  /** false = датчик батареи не подключён (питание только 3.3V без делителя) */
  battery_available?: boolean;
  distance_mm: number;
}

const SENSORS_URL = '/api/sensors';

function normalize(data: SensorsData): SensorsData {
  const d = Number(data.distance_mm);
  const battery = Number(data.battery) || 0;
  const battery_available =
    data.battery_available === true || (data.battery_available !== false && battery > 0);
  return {
    temperature: Number(data.temperature) || 0,
    humidity: Number(data.humidity) || 0,
    battery,
    battery_available,
    distance_mm: Number.isFinite(d) ? d : -1,
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
