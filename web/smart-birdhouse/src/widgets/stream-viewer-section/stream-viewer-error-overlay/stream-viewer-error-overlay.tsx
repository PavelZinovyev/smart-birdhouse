import { STREAM_ERROR_OVERLAY_MESSAGE } from '../lib/stream-viewer-state';
import styles from './stream-viewer-error-overlay.module.scss';

interface StreamViewerErrorOverlayProps {
  onClose: () => void;
}

export const StreamViewerErrorOverlay = ({ onClose }: StreamViewerErrorOverlayProps) => (
  <div className={styles.errorOverlay}>
    <p className={styles.errorText}>{STREAM_ERROR_OVERLAY_MESSAGE}</p>
    <button type="button" className={styles.controlBtn} onClick={onClose} aria-label="Закрыть">
      Закрыть
    </button>
  </div>
);
