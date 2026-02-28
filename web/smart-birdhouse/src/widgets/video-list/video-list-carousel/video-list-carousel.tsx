import { Carousel } from '@/shared/ui';
import { VideoCard } from '../video-card/video-card';
import { type PiVideoFile } from '@/shared/api/pi-videos';
import { ROUTES } from '@/shared/constants/routes';
import styles from './video-list-carousel.module.scss';

interface VideoListCarouselProps {
  files: PiVideoFile[];
  /** false — карточки не ссылки (весь виджет обёрнут в ссылку) */
  cardsAsLink?: boolean;
}

export const VideoListCarousel = ({
  files,
  cardsAsLink = true,
}: VideoListCarouselProps) => {
  return (
    <div className={styles.root}>
      <Carousel
        orientation="horizontal"
        extendBy="var(--space-5)"
        className={styles.carousel}
        ariaLabel="videos"
      >
        {files.map((file) => (
          <div key={file.name} role="listitem">
            <VideoCard
              file={file}
              compact
              to={cardsAsLink ? ROUTES.VIDEOS : undefined}
              asDiv={!cardsAsLink}
            />
          </div>
        ))}
      </Carousel>
    </div>
  );
};
