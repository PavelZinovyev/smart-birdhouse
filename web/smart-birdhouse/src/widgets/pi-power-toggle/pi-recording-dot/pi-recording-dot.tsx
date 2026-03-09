import classNames from 'classnames';
import styles from './pi-recording-dot.module.scss';

interface PiRecordingDotProps {
  recording: boolean;
}

export const PiRecordingDot = ({ recording }: PiRecordingDotProps) => (
  <span
    className={classNames(styles.dot, recording && styles.dotRecording)}
    aria-hidden
    aria-label={'состояние записи'}
  />
);
