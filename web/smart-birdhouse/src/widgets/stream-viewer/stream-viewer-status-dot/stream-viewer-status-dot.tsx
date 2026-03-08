import classNames from 'classnames';
import styles from './stream-viewer-status-dot.module.scss';

interface StreamViewerStatusDotProps {
  active: boolean;
}

export const StreamViewerStatusDot = ({ active }: StreamViewerStatusDotProps) => (
  <span className={classNames(styles.dot, active && styles.dotActive)} aria-hidden />
);
