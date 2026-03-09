import classNames from 'classnames';
import styles from './stream-viewer-status-dot.module.scss';

export type StreamStatus = 'idle' | 'loading' | 'playing' | 'error';

interface StreamViewerStatusDotProps {
  status: StreamStatus;
}

export const StreamViewerStatusDot = ({ status }: StreamViewerStatusDotProps) => (
  <span
    className={classNames(styles.dot, styles[`dot_${status}`])}
    aria-hidden
    aria-label={status}
  />
);
