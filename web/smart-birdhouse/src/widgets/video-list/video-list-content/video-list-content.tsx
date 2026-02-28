import { VideoListGrid } from '../video-list-grid/video-list-grid';
import { VideoListCarousel } from '../video-list-carousel/video-list-carousel';
import { VideoListSkeleton } from '../video-list-skeleton';
import { type PiVideoFile } from '@/shared/api/pi-videos';
import carouselStyles from '../video-list-carousel/video-list-carousel.module.scss';
import gridStyles from '../video-list-grid/video-list-grid.module.scss';
import styles from './video-list-content.module.scss';

export type VideoListLayout = 'carousel' | 'grid';

interface VideoListContentProps {
  files: PiVideoFile[];
  loading: boolean;
  error: string | null;
  isSuccess: boolean;
  layout: VideoListLayout;
  cardsAsLink?: boolean;
  onVideoClick?: (file: PiVideoFile) => void;
}

export const VideoListContent = ({
  files,
  loading,
  error,
  isSuccess,
  layout,
  cardsAsLink = true,
  onVideoClick,
}: VideoListContentProps) => {
  const isEmpty = isSuccess && files.length === 0;
  const hasVideos = isSuccess && files.length > 0;

  return (
    <div>
      {loading &&
        (layout === 'carousel' ? (
          <div className={carouselStyles.root}>
            <div className={carouselStyles.carousel}>
              <VideoListSkeleton layout={layout} />
            </div>
          </div>
        ) : (
          <div className={gridStyles.root}>
            <VideoListSkeleton layout={layout} />
          </div>
        ))}
      {error && !loading && (
        <p className={styles.error}>
          нет связи с raspberry pi(включите pi и подключите его к wi-fi скворечника SmartBirdhouse)
        </p>
      )}
      {isEmpty && <p className={styles.empty}>нет записей</p>}
      {hasVideos && layout === 'carousel' && (
        <VideoListCarousel files={files} cardsAsLink={cardsAsLink} onVideoClick={onVideoClick} />
      )}
      {hasVideos && layout === 'grid' && (
        <VideoListGrid files={files} onVideoClick={onVideoClick} />
      )}
    </div>
  );
};
