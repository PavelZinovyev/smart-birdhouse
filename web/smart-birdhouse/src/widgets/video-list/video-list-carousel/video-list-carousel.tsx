import { Carousel } from '@/shared/ui';
import { VideoCard } from '../video-card/video-card';
import { type IPiVideoFile } from '@/shared/api/pi-videos';
import { ROUTES } from '@/shared/constants/routes';
import styles from './video-list-carousel.module.scss';

interface IVideoListCarouselProps {
  files: IPiVideoFile[];
  cardsAsLink?: boolean;
  isDeleting?: boolean;
  deletingName?: string | null;
  onVideoClick?: (file: IPiVideoFile) => void;
  onDelete?: (file: IPiVideoFile) => void;
}

export const VideoListCarousel = ({
  files,
  cardsAsLink = true,
  isDeleting,
  deletingName,
  onVideoClick,
  onDelete,
}: IVideoListCarouselProps) => {
  return (
    <div className={styles.root}>
      <Carousel
        orientation="horizontal"
        extendBy="var(--space-4)"
        className={styles.carousel}
        ariaLabel="videos"
      >
        {files.map((file) => (
          <div key={file.name} role="listitem">
            <VideoCard
              file={file}
              compact
              to={cardsAsLink && !onVideoClick ? ROUTES.VIDEOS : undefined}
              asDiv={!cardsAsLink && !onVideoClick}
              onVideoClick={onVideoClick}
              onDelete={onDelete}
              isDeleting={isDeleting && deletingName === file.name}
            />
          </div>
        ))}
      </Carousel>
    </div>
  );
};
