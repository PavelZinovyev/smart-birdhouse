import classNames from 'classnames';
import { type IPiVideoFile } from '@/shared/api/pi-videos';
import type { VideoListGridVariant, VideoListLayout } from '@/shared/types';
import { VideoListGrid } from '../video-list-grid/video-list-grid';
import { VideoListCarousel } from '../video-list-carousel/video-list-carousel';
import { VideoListSkeleton } from '../video-list-skeleton';
import carouselStyles from '../video-list-carousel/video-list-carousel.module.scss';
import gridStyles from '../video-list-grid/video-list-grid.module.scss';
import styles from './video-list-content.module.scss';

interface IVideoListContentProps {
  files: IPiVideoFile[];
  loading: boolean;
  error: string | null;
  isSuccess: boolean;
  layout: VideoListLayout;
  gridVariant?: VideoListGridVariant;
  cardsAsLink?: boolean;
  isDeleting?: boolean;
  deletingName?: string | null;
  onVideoClick?: (file: IPiVideoFile) => void;
  onDelete?: (file: IPiVideoFile) => void;
}

export const VideoListContent = ({
  files,
  loading,
  error,
  isSuccess,
  layout,
  gridVariant = 'small',
  cardsAsLink = true,
  onVideoClick,
  onDelete,
  isDeleting,
  deletingName,
}: IVideoListContentProps) => {
  const isEmpty = isSuccess && files.length === 0;
  const hasVideos = isSuccess && files.length > 0;
  const isError = error && !loading;

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
          <div
            className={classNames(gridStyles.root, gridVariant === 'large' && gridStyles.rootLarge)}
          >
            <VideoListSkeleton layout={layout} gridVariant={gridVariant} />
          </div>
        ))}
      {isError && (
        <p className={styles.error}>
          нет связи с raspberry pi(включите pi и подключите его к wi-fi скворечника SmartBirdhouse)
        </p>
      )}
      {isEmpty && <p className={styles.empty}>нет записей</p>}
      {hasVideos && layout === 'carousel' && (
        <VideoListCarousel
          files={files}
          cardsAsLink={cardsAsLink}
          onVideoClick={onVideoClick}
          onDelete={onDelete}
          isDeleting={isDeleting}
          deletingName={deletingName}
        />
      )}
      {hasVideos && layout === 'grid' && (
        <VideoListGrid
          files={files}
          variant={gridVariant}
          onVideoClick={onVideoClick}
          onDelete={onDelete}
          isDeleting={isDeleting}
          deletingName={deletingName}
        />
      )}
    </div>
  );
};
