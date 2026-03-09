import styles from './stream-viewer-stop-overlay.module.scss';

interface StreamViewerStopOverlayProps {
  visible: boolean;
  onStop: () => void;
}

export const StreamViewerStopOverlay = ({ visible, onStop }: StreamViewerStopOverlayProps) => (
  <button
    type="button"
    className={styles.stopOverlay}
    onClick={onStop}
    aria-label="Остановить эфир"
    data-visible={visible}
  >
    <span className={styles.stopIcon} aria-hidden />
  </button>
);
