import type { IPiVideoFile } from '@/shared/api';
import { VideoCardInfo } from './video-card-info';
import { VideoCardThumb } from './video-card-thumb';

export interface VideoCardContentProps {
  file: IPiVideoFile;
  onDelete?: (file: IPiVideoFile) => void;
  isDeleting?: boolean;
}

export const VideoCardContent = ({ file, onDelete, isDeleting }: VideoCardContentProps) => (
  <>
    <VideoCardThumb fileName={file.name} />
    <VideoCardInfo
      fileName={file.name}
      size={file.size}
      mtime={file.mtime}
      onDelete={onDelete ? () => onDelete(file) : undefined}
      isDeleting={isDeleting}
    />
  </>
);
