import { formatSize } from '../lib/format-size';
import { formatDate } from '../lib/format-date';
import styles from '../video-card.module.scss';

interface VideoCardInfoProps {
  fileName: string;
  size: number;
  mtime: number;
}

export const VideoCardInfo = ({ fileName, size, mtime }: VideoCardInfoProps) => (
  <div className={styles.info}>
    <div className={styles.name}>{fileName}</div>
    <div className={styles.meta}>
      {formatSize(size)} · {formatDate(mtime)}
    </div>
  </div>
);
