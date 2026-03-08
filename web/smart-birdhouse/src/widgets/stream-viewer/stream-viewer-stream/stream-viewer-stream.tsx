import styles from './stream-viewer-stream.module.scss';

interface StreamViewerStreamProps {
  streamUrl: string;
}

export const StreamViewerStream = ({ streamUrl }: StreamViewerStreamProps) => (
  <img
    className={styles.stream}
    src={streamUrl}
    alt="Прямой эфир с камеры"
    referrerPolicy="no-referrer"
  />
);
