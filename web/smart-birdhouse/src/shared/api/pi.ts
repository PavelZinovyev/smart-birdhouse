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

const PI_STATUS_URL = '/api/pi/status';
const PI_POWER_URL = '/api/pi/power';
const PI_SHUTDOWN_URL = `${PI_VIDEOS_BASE_URL}/shutdown`;
const PI_CAMERA_STATUS_URL = `${PI_VIDEOS_BASE_URL}/status`;
const PI_RECORD_STOP_URL = `${PI_VIDEOS_BASE_URL}/record/stop`;
const PI_RECORD_START_URL = `${PI_VIDEOS_BASE_URL}/record/start`;

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
    return res.ok;
  } catch {
    return false;
  }
}

export async function startPiRecording(): Promise<boolean> {
  try {
    const res = await fetch(PI_RECORD_START_URL, { method: 'POST' });
    return res.ok;
  } catch {
    return false;
  }
}
