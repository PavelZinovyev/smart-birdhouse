import { useState } from 'react';
import { useDeletePiVideo, usePiVideos } from '@/shared/api';
import type { IPiVideoFile } from '@/shared/api';
import type { VideoListGridVariant, VideoListLayout } from '@/shared/types';
import { MetricWidgetTitle } from '@/shared/ui';
import { VideoListContent } from './video-list-content';
import { VideoModal } from './video-modal';
import { VideoListCarouselView } from './video-list-carousel-view';
import { PageLayout } from '@/pages/layout';

interface IVideoListProps {
  layout?: VideoListLayout;
  gridVariant?: VideoListGridVariant;
}

const REFRESH_INTERVAL_MS = 10_000;
const CAMERA_VIDEOS_LABEL = 'Видео с камеры';

export const VideoList = ({ layout = 'carousel', gridVariant = 'small' }: IVideoListProps) => {
  const { files, loading, error, isSuccess } = usePiVideos(REFRESH_INTERVAL_MS);
  const { deleteVideo, isDeleting, deletingName } = useDeletePiVideo();
  const [selectedVideo, setSelectedVideo] = useState<IPiVideoFile | null>(null);
  const isCarouselWithVideos = layout === 'carousel';
  const hasVideos = files.length > 0;
  const isErrorState = !!error && !loading && files.length === 0;
  const isEmpty = isSuccess && files.length === 0;
  const shouldShowCarouselWidget = isCarouselWithVideos && (loading || hasVideos);

  if (isCarouselWithVideos && isErrorState) {
    return null;
  }

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
  const titleLabel = isCarouselWithVideos
    ? `${CAMERA_VIDEOS_LABEL} (${videoCount})`
    : CAMERA_VIDEOS_LABEL;
  const title = <MetricWidgetTitle label={titleLabel} />;

  if (isCarouselWithVideos) {
    if (!shouldShowCarouselWidget && (isEmpty || isErrorState)) {
      return null;
    }
    return (
      <VideoListCarouselView
        title={title}
        content={content}
        selectedVideo={selectedVideo}
        onCloseModal={() => setSelectedVideo(null)}
        ariaLabel={CAMERA_VIDEOS_LABEL}
      />
    );
  }

  return (
    <PageLayout>
      <article aria-label={CAMERA_VIDEOS_LABEL}>{content}</article>
      <VideoModal file={selectedVideo} onClose={() => setSelectedVideo(null)} />
    </PageLayout>
  );
};
