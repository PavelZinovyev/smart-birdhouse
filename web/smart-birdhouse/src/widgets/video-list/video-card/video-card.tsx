import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getThumbnailUrl, getVideoUrl, type PiVideoFile } from '@/shared/api';
import { formatSize } from './lib/format-size';
import { formatDate } from './lib/format-date';
import classNames from 'classnames';
import styles from './video-card.module.scss';

export interface VideoCardProps {
  file: PiVideoFile;
  compact?: boolean;
  compactSmall?: boolean;
  to?: string;
  asDiv?: boolean;
}

export const VideoCard = ({
  file,
  compact = false,
  compactSmall = false,
  to,
  asDiv = false,
}: VideoCardProps) => {
  const thumbUrl = getThumbnailUrl(file.name);
  const videoUrl = getVideoUrl(file.name);
  const [thumbFailed, setThumbFailed] = useState(false);

  const content = (
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

  const className = classNames(
    styles.root,
    compact && styles.compact,
    compactSmall && styles.compactSmall,
  );

  if (asDiv) {
    return <div className={className}>{content}</div>;
  }

  if (to !== undefined) {
    return (
      <Link to={to} className={className} title={file.name}>
        {content}
      </Link>
    );
  }

  return (
    <a
      className={className}
      href={videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={file.name}
    >
      {content}
    </a>
  );
};
