import { Link } from 'react-router-dom';
import { getVideoUrl, type IPiVideoFile } from '@/shared/api';
import classNames from 'classnames';
import styles from './video-card.module.scss';
import { VideoCardContent } from './video-card-content';

export interface VideoCardProps {
  file: IPiVideoFile;
  compact?: boolean;
  compactSmall?: boolean;
  large?: boolean;
  to?: string;
  asDiv?: boolean;
  isDeleting?: boolean;
  onVideoClick?: (file: IPiVideoFile) => void;
  onDelete?: (file: IPiVideoFile) => void;
}

function handleCardKeyDown(
  e: React.KeyboardEvent,
  onVideoClick: (file: IPiVideoFile) => void,
  file: IPiVideoFile,
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
  large = false,
  to,
  asDiv = false,
  onVideoClick,
  onDelete,
  isDeleting = false,
}: VideoCardProps) => {
  const videoUrl = getVideoUrl(file.name);
  const cn = classNames(
    styles.root,
    compact && styles.compact,
    compactSmall && styles.compactSmall,
    large && styles.gridLarge,
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
        <VideoCardContent file={file} onDelete={onDelete} isDeleting={isDeleting} />
      </div>
    );
  }

  if (asDiv)
    return (
      <div className={cn}>
        <VideoCardContent file={file} onDelete={onDelete} isDeleting={isDeleting} />
      </div>
    );

  if (to !== undefined)
    return (
      <Link to={to} className={cn} title={file.name}>
        <VideoCardContent file={file} onDelete={onDelete} isDeleting={isDeleting} />
      </Link>
    );

  return (
    <a className={cn} href={videoUrl} target="_blank" rel="noopener noreferrer" title={file.name}>
      <VideoCardContent file={file} onDelete={onDelete} isDeleting={isDeleting} />
    </a>
  );
};
