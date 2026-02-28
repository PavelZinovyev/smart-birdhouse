/**
 * API списка видео с Raspberry Pi: GET /videos, превью и файл по имени.
 */

import { PI_VIDEOS_BASE_URL } from '@/shared/constants/pi';
import { getMockMode, createMockResponse, MOCK_NO_THUMB_NAMES } from './pi-videos-mock';

export interface PiVideoFile {
  name: string;
  size: number;
  mtime: number;
}

export interface PiVideosResponse {
  files: PiVideoFile[];
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
    if (!res.ok) return null;
    const raw = (await res.json()) as unknown;
    if (typeof raw === 'object' && raw !== null && 'files' in raw) {
      const files = (raw as PiVideosResponse).files;
      return { files: Array.isArray(files) ? files : [] };
    }
    return null;
  } catch {
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
