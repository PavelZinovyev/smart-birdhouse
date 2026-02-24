/**
 * API управления питанием Raspberry Pi на ESP32: GET /api/pi/status, POST /api/pi/power
 */

export interface PiStatus {
  pi_power: boolean;
  state: number;
  manual: boolean;
}

const PI_STATUS_URL = '/api/pi/status';
const PI_POWER_URL = '/api/pi/power';

/** Таймаут для POST /api/pi/power: ESP32 обрабатывает запросы по одному, пока отдает статику - ответ может задерживаться */
const PI_POWER_TIMEOUT_MS = 12_000;

export async function fetchPiStatus(): Promise<PiStatus | null> {
  try {
    const res = await fetch(PI_STATUS_URL);
    if (!res.ok) return null;
    const raw = (await res.json()) as unknown;
    if (
      typeof raw === 'object' &&
      raw !== null &&
      'pi_power' in raw
    ) {
      return {
        pi_power: Boolean((raw as PiStatus).pi_power),
        state: Number((raw as PiStatus).state) || 0,
        manual: Boolean((raw as PiStatus).manual),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function setPiPower(on: boolean, manual: boolean): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PI_POWER_TIMEOUT_MS);
  try {
    const res = await fetch(PI_POWER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ on, manual }),
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}
