/**
 * Лог последних ответов ручки /videos (GET и DELETE) — статус и тело.
 * Нужен для отладки, когда с компа в сети ESP32 ручка не отдаёт данные.
 */

export interface VideosApiLogEntry {
  status: number;
  body: string;
  time: string;
}

export interface VideosApiLogState {
  get: VideosApiLogEntry | null;
  delete: VideosApiLogEntry | null;
}

const state: VideosApiLogState = {
  get: null,
  delete: null,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => cb());
}

export function getVideosApiLog(): VideosApiLogState {
  return { ...state, get: state.get ? { ...state.get } : null, delete: state.delete ? { ...state.delete } : null };
}

export function logVideosGet(status: number, body: string): void {
  state.get = { status, body, time: new Date().toISOString() };
  notify();
}

export function logVideosDelete(status: number, body: string): void {
  state.delete = { status, body, time: new Date().toISOString() };
  notify();
}

export function subscribeVideosApiLog(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
