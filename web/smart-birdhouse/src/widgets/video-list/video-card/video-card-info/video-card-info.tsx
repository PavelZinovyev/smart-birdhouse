import TrashIcon from '@/shared/assets/trash-icon.svg?react';
import { formatSize } from '../lib/format-size';
import { formatDate } from '../lib/format-date';
import styles from '../video-card.module.scss';

interface VideoCardInfoProps {
  fileName: string;
  size: number;
  mtime: number;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export const VideoCardInfo = ({
  fileName,
  size,
  mtime,
  onDelete,
  isDeleting,
}: VideoCardInfoProps) => {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onDelete || isDeleting) return;
    if (window.confirm(`Удалить видео «${fileName}»?`)) {
      onDelete();
    }
  };

  return (
    <div className={styles.info}>
      <div className={styles.infoTop}>
        <div className={styles.name}>{fileName}</div>
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
      </div>
      <div className={styles.meta}>
        {formatSize(size)} · {formatDate(mtime)}
      </div>
    </div>
  );
};
