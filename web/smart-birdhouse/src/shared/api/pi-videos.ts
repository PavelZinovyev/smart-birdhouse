/**
 * API списка видео с Raspberry Pi: GET /videos, превью и файл по имени.
 */

import { PI_VIDEOS_BASE_URL } from '@/shared/constants/pi';
import { logVideosGet, logVideosDelete } from './videos-api-log';
import { getMockMode, createMockResponse, MOCK_NO_THUMB_NAMES } from './pi-videos-mock';

export interface IPiVideoFile {
  name: string;
  size: number;
  mtime: number;
}

export interface PiVideosResponse {
  files: IPiVideoFile[];
}

const VIDEOS_URL = `${PI_VIDEOS_BASE_URL}/videos`;

export async function fetchPiVideos(): Promise<PiVideosResponse | null> {
  const mock = getMockMode();
  if (mock === 'loading') {
    return new Promise(() => {});
  }
  if (mock === 'error') {
    throw new Error('Нет связи с Raspberry Pi (включите Pi и подключите его к Wi‑Fi скворечника).');
  }
  const mockData = createMockResponse(mock);
  if (mockData !== null) {
    return mockData;
  }

  try {
    const res = await fetch(VIDEOS_URL);
    const body = await res.text();
    logVideosGet(res.status, body);
    if (!res.ok) return null;
    let raw: unknown;
    try {
      raw = JSON.parse(body) as unknown;
    } catch {
      return null;
    }
    if (typeof raw === 'object' && raw !== null && 'files' in raw) {
      const files = (raw as PiVideosResponse).files;
      return { files: Array.isArray(files) ? files : [] };
    }
    return null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logVideosGet(0, `fetch error: ${msg}`);
    return null;
  }
}

export function getThumbnailUrl(name: string): string {
  const mock = getMockMode();
  if (mock === 'videos') {
    if (MOCK_NO_THUMB_NAMES.has(name)) {
      return 'https://invalid-placeholder.local/404';
    }
    const seed = encodeURIComponent(name);
    return `https://picsum.photos/seed/${seed}/320/180`;
  }
  return `${PI_VIDEOS_BASE_URL}/videos/thumbnail/${encodeURIComponent(name)}`;
}

export function getVideoUrl(name: string): string {
  return `${PI_VIDEOS_BASE_URL}/videos/${encodeURIComponent(name)}`;
}

export function getVideoDownloadUrl(name: string): string {
  return `${getVideoUrl(name)}?download=1`;
}

export async function deletePiVideo(name: string): Promise<{ ok: boolean }> {
  const mock = getMockMode();
  if (mock !== null) {
    throw new Error('Удаление недоступно в режиме демо');
  }

  const url = `${PI_VIDEOS_BASE_URL}/videos/${encodeURIComponent(name)}`;
  try {
    const res = await fetch(url, { method: 'DELETE' });
    const body = await res.text();
    logVideosDelete(res.status, body);
    if (!res.ok) {
      throw new Error(body || `Ошибка удаления: ${res.status}`);
    }
    let data: { ok?: boolean };
    try {
      data = JSON.parse(body) as { ok?: boolean };
    } catch {
      data = {};
    }
    return { ok: data?.ok ?? true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logVideosDelete(0, `fetch error: ${msg}`);
    throw err;
  }
}
