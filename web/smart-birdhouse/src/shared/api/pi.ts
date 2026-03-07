/**
 * api управления питанием распи на esp32: GET /api/pi/status, POST /api/pi/power.
 * моки: добавляем в урл ?pi=mock|loading|error
 */

import { getMockValue, createNeverResolvingPromise } from './mock';
import { MOCK_PI_STATUS } from './mock-data';
import { PI_VIDEOS_BASE_URL } from '@/shared/constants/pi';

export interface PiStatus {
  pi_power: boolean;
  state: number;
  manual: boolean;
}

const PI_STATUS_URL = '/api/pi/status';
const PI_POWER_URL = '/api/pi/power';
const PI_SHUTDOWN_URL = `${PI_VIDEOS_BASE_URL}/shutdown`;

/** Таймаут для POST /api/pi/power: ESP32 обрабатывает запросы по одному, пока отдает статику - ответ может задерживаться */
const PI_POWER_TIMEOUT_MS = 12_000;

export async function fetchPiStatus(): Promise<PiStatus | null> {
  const mock = getMockValue('pi');
  if (mock === 'loading') return createNeverResolvingPromise();
  if (mock === 'error') throw new Error('Нет связи с Raspberry Pi.');
  if (mock === 'mock') return MOCK_PI_STATUS;

  try {
    const res = await fetch(PI_STATUS_URL);
    if (!res.ok) throw new Error(`pi status ${res.status}`);
    const raw = (await res.json()) as unknown;
    if (typeof raw === 'object' && raw !== null && 'pi_power' in raw) {
      return {
        pi_power: Boolean((raw as PiStatus).pi_power),
        state: Number((raw as PiStatus).state) || 0,
        manual: Boolean((raw as PiStatus).manual),
      };
    }
    throw new Error('invalid pi status response');
  } catch (err) {
    throw err instanceof Error ? err : new Error(String(err));
  }
}

export async function setPiPower(on: boolean, manual: boolean): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PI_POWER_TIMEOUT_MS);
  try {
    // при выключении Pi сначала мягко просим её завершить работу через Flask (/shutdown),
    // затем через ESP32 отключаем питание (с задержкой на самой ESP32).
    if (!on) {
      try {
        await fetch(PI_SHUTDOWN_URL, { method: 'POST' });
      } catch {
        // Если нет связи с Pi, всё равно попробуем выключить питание на ESP32.
      }
    }

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
