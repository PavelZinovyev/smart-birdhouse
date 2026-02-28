/**
 * Моки для списка видео — для проверки разных состояний UI.
 * Добавь ?mock=loading|error|empty|videos в URL и перезагрузи страницу.
 */

import type { PiVideoFile, PiVideosResponse } from './pi-videos';

export type MockMode = 'loading' | 'error' | 'empty' | 'videos' | null;

export function getMockMode(): MockMode {
  if (typeof window === 'undefined') return null;
  const m = new URLSearchParams(window.location.search).get('mock');
  if (m === 'loading' || m === 'error' || m === 'empty' || m === 'videos') return m;
  return null;
}

const NOW = Math.floor(Date.now() / 1000);

export const MOCK_VIDEOS: PiVideoFile[] = [
  { name: 'video_2025_02_28_08_15.mp4', size: 12_345_678, mtime: NOW - 3600 },
  { name: 'video_2025_02_28_10_30.mp4', size: 8_500_000, mtime: NOW - 1800 },
  { name: 'video_2025_02_27_18_45.mp4', size: 25_000_000, mtime: NOW - 86400 },
  { name: 'clip_bird_001.mp4', size: 3_200_000, mtime: NOW - 43200 },
  { name: 'video_2025_02_26_06_00.mp4', size: 45_600_000, mtime: NOW - 172800 },
];

// Файлы без превью (404) — для проверки placeholder "Нет превью"
export const MOCK_NO_THUMB_NAMES = new Set(['clip_bird_001.mp4']);

export function createMockResponse(mode: MockMode): PiVideosResponse | null {
  switch (mode) {
    case 'videos':
      return { files: MOCK_VIDEOS };
    case 'empty':
      return { files: [] };
    case 'error':
      return null;
    default:
      return null;
  }
}
