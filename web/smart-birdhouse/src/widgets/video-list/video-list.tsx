import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDeletePiVideo, usePiVideos } from '@/shared/api';
import { ROUTES } from '@/shared/constants/routes';
import type { IPiVideoFile } from '@/shared/api';
import type { VideoListGridVariant, VideoListLayout } from '@/shared/types';
import { MetricWidgetTitle } from '@/shared/ui';
import styles from './video-list.module.scss';
import { VideoListContent } from './video-list-content';
import { VideoModal } from './video-modal';

interface IVideoListProps {
  layout?: VideoListLayout;
  gridVariant?: VideoListGridVariant;
}

const REFRESH_INTERVAL_MS = 10_000;
const LABEL = 'Видео с камеры';

export const VideoList = ({ layout = 'carousel', gridVariant = 'small' }: IVideoListProps) => {
  const { files, loading, error, isSuccess } = usePiVideos(REFRESH_INTERVAL_MS);
  const { deleteVideo, isDeleting, deletingName } = useDeletePiVideo();
  const [selectedVideo, setSelectedVideo] = useState<IPiVideoFile | null>(null);
  const isCarouselWithVideos = layout === 'carousel';
  const hasVideos = files.length > 0;
  const isErrorState = !!error && !loading && files.length === 0;
  const isEmpty = isSuccess && files.length === 0;
  const shouldShowCarouselWidget = isCarouselWithVideos && (loading || hasVideos);

  const handleDelete = (file: IPiVideoFile) => deleteVideo(file.name);

  const content = (
    <VideoListContent
      files={files}
      loading={loading}
      error={error}
      isSuccess={isSuccess}
      layout={layout}
      gridVariant={gridVariant}
      cardsAsLink={!isCarouselWithVideos}
      onVideoClick={setSelectedVideo}
      onDelete={handleDelete}
      isDeleting={isDeleting}
      deletingName={deletingName}
    />
  );

  const videoCount = files.length;
  const titleLabel = isCarouselWithVideos ? `${LABEL} (${videoCount})` : LABEL;
  const title = <MetricWidgetTitle label={titleLabel} />;

  if (isCarouselWithVideos) {
    if (!shouldShowCarouselWidget && (isEmpty || isErrorState)) {
      return null;
    }

    return (
      <>
        <Link to={ROUTES.VIDEOS} className={styles.widgetLink}>
          {title}
          <article aria-label={LABEL}>{content}</article>
        </Link>
        <VideoModal file={selectedVideo} onClose={() => setSelectedVideo(null)} />
      </>
    );
  }

  return (
    <>
      <article aria-label={LABEL}>{content}</article>
      <VideoModal file={selectedVideo} onClose={() => setSelectedVideo(null)} />
    </>
  );
};
