import { Link } from 'react-router-dom';
import { usePiVideos } from '@/shared/api';
import { ROUTES } from '@/shared/constants/routes';
import styles from './video-list.module.scss';
import { VideoListContent, type VideoListLayout } from './video-list-content';

interface VideoListProps {
  layout?: VideoListLayout;
}

const REFRESH_INTERVAL_MS = 10_000;

export const VideoList = ({ layout = 'carousel' }: VideoListProps) => {
  const { files, loading, error, isSuccess } = usePiVideos(REFRESH_INTERVAL_MS);
  const isCarouselWithVideos = layout === 'carousel' && isSuccess && files.length > 0;

  const content = (
    <VideoListContent
      files={files}
      loading={loading}
      error={error}
      isSuccess={isSuccess}
      layout={layout}
      cardsAsLink={!isCarouselWithVideos}
    />
  );

  if (isCarouselWithVideos) {
    return (
      <Link to={ROUTES.VIDEOS} className={styles.widgetLink}>
        <article aria-label="Видео с камеры">{content}</article>
      </Link>
    );
  }

  return <article aria-label="videos">{content}</article>;
};
