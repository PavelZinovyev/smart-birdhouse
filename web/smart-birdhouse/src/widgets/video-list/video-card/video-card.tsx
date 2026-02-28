import { Link } from 'react-router-dom';
import { getVideoUrl, type PiVideoFile } from '@/shared/api';
import classNames from 'classnames';
import styles from './video-card.module.scss';
import { VideoCardContent } from './video-card-content';

export interface VideoCardProps {
  file: PiVideoFile;
  compact?: boolean;
  compactSmall?: boolean;
  to?: string;
  asDiv?: boolean;
  onVideoClick?: (file: PiVideoFile) => void;
}

function handleCardKeyDown(
  e: React.KeyboardEvent,
  onVideoClick: (file: PiVideoFile) => void,
  file: PiVideoFile,
) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    onVideoClick(file);
  }
}

export const VideoCard = ({
  file,
  compact = false,
  compactSmall = false,
  to,
  asDiv = false,
  onVideoClick,
}: VideoCardProps) => {
  const videoUrl = getVideoUrl(file.name);
  const cn = classNames(
    styles.root,
    compact && styles.compact,
    compactSmall && styles.compactSmall,
  );

  if (onVideoClick !== undefined) {
    return (
      <div
        className={cn}
        role="button"
        tabIndex={0}
        title={file.name}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onVideoClick(file);
        }}
        onKeyDown={(e) => handleCardKeyDown(e, onVideoClick, file)}
      >
        <VideoCardContent file={file} />
      </div>
    );
  }

  if (asDiv)
    return (
      <div className={cn}>
        <VideoCardContent file={file} />
      </div>
    );

  if (to !== undefined)
    return (
      <Link to={to} className={cn} title={file.name}>
        <VideoCardContent file={file} />
      </Link>
    );

  return (
    <a className={cn} href={videoUrl} target="_blank" rel="noopener noreferrer" title={file.name}>
      <VideoCardContent file={file} />
    </a>
  );
};
