import { useState } from 'react';
import { getThumbnailUrl } from '@/shared/api';
import TrashIcon from '@/shared/assets/trash-icon.svg?react';
import styles from '../video-card.module.scss';

interface VideoCardThumbProps {
  fileName: string;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export const VideoCardThumb = ({ fileName, onDelete, isDeleting }: VideoCardThumbProps) => {
  const [thumbFailed, setThumbFailed] = useState(false);
  const thumbUrl = getThumbnailUrl(fileName);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onDelete || isDeleting) return;
    if (window.confirm(`Удалить видео «${fileName}»?`)) {
      onDelete();
    }
  };

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
      {onDelete && (
        <button
          type="button"
          className={styles.deleteButton}
          onClick={handleDeleteClick}
          disabled={isDeleting}
          aria-label="Удалить видео"
          title="Удалить"
        >
          <TrashIcon />
        </button>
      )}
      <div className={styles.playOverlay} aria-hidden>
        <div className={styles.playIcon} />
      </div>
    </div>
  );
};
