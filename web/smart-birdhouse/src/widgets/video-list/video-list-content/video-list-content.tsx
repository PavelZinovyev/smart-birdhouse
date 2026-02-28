import { VideoListGrid } from '../video-list-grid/video-list-grid';
import { VideoListCarousel } from '../video-list-carousel/video-list-carousel';
import { type PiVideoFile } from '@/shared/api/pi-videos';
import styles from './video-list-content.module.scss';

export type VideoListLayout = 'carousel' | 'grid';

interface VideoListContentProps {
  files: PiVideoFile[];
  loading: boolean;
  error: string | null;
  isSuccess: boolean;
  layout: VideoListLayout;
  /** false — карточки в карусели не ссылки (виджет обёрнут в ссылку) */
  cardsAsLink?: boolean;
}

export const VideoListContent = ({
  files,
  loading,
  error,
  isSuccess,
  layout,
  cardsAsLink = true,
}: VideoListContentProps) => {
  const isEmpty = isSuccess && files.length === 0;
  const hasVideos = isSuccess && files.length > 0;

  return (
    <>
      <div>
        {loading && <p className={styles.empty}>загрузка…</p>}
        {error && !loading && (
          <p className={styles.error}>
            нет связи с raspberry pi(включите pi и подключите его к wi-fi скворечника
            SmartBirdhouse)
          </p>
        )}
        {isEmpty && <p className={styles.empty}>нет записей</p>}
        {hasVideos && layout === 'carousel' && (
          <VideoListCarousel files={files} cardsAsLink={cardsAsLink} />
        )}
        {hasVideos && layout === 'grid' && <VideoListGrid files={files} />}
      </div>
    </>
  );
};
