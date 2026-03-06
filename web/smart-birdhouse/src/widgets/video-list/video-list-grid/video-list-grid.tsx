import classNames from 'classnames';
import { type IPiVideoFile } from '@/shared/api/pi-videos';
import type { VideoListGridVariant } from '@/shared/types';
import styles from './video-list-grid.module.scss';
import { VideoCard } from '../video-card/video-card';

interface IVideoListGridProps {
  files: IPiVideoFile[];
  variant?: VideoListGridVariant;
  isDeleting?: boolean;
  deletingName?: string | null;
  onVideoClick?: (file: IPiVideoFile) => void;
  onDelete?: (file: IPiVideoFile) => void;
}

export const VideoListGrid = ({
  files,
  variant = 'small',
  isDeleting,
  deletingName,
  onVideoClick,
  onDelete,
}: IVideoListGridProps) => {
  const isLarge = variant === 'large';

  return (
    <div className={classNames(styles.root, isLarge && styles.rootLarge)} role="list">
      {files.map((file) => (
        <div key={file.name} role="listitem">
          <VideoCard
            file={file}
            compactSmall={!isLarge}
            large={isLarge}
            onVideoClick={onVideoClick}
            onDelete={onDelete}
            isDeleting={isDeleting && deletingName === file.name}
          />
        </div>
      ))}
    </div>
  );
};
