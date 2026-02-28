import { useState } from 'react';
import { getThumbnailUrl, getVideoUrl, type PiVideoFile } from '@/shared/api';
import { formatSize } from './lib/format-size';
import { formatDate } from './lib/format-date';
import styles from './video-card.module.scss';

const CARD_WIDTH = '160px';

export const VideoCard = ({ file }: { file: PiVideoFile }) => {
  const thumbUrl = getThumbnailUrl(file.name);
  const videoUrl = getVideoUrl(file.name);
  const [thumbFailed, setThumbFailed] = useState(false);

  return (
    <a
      className={styles.root}
      href={videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={file.name}
    >
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
          <div className={styles.placeholder} style={{ width: CARD_WIDTH }}>
            Нет превью
          </div>
        )}
      </div>
      <div className={styles.info}>
        <div className={styles.name} style={{ width: CARD_WIDTH }}>
          {file.name}
        </div>
        <div className={styles.meta}>
          {formatSize(file.size)} · {formatDate(file.mtime)}
        </div>
      </div>
    </a>
  );
};
