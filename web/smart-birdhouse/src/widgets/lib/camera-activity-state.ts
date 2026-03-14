/** Состояние виджета камеры (тег + вариант) */
export const CameraActivityState = {
  UNAVAILABLE: 'unavailable',
  RECORDING_ERROR: 'recording_error',
  RECORDING: 'recording',
  IDLE: 'idle',
} as const;

export type CameraActivityStateValue =
  (typeof CameraActivityState)[keyof typeof CameraActivityState];

export const CAMERA_ACTIVITY_LABELS: Record<CameraActivityStateValue, string> = {
  [CameraActivityState.UNAVAILABLE]: 'Недоступна',
  [CameraActivityState.RECORDING_ERROR]: 'Ошибка записи',
  [CameraActivityState.RECORDING]: 'Идет запись',
  [CameraActivityState.IDLE]: 'Готова',
};

export const CAMERA_ACTIVITY_TAG_VARIANT: Record<
  CameraActivityStateValue,
  'gray' | 'green' | 'yellow' | 'red'
> = {
  [CameraActivityState.UNAVAILABLE]: 'gray',
  [CameraActivityState.RECORDING_ERROR]: 'red',
  [CameraActivityState.RECORDING]: 'red',
  [CameraActivityState.IDLE]: 'green',
};

export function getCameraActivityState(
  piOn: boolean,
  recording: boolean,
  manualMode: boolean,
  recordingError?: boolean,
): CameraActivityStateValue {
  if (!piOn) return CameraActivityState.UNAVAILABLE;
  if (recordingError) return CameraActivityState.RECORDING_ERROR;
  if (recording) return CameraActivityState.RECORDING;
  if (!manualMode) return CameraActivityState.UNAVAILABLE;
  return CameraActivityState.IDLE;
}
