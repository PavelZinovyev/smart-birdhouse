import {
  usePiStatus,
  usePiCameraStatus,
  useStopPiRecording,
  useStartPiRecording,
} from '@/shared/api';
import classNames from 'classnames';
import { WidgetLabel, StatusTag } from '@/shared/ui';
import {
  getCameraActivityState,
  CAMERA_ACTIVITY_LABELS,
  CAMERA_ACTIVITY_TAG_VARIANT,
} from '../lib/camera-activity-state';
import { PiPowerToggleSwitch } from '../pi-power-toggle-switch';
import styles from './pi-camera-widget.module.scss';

export type PiCameraWidgetProps = Pick<
  ReturnType<typeof usePiStatus>,
  'data' | 'isLoading' | 'isError'
> & { className?: string };

export const PiCameraWidget = ({ data: status, className }: PiCameraWidgetProps) => {
  const on = status?.pi_power ?? false;
  const { data: cameraStatus } = usePiCameraStatus(on);
  const recording = cameraStatus?.recording ?? false;
  const manualMode = cameraStatus?.manual_mode ?? false;
  const { mutate: stopRecording, isPending: isStoppingRecording } = useStopPiRecording();
  const { mutate: startRecording, isPending: isStartingRecording } = useStartPiRecording();

  const activityState = getCameraActivityState(on, recording, manualMode);
  const activityLabel = CAMERA_ACTIVITY_LABELS[activityState];
  const tagVariant = CAMERA_ACTIVITY_TAG_VARIANT[activityState];

  const busy = isStoppingRecording || isStartingRecording;
  const standbyLike = !manualMode && !recording;
  const disabled = !on || busy || standbyLike;

  const handleToggle = () => {
    if (disabled) return;
    if (recording) stopRecording();
    else startRecording();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <article
      className={classNames(
        styles.root,
        className,
        (!on || standbyLike) && styles.inactive,
      )}
      aria-label="Камера Raspberry Pi"
    >
      <div className={styles.header}>
        <WidgetLabel label="Камера" />
        <PiPowerToggleSwitch
          checked={recording}
          disabled={disabled}
          aria-label="Запись"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div className={styles.content}>
        <StatusTag variant={tagVariant}>{activityLabel}</StatusTag>
      </div>
    </article>
  );
};
