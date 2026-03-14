import {
  usePiStatus,
  usePiCameraStatus,
  useStopPiRecording,
  useStartPiRecording,
} from '@/shared/api';
import { WidgetLabel, StatusTag } from '@/shared/ui';
import {
  getCameraActivityState,
  CAMERA_ACTIVITY_LABELS,
  CAMERA_ACTIVITY_TAG_VARIANT,
} from '../lib/camera-activity-state';
import { ToggleSwitch } from '../../shared/ui/toggle-switch';
import styles from './pi-camera-widget.module.scss';
import { WidgetContent } from '@/shared/ui/widget-content/widget-content';

export type PiCameraWidgetProps = Pick<
  ReturnType<typeof usePiStatus>,
  'data' | 'isLoading' | 'isError'
> & { className?: string };

export const PiCameraWidget = ({ data: status }: PiCameraWidgetProps) => {
  const on = status?.pi_power ?? false;
  const { data: cameraStatus } = usePiCameraStatus(on);
  const recording = cameraStatus?.recording ?? false;
  const manualMode = cameraStatus?.manual_mode ?? false;
  const recordingError = cameraStatus?.recording_error ?? false;
  const {
    mutate: stopRecording,
    isPending: isStoppingRecording,
    error: stopError,
  } = useStopPiRecording();
  const {
    mutate: startRecording,
    isPending: isStartingRecording,
    error: startError,
  } = useStartPiRecording();

  const activityState = getCameraActivityState(on, recording, manualMode, recordingError);
  const activityLabel = CAMERA_ACTIVITY_LABELS[activityState];
  const tagVariant = CAMERA_ACTIVITY_TAG_VARIANT[activityState];

  const busy = isStoppingRecording || isStartingRecording;
  const standbyLike = !manualMode && !recording;
  const disabled = !on || busy || standbyLike || recording || recordingError;

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
    <WidgetContent ariaLabel="Камера" inactive={disabled}>
      <div className={styles.header}>
        <WidgetLabel label="Камера" />
        <ToggleSwitch
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
      {(startError || stopError) && (
        <div className={styles.error}>{(startError || stopError)?.message}</div>
      )}
    </WidgetContent>
  );
};
