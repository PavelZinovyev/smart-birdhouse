import classNames from 'classnames';
import styles from './video-list-grid.module.scss';
import { VideoCard } from '../video-card/video-card';
import { type PiVideoFile } from '@/shared/api/pi-videos';

export type VideoListGridVariant = 'small' | 'large';

interface VideoListGridProps {
  files: PiVideoFile[];
  variant?: VideoListGridVariant;
  onVideoClick?: (file: PiVideoFile) => void;
}

export const VideoListGrid = ({ files, variant = 'small', onVideoClick }: VideoListGridProps) => {
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
          />
        </div>
      ))}
    </div>
  );
};
