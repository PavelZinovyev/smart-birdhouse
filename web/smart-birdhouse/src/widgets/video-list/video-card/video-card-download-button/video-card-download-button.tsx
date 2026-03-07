import classNames from 'classnames';
import { getVideoUrl } from '@/shared/api';
import { useDownloadFile } from '@/shared/hooks';
import DownloadIcon from '@/shared/assets/download-icon.svg?react';
import styles from '../video-card.module.scss';

interface VideoCardDownloadButtonProps {
  fileName: string;
}

export const VideoCardDownloadButton = ({ fileName }: VideoCardDownloadButtonProps) => {
  const { download, loading } = useDownloadFile();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    if (loading) return;
    download(getVideoUrl(fileName), fileName).catch((err) => {
      alert(`Не удалось скачать: ${err instanceof Error ? err.message : err}`);
    });
  };

  return (
    <button
      type="button"
      className={classNames(styles.downloadButton, loading && styles.downloadButtonLoading)}
      onClick={handleClick}
      disabled={loading}
      aria-label={loading ? 'Скачивание…' : 'Скачать видео'}
      title={loading ? 'Скачивание…' : 'Скачать'}
      aria-busy={loading}
    >
      {loading ? <span className={styles.downloadButtonSpinner} aria-hidden /> : <DownloadIcon />}
    </button>
  );
};
