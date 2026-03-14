import { useState, useCallback } from 'react';
import { usePiPower, usePiStatus, usePiCameraStatus } from '@/shared/api';
import {
  getPiActivityState,
  PI_ACTIVITY_LABELS,
  PI_ACTIVITY_TAG_VARIANT,
} from '../../lib/pi-activity-state';

export type PiPowerWidgetPropsBase = Pick<
  ReturnType<typeof usePiStatus>,
  'data' | 'isLoading' | 'isError'
>;

export interface UsePiPowerWidgetResult {
  on: boolean;
  activityLabel: string;
  tagVariant: (typeof PI_ACTIVITY_TAG_VARIANT)[keyof typeof PI_ACTIVITY_TAG_VARIANT];
  disabled: boolean;
  handleChange: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

export const usePiPowerWidget = ({
  data: status,
  isLoading,
  isError,
}: PiPowerWidgetPropsBase): UsePiPowerWidgetResult => {
  const { turnOnManual, turnOff, isPending } = usePiPower();
  const [shutdownRequested, setShutdownRequested] = useState(false);

  const on = status?.pi_power ?? false;
  const { data: cameraStatus } = usePiCameraStatus(on);
  const manualMode = cameraStatus?.manual_mode ?? false;
  const recordingError = cameraStatus?.recording_error ?? false;

  const isShuttingDown = shutdownRequested && on;
  const activityState = getPiActivityState(on, isShuttingDown, manualMode, recordingError);
  const activityLabel = PI_ACTIVITY_LABELS[activityState];
  const tagVariant = PI_ACTIVITY_TAG_VARIANT[activityState];

  const busy = isPending || isLoading;
  const disabled = !!isError || busy || isShuttingDown;

  const handleChange = useCallback(() => {
    if (disabled) return;
    if (on) {
      setShutdownRequested(true);
      turnOff();
    } else {
      turnOnManual();
    }
  }, [disabled, on, turnOff, turnOnManual]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleChange();
      }
    },
    [handleChange],
  );

  return {
    on,
    activityLabel,
    tagVariant,
    disabled,
    handleChange,
    handleKeyDown,
  };
};
