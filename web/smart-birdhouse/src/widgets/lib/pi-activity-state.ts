/** Состояние активности Raspberry Pi (что делает, не питание) */
export const PiActivityState = {
  OFF: 'off',
  SHUTTING_DOWN: 'shutting_down',
  MANUAL: 'manual',
  STANDBY: 'standby',
} as const;

export type PiActivityStateValue = (typeof PiActivityState)[keyof typeof PiActivityState];

export const PI_ACTIVITY_LABELS: Record<PiActivityStateValue, string> = {
  [PiActivityState.OFF]: 'Выключено',
  [PiActivityState.SHUTTING_DOWN]: 'Выключение',
  [PiActivityState.MANUAL]: 'Ручной режим',
  [PiActivityState.STANDBY]: 'Включение',
};

export const PI_ACTIVITY_TAG_VARIANT: Record<
  PiActivityStateValue,
  'gray' | 'green' | 'yellow' | 'red'
> = {
  [PiActivityState.OFF]: 'gray',
  [PiActivityState.SHUTTING_DOWN]: 'yellow',
  [PiActivityState.MANUAL]: 'green',
  [PiActivityState.STANDBY]: 'yellow',
};

export function getPiActivityState(
  piPowerOn: boolean,
  shutdownRequested: boolean,
  manualMode: boolean,
): PiActivityStateValue {
  if (!piPowerOn) return shutdownRequested ? PiActivityState.SHUTTING_DOWN : PiActivityState.OFF;
  if (shutdownRequested) return PiActivityState.SHUTTING_DOWN;
  if (manualMode) return PiActivityState.MANUAL;
  return PiActivityState.STANDBY;
}
