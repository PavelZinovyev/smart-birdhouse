import { Link } from 'react-router-dom';
import { usePiVideos } from '@/shared/api';
import { ROUTES } from '@/shared/constants/routes';
import styles from './video-list.module.scss';
import { VideoListContent, type VideoListLayout } from './video-list-content';
import { MetricWidgetTitle } from '@/shared/ui';

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

  const title = <MetricWidgetTitle label="Видео с камеры" />;

  if (isCarouselWithVideos) {
    return (
      <Link to={ROUTES.VIDEOS} className={styles.widgetLink}>
        {title}
        <article aria-label="Видео с камеры">{content}</article>
      </Link>
    );
  }

  return (
    <article aria-label="videos">
      {title}
      {content}
    </article>
  );
};
