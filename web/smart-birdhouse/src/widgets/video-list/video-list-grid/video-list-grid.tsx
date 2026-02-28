import styles from './video-list-grid.module.scss';
import { VideoCard } from '../video-card/video-card';
import { type PiVideoFile } from '@/shared/api/pi-videos';

interface VideoListGridProps {
  files: PiVideoFile[];
  onVideoClick?: (file: PiVideoFile) => void;
}

export const VideoListGrid = ({ files, onVideoClick }: VideoListGridProps) => {
  return (
    <div className={styles.root} role="list">
      {files.map((file) => (
        <div key={file.name} role="listitem">
          <VideoCard file={file} compactSmall onVideoClick={onVideoClick} />
        </div>
      ))}
    </div>
  );
};
