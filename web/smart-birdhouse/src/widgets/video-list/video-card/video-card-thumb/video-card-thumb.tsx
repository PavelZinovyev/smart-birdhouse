import { useState } from 'react';
import { getThumbnailUrl } from '@/shared/api';
import styles from '../video-card.module.scss';

interface VideoCardThumbProps {
  fileName: string;
}

export const VideoCardThumb = ({ fileName }: VideoCardThumbProps) => {
  const [thumbFailed, setThumbFailed] = useState(false);
  const thumbUrl = getThumbnailUrl(fileName);

  return (
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
  );
};
