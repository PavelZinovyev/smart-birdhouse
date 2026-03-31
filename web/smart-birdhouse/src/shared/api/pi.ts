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

export interface PiCameraStatus {
  recording: boolean;
  manual_mode: boolean;
  files: string[];
  recording_error?: boolean;
}

/** Время на Raspberry (учёт смещения после синка с телефона). */
export interface PiTimeInfo {
  unix_s: number;
  local: string;
  offset_s: number;
}

const PI_STATUS_URL = '/api/pi/status';
const PI_POWER_URL = '/api/pi/power';
const PI_SHUTDOWN_URL = `${PI_VIDEOS_BASE_URL}/shutdown`;
const PI_CAMERA_STATUS_URL = `${PI_VIDEOS_BASE_URL}/status`;
const PI_RECORD_STOP_URL = `${PI_VIDEOS_BASE_URL}/record/stop`;
const PI_RECORD_START_URL = `${PI_VIDEOS_BASE_URL}/record/start`;
const PI_TIME_URL = `${PI_VIDEOS_BASE_URL}/api/time`;
const PI_TIME_SYNC_URL = `${PI_VIDEOS_BASE_URL}/api/time/sync`;

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
    if (!on) {
      try {
        await fetch(PI_SHUTDOWN_URL, { method: 'POST' });
      } catch {
        console.error('error while turn off pi');
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

export async function fetchPiCameraStatus(): Promise<PiCameraStatus | null> {
  try {
    const res = await fetch(PI_CAMERA_STATUS_URL);
    if (!res.ok) return null;
    const raw = (await res.json()) as unknown;
    if (typeof raw === 'object' && raw !== null && 'recording' in raw) {
      const r = raw as {
        recording?: boolean;
        manual_mode?: boolean;
        files?: string[];
        recording_error?: boolean;
      };
      return {
        recording: Boolean(r.recording),
        manual_mode: Boolean(r.manual_mode),
        files: Array.isArray(r.files) ? r.files : [],
        recording_error: Boolean(r.recording_error),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function stopPiRecording(): Promise<boolean> {
  try {
    const res = await fetch(PI_RECORD_STOP_URL, { method: 'POST' });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(body || `stop recording failed: ${res.status}`);
    }
    return true;
  } catch (err) {
    throw err instanceof Error ? err : new Error(String(err));
  }
}

export async function startPiRecording(): Promise<boolean> {
  try {
    const res = await fetch(PI_RECORD_START_URL, { method: 'POST' });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(body || `start recording failed: ${res.status}`);
    }
    return true;
  } catch (err) {
    throw err instanceof Error ? err : new Error(String(err));
  }
}

export async function fetchPiTime(): Promise<PiTimeInfo | null> {
  try {
    const res = await fetch(PI_TIME_URL);
    if (!res.ok) return null;
    const raw = (await res.json()) as unknown;
    if (typeof raw !== 'object' || raw === null || !('unix_s' in raw) || !('local' in raw)) {
      return null;
    }
    const r = raw as { unix_s: unknown; local: unknown; offset_s?: unknown };
    return {
      unix_s: Number(r.unix_s),
      local: String(r.local),
      offset_s: Number(r.offset_s ?? 0),
    };
  } catch {
    return null;
  }
}

/**
 * Передаёт время с телефона (Date.now()); Pi сохраняет смещение без sudo.
 */
export async function syncPiTimeFromPhone(unixMs: number): Promise<PiTimeInfo> {
  const res = await fetch(PI_TIME_SYNC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ unix_ms: unixMs }),
  });
  let raw: unknown;
  try {
    raw = await res.json();
  } catch {
    throw new Error(res.ok ? 'Пустой ответ сервера' : `Ошибка сервера (${res.status})`);
  }
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Пустой ответ сервера');
  }
  const body = raw as {
    ok?: boolean;
    error?: string;
    unix_s?: unknown;
    local?: unknown;
    offset_s?: unknown;
  };
  if (!body.ok) {
    throw new Error(body.error || 'Не удалось синхронизировать время');
  }
  return {
    unix_s: Number(body.unix_s),
    local: String(body.local ?? ''),
    offset_s: Number(body.offset_s ?? 0),
  };
}
