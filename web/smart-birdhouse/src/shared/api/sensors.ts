/**
 * API сенсоров ESP32: GET /api/sensors
 * Ответ: { temperature, humidity, battery, distance_mm }
 * Если ESP32 недоступен(ноутбук на обычном Wi‑Fi) — возвращаем мок для разработки
 */
export interface SensorsData {
  temperature: number;
  humidity: number;
  battery: number;
  /** false = датчик батареи не подключён (питание только 3.3V без делителя) */
  battery_available?: boolean;
  distance_mm: number;
}

export interface SensorsResult {
  data: SensorsData;
  isMock: boolean;
}

const SENSORS_URL = '/api/sensors';

/** Мок для разработки, когда не подключены к точке доступа ESP32 */
function getMockSensorsData(): SensorsData {
  return {
    temperature: 22.5,
    humidity: 55,
    battery: 78,
    battery_available: true,
    distance_mm: -1,
  };
}

function normalize(data: SensorsData): SensorsData {
  const d = Number(data.distance_mm);
  const battery = Number(data.battery) || 0;
  // Датчик есть только если API явно сказал true или (не сказал false и заряд > 0)
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

export async function fetchSensors(): Promise<SensorsResult> {
  try {
    const res = await fetch(SENSORS_URL);
    if (!res.ok) return { data: getMockSensorsData(), isMock: true };
    const text = await res.text();
    const raw = JSON.parse(text) as unknown;
    if (isSensorsJson(raw)) {
      return { data: normalize(raw), isMock: false };
    }
    return { data: getMockSensorsData(), isMock: true };
  } catch {
    return { data: getMockSensorsData(), isMock: true };
  }
}
