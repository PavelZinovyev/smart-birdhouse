import styles from './stream-viewer-placeholder.module.scss';

interface StreamViewerPlaceholderProps {
  onStart: () => void;
}

export const StreamViewerPlaceholder = ({ onStart }: StreamViewerPlaceholderProps) => (
  <button
    type="button"
    className={styles.placeholder}
    onClick={onStart}
    aria-label="Начать просмотр прямого эфира"
  >
    <span className={styles.placeholderIcon} aria-hidden />
  </button>
);
