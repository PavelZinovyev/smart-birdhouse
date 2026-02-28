import { Carousel } from '@/shared/ui';
import { VideoCardSkeleton } from '../video-card-skeleton';
import { type VideoListLayout } from '../video-list-content/video-list-content';
import styles from './video-list-skeleton.module.scss';

const CAROUSEL_SKELETON_COUNT = 5;
const GRID_SKELETON_COUNT = 12;

interface VideoListSkeletonProps {
  layout: VideoListLayout;
}

export const VideoListSkeleton = ({ layout }: VideoListSkeletonProps) => {
  if (layout === 'carousel') {
    return (
      <Carousel
        orientation="horizontal"
        extendBy="var(--space-5)"
        className={styles.carousel}
        ariaLabel="Загрузка видео"
      >
        {Array.from({ length: CAROUSEL_SKELETON_COUNT }, (_, i) => (
          <div key={i} role="listitem">
            <VideoCardSkeleton variant="compact" />
          </div>
        ))}
      </Carousel>
    );
  }

  return (
    <>
      {Array.from({ length: GRID_SKELETON_COUNT }, (_, i) => (
        <VideoCardSkeleton key={i} variant="compactSmall" />
      ))}
    </>
  );
};
