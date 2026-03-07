import { getVideoUrl } from '@/shared/api';
import DownloadIcon from '@/shared/assets/download-icon.svg?react';
import styles from '../video-card.module.scss';

interface VideoCardDownloadButtonProps {
  fileName: string;
}

export const VideoCardDownloadButton = ({ fileName }: VideoCardDownloadButtonProps) => (
  <a
    className={styles.downloadButton}
    href={getVideoUrl(fileName)}
    download={fileName}
    onClick={(e) => e.stopPropagation()}
    aria-label="Скачать видео"
    title="Скачать"
  >
    <DownloadIcon />
  </a>
);
