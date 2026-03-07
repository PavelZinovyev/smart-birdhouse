import { useState } from 'react';
import { getThumbnailUrl } from '@/shared/api';
import styles from '../video-card.module.scss';
import { VideoCardDeleteButton } from '../video-card-delete-button';
import { VideoCardDownloadButton } from '../video-card-download-button';

interface VideoCardThumbProps {
  fileName: string;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export const VideoCardThumb = ({ fileName, onDelete, isDeleting }: VideoCardThumbProps) => {
  const [thumbFailed, setThumbFailed] = useState(false);
  const thumbUrl = getThumbnailUrl(fileName);

  return (
    <div className={styles.thumbWrap}>
      {!thumbFailed && (
        <img
          className={styles.thumb}
          src={thumbUrl}
          alt=""
          loading="lazy"
          onError={() => setThumbFailed(true)}
        />
      )}
      {thumbFailed && <div className={styles.placeholder}>Нет превью</div>}
      <VideoCardDownloadButton fileName={fileName} />
      {onDelete && (
        <VideoCardDeleteButton fileName={fileName} onDelete={onDelete} isDeleting={isDeleting} />
      )}
      <div className={styles.playOverlay} aria-hidden>
        <div className={styles.playIcon} />
      </div>
    </div>
  );
};
