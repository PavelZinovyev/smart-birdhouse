import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePiVideos } from '@/shared/api';
import { ROUTES } from '@/shared/constants/routes';
import type { PiVideoFile } from '@/shared/api';
import styles from './video-list.module.scss';
import { VideoListContent, type VideoListLayout } from './video-list-content';
import { VideoModal } from './video-modal';
import { MetricWidgetTitle } from '@/shared/ui';

interface VideoListProps {
  layout?: VideoListLayout;
}

const REFRESH_INTERVAL_MS = 10_000;

export const VideoList = ({ layout = 'carousel' }: VideoListProps) => {
  const { files, loading, error, isSuccess } = usePiVideos(REFRESH_INTERVAL_MS);
  const [selectedVideo, setSelectedVideo] = useState<PiVideoFile | null>(null);
  const isCarouselWithVideos = layout === 'carousel' && isSuccess && files.length > 0;

  const content = (
    <VideoListContent
      files={files}
      loading={loading}
      error={error}
      isSuccess={isSuccess}
      layout={layout}
      cardsAsLink={!isCarouselWithVideos}
      onVideoClick={setSelectedVideo}
    />
  );

  const title = <MetricWidgetTitle label="Видео с камеры" />;

  if (isCarouselWithVideos) {
    return (
      <>
        <Link to={ROUTES.VIDEOS} className={styles.widgetLink}>
          {title}
          <article aria-label="Видео с камеры">{content}</article>
        </Link>
        <VideoModal file={selectedVideo} onClose={() => setSelectedVideo(null)} />
      </>
    );
  }

  return (
    <>
      <article aria-label="videos">
        {title}
        {content}
      </article>
      <VideoModal file={selectedVideo} onClose={() => setSelectedVideo(null)} />
    </>
  );
};
