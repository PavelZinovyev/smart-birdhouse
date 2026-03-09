import styles from './stream-viewer-stream.module.scss';

interface StreamViewerStreamProps {
  streamUrl: string;
  onLoaded?: () => void;
  onError?: () => void;
}

export const StreamViewerStream = ({ streamUrl, onLoaded, onError }: StreamViewerStreamProps) => (
  <img
    className={styles.stream}
    src={streamUrl}
    alt="Прямой эфир с камеры"
    referrerPolicy="no-referrer"
    onLoad={onLoaded}
    onError={onError}
  />
);
