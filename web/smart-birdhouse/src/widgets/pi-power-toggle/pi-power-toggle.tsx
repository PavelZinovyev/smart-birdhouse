import { useState } from 'react';
import {
  usePiPower,
  usePiStatus,
  usePiCameraStatus,
  useStopPiRecording,
  useStartPiRecording,
} from '@/shared/api';
import {
  getPiActivityState,
  PI_ACTIVITY_LABELS,
  PI_ACTIVITY_TAG_VARIANT,
} from './lib/pi-activity-state';
import { PiPowerToggleTitle } from './pi-power-toggle-title';
import { PiPowerToggleStateRow } from './pi-power-toggle-state-row';
import { PiPowerToggleSwitch } from './pi-power-toggle-switch';
import styles from './pi-power-toggle.module.scss';

export type PiPowerToggleProps = Pick<
  ReturnType<typeof usePiStatus>,
  'data' | 'isLoading' | 'isError'
>;

export const PiPowerToggle = ({ data: status, isLoading, isError }: PiPowerToggleProps) => {
  const { turnOnManual, turnOff, isPending } = usePiPower();
  const [shutdownRequested, setShutdownRequested] = useState(false);

  const on = status?.pi_power ?? false;
  const { data: cameraStatus } = usePiCameraStatus(on);
  const recording = cameraStatus?.recording ?? false;
  const manualMode = cameraStatus?.manual_mode ?? false;
  const recordingError = cameraStatus?.recording_error ?? false;
  const { mutate: stopRecording, isPending: isStoppingRecording } = useStopPiRecording();
  const { mutate: startRecording, isPending: isStartingRecording } = useStartPiRecording();

  const activityState = getPiActivityState(on, shutdownRequested, manualMode, recordingError);
  const activityLabel = PI_ACTIVITY_LABELS[activityState];
  const tagVariant = PI_ACTIVITY_TAG_VARIANT[activityState];

  const isShuttingDown = shutdownRequested && on;
  const busy = isPending || isLoading;
  const disabled = isError || busy || isShuttingDown;

  const handleChange = () => {
    if (disabled) return;
    if (on) {
      setShutdownRequested(true);
      turnOff();
    } else {
      turnOnManual();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleChange();
    }
  };

  return (
    <article className={styles.root} aria-label="Raspberry Pi">
      <PiPowerToggleTitle label="Raspberry" recording={on ? recording : undefined} />
      <div className={styles.content}>
        <PiPowerToggleStateRow
          activityLabel={activityLabel}
          tagVariant={tagVariant}
          showStopRecording={on && recording}
          showStartRecording={on && !recording}
          onStopRecording={() => stopRecording()}
          onStartRecording={() => startRecording()}
          isStoppingRecording={isStoppingRecording}
          isStartingRecording={isStartingRecording}
        />
        <PiPowerToggleSwitch
          checked={on}
          disabled={disabled}
          onClick={handleChange}
          onKeyDown={handleKeyDown}
        />
      </div>
    </article>
  );
};
