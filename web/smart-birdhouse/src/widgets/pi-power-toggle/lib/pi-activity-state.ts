/** Состояние активности Raspberry Pi (что делает, не питание) */
export const PiActivityState = {
  OFF: 'off',
  SHUTTING_DOWN: 'shutting_down',
  RECORDING: 'recording',
  MANUAL: 'manual',
  STANDBY: 'standby',
  ERROR: 'error',
} as const;

export type PiActivityStateValue = (typeof PiActivityState)[keyof typeof PiActivityState];

export const PI_ACTIVITY_LABELS: Record<PiActivityStateValue, string> = {
  [PiActivityState.OFF]: 'Выключено',
  [PiActivityState.SHUTTING_DOWN]: 'Выключение…',
  [PiActivityState.RECORDING]: 'Идёт запись видео',
  [PiActivityState.MANUAL]: 'Ручной режим',
  [PiActivityState.STANDBY]: 'Ожидание',
  [PiActivityState.ERROR]: 'Ошибка записи',
};

export const PI_ACTIVITY_TAG_VARIANT: Record<PiActivityStateValue, 'gray' | 'green' | 'yellow' | 'red'> = {
  [PiActivityState.OFF]: 'gray',
  [PiActivityState.SHUTTING_DOWN]: 'gray',
  [PiActivityState.RECORDING]: 'green',
  [PiActivityState.MANUAL]: 'green',
  [PiActivityState.STANDBY]: 'yellow',
  [PiActivityState.ERROR]: 'red',
};

export function getPiActivityState(
  piPowerOn: boolean,
  shutdownRequested: boolean,
  recording: boolean,
  manualMode: boolean,
  recordingError?: boolean
): PiActivityStateValue {
  if (!piPowerOn) return shutdownRequested ? PiActivityState.SHUTTING_DOWN : PiActivityState.OFF;
  if (shutdownRequested) return PiActivityState.SHUTTING_DOWN;
  if (recordingError) return PiActivityState.ERROR;
  if (recording) return PiActivityState.RECORDING;
  if (manualMode) return PiActivityState.MANUAL;
  return PiActivityState.STANDBY;
}
