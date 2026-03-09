import classNames from 'classnames';
import { StatusTag } from '@/shared/ui';
import type { StatusTagVariant } from '@/shared/ui';
import styles from './pi-power-toggle-state-row.module.scss';

interface PiPowerToggleStateRowProps {
  activityLabel: string;
  tagVariant: StatusTagVariant;
  showStopRecording?: boolean;
  showStartRecording?: boolean;
  onStopRecording?: () => void;
  onStartRecording?: () => void;
  isStoppingRecording?: boolean;
  isStartingRecording?: boolean;
}

export const PiPowerToggleStateRow = ({
  activityLabel,
  tagVariant,
  showStopRecording = false,
  showStartRecording = false,
  onStopRecording,
  onStartRecording,
  isStoppingRecording = false,
  isStartingRecording = false,
}: PiPowerToggleStateRowProps) => (
  <div className={styles.stateRow}>
    <StatusTag variant={tagVariant}>{activityLabel}</StatusTag>
    {showStopRecording && (
      <button
        type="button"
        className={classNames(styles.recordControl, styles.recordControl_stop)}
        onClick={onStopRecording}
        disabled={isStoppingRecording}
        aria-label="Остановить запись видео"
      >
        <span className={styles.recordControlIcon} aria-hidden />
      </button>
    )}
    {showStartRecording && (
      <button
        type="button"
        className={classNames(styles.recordControl, styles.recordControl_play)}
        onClick={onStartRecording}
        disabled={isStartingRecording}
        aria-label="Начать запись вручную"
      >
        <span className={styles.recordControlIcon} aria-hidden />
      </button>
    )}
  </div>
);
