import styles from './stream-viewer-unavailable.module.scss';

export const StreamViewerUnavailable = () => (
  <div className={styles.unavailableBlock}>
    <span className={styles.unavailableIcon} aria-hidden />
  </div>
);
