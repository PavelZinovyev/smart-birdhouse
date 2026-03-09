/** Состояние виджета камеры (тег + вариант) */
export const CameraActivityState = {
  UNAVAILABLE: 'unavailable',
  RECORDING: 'recording',
  IDLE: 'idle',
} as const;

export type CameraActivityStateValue =
  (typeof CameraActivityState)[keyof typeof CameraActivityState];

export const CAMERA_ACTIVITY_LABELS: Record<CameraActivityStateValue, string> = {
  [CameraActivityState.UNAVAILABLE]: 'Недоступна',
  [CameraActivityState.RECORDING]: 'Идёт запись',
  [CameraActivityState.IDLE]: 'Готова',
};

export const CAMERA_ACTIVITY_TAG_VARIANT: Record<
  CameraActivityStateValue,
  'gray' | 'green' | 'yellow' | 'red'
> = {
  [CameraActivityState.UNAVAILABLE]: 'gray',
  [CameraActivityState.RECORDING]: 'red',
  [CameraActivityState.IDLE]: 'green',
};

export function getCameraActivityState(
  piOn: boolean,
  recording: boolean,
  manualMode: boolean,
): CameraActivityStateValue {
  if (!piOn) return CameraActivityState.UNAVAILABLE;
  if (recording) return CameraActivityState.RECORDING;
  if (!manualMode) return CameraActivityState.UNAVAILABLE;
  return CameraActivityState.IDLE;
}
