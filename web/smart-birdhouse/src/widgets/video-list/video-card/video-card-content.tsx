import { useState } from 'react';
import { getThumbnailUrl, type PiVideoFile } from '@/shared/api';
import { formatSize } from './lib/format-size';
import { formatDate } from './lib/format-date';
import styles from './video-card.module.scss';

export interface VideoCardContentProps {
  file: PiVideoFile;
}

export const VideoCardContent = ({ file }: VideoCardContentProps) => {
  const [thumbFailed, setThumbFailed] = useState(false);
  const thumbUrl = getThumbnailUrl(file.name);

  return (
    <>
      <div className={styles.thumbWrap}>
        {!thumbFailed ? (
          <img
            className={styles.thumb}
            src={thumbUrl}
            alt=""
            loading="lazy"
            onError={() => setThumbFailed(true)}
          />
        ) : (
          <div className={styles.placeholder}>Нет превью</div>
        )}
        <div className={styles.playOverlay} aria-hidden>
          <div className={styles.playIcon} />
        </div>
      </div>
      <div className={styles.info}>
        <div className={styles.name}>{file.name}</div>
        <div className={styles.meta}>
          {formatSize(file.size)} · {formatDate(file.mtime)}
        </div>
      </div>
    </>
  );
};
