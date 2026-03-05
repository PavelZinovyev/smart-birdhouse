import { Carousel } from '@/shared/ui';
import { VideoCardSkeleton } from '../video-card/video-card-skeleton';
import type { VideoListGridVariant } from '../video-list-grid/video-list-grid';
import { type VideoListLayout } from '../video-list-content/video-list-content';
import styles from './video-list-skeleton.module.scss';

const CAROUSEL_SKELETON_COUNT = 5;
const GRID_SKELETON_COUNT = 12;
const GRID_LARGE_SKELETON_COUNT = 4;

interface VideoListSkeletonProps {
  layout: VideoListLayout;
  gridVariant?: VideoListGridVariant;
}

export const VideoListSkeleton = ({ layout, gridVariant = 'small' }: VideoListSkeletonProps) => {
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

  const isLarge = gridVariant === 'large';
  const count = isLarge ? GRID_LARGE_SKELETON_COUNT : GRID_SKELETON_COUNT;
  const variant = isLarge ? 'large' : 'compactSmall';

  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <VideoCardSkeleton key={i} variant={variant} />
      ))}
    </>
  );
};
