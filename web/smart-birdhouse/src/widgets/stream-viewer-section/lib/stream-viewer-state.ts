import type { StreamStatus } from '../stream-viewer-status-dot';

export const StreamViewState = {
  IDLE: 'idle',
  UNAVAILABLE: 'unavailable',
  LOADING: 'loading',
  PLAYING: 'playing',
  ERROR: 'error',
} as const;

export type StreamViewStateValue = (typeof StreamViewState)[keyof typeof StreamViewState];

export const STREAM_VIEW_STATUS_LABELS: Partial<Record<StreamViewStateValue, string>> = {
  [StreamViewState.UNAVAILABLE]: 'Недоступно: идёт запись видео',
  [StreamViewState.ERROR]: 'Непредвиденная ошибка',
};

export const STREAM_ERROR_OVERLAY_MESSAGE =
  'Не удалось воспроизвести (например, камера записывает)';

export function getStreamViewState(
  isStreamActive: boolean,
  isStreamLoaded: boolean,
  streamError: boolean,
  isRecording: boolean,
): StreamViewStateValue {
  if (!isStreamActive) return isRecording ? StreamViewState.UNAVAILABLE : StreamViewState.IDLE;
  if (streamError) return StreamViewState.ERROR;
  if (!isStreamLoaded) return StreamViewState.LOADING;
  return StreamViewState.PLAYING;
}

export function streamViewStateToDotStatus(state: StreamViewStateValue): StreamStatus {
  if (state === StreamViewState.LOADING) return 'loading';
  if (state === StreamViewState.PLAYING) return 'playing';
  if (state === StreamViewState.ERROR) return 'error';
  return 'idle';
}
