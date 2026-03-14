import styles from './stream-viewer-loader-overlay.module.scss';

export const StreamViewerLoaderOverlay = () => (
  <div className={styles.loaderOverlay} aria-busy aria-label="Загрузка эфира">
    <span className={styles.loader} />
  </div>
);
