import TrashIcon from '@/shared/assets/trash-icon.svg?react';
import styles from '../video-card.module.scss';

interface VideoCardDeleteButtonProps {
  fileName: string;
  onDelete: () => void;
  isDeleting?: boolean;
}

export const VideoCardDeleteButton = ({
  fileName,
  onDelete,
  isDeleting = false,
}: VideoCardDeleteButtonProps) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDeleting) return;
    if (window.confirm(`Удалить видео «${fileName}»?`)) {
      onDelete();
    }
  };

  return (
    <button
      type="button"
      className={styles.deleteButton}
      onClick={handleClick}
      disabled={isDeleting}
      aria-label="Удалить видео"
      title="Удалить"
    >
      <TrashIcon />
    </button>
  );
};
